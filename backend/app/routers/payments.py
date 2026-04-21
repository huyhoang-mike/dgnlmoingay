"""
ĐGNL Mỗi Ngày - Payments Router
SePay-based bank transfer flow with automatic enrollment updates.
"""

import datetime
import hmac
import re
import secrets
from decimal import Decimal, InvalidOperation
from typing import Any, Optional
from urllib.parse import quote_plus

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.config import settings
from app.database import get_db
from app.models.payment_order import PaymentOrder
from app.models.user import User
from app.schemas.payment import (
    PaymentOrderBindEmail,
    PaymentOrderCreate,
    PaymentOrderOut,
    PaymentWebhookAck,
)

router = APIRouter()


def _utcnow() -> datetime.datetime:
    return datetime.datetime.utcnow()


def _order_prefix() -> str:
    prefix = re.sub(r"[^A-Za-z0-9]", "", settings.PAYMENT_ORDER_PREFIX.upper())
    return prefix or "DGNL"


def _normalize_email(email: Optional[str]) -> Optional[str]:
    if not email:
        return None
    return email.strip().lower()


def _build_transfer_content(order_code: str) -> str:
    return f"DK {order_code}"


def _build_qr_image_url(order: PaymentOrder) -> str:
    bank_bin = settings.BANK_BIN.strip()
    account_number = settings.BANK_ACCOUNT_NUMBER.strip()
    account_name = settings.BANK_ACCOUNT_NAME.strip()
    if not bank_bin or not account_number or not account_name:
        return ""

    add_info = quote_plus(order.transfer_content)
    encoded_account_name = quote_plus(account_name)
    return (
        f"https://img.vietqr.io/image/{bank_bin}-{account_number}-compact2.png"
        f"?amount={order.expected_amount}&addInfo={add_info}&accountName={encoded_account_name}"
    )


def _serialize_order(order: PaymentOrder) -> PaymentOrderOut:
    show_course_links = order.status == "paid"
    return PaymentOrderOut(
        order_code=order.order_code,
        status=order.status,
        provider=order.provider,
        google_email=order.google_email,
        full_name=order.full_name,
        expected_amount=order.expected_amount,
        paid_amount=order.paid_amount,
        transfer_content=order.transfer_content,
        bank_name=settings.BANK_NAME,
        bank_account_number=settings.BANK_ACCOUNT_NUMBER,
        bank_account_name=settings.BANK_ACCOUNT_NAME,
        qr_image_url=_build_qr_image_url(order),
        created_at=order.created_at,
        expires_at=order.expires_at,
        paid_at=order.paid_at,
        access_granted_at=order.access_granted_at,
        is_access_granted=bool(order.access_granted_at),
        zalo_group_url=(
            settings.COURSE_ZALO_GROUP_URL.strip() or None if show_course_links else None
        ),
        youtube_guide_url=(
            settings.COURSE_YOUTUBE_GUIDE_URL.strip() or None if show_course_links else None
        ),
        support_zalo_url=settings.SUPPORT_ZALO_URL.strip() or None,
    )


async def _generate_unique_order_code(db: AsyncSession) -> str:
    prefix = _order_prefix()
    for _ in range(8):
        candidate = (
            f"{prefix}{_utcnow().strftime('%y%m%d%H%M%S')}{secrets.token_hex(2).upper()}"
        )
        result = await db.execute(
            select(PaymentOrder.id).where(PaymentOrder.order_code == candidate)
        )
        if result.scalar_one_or_none() is None:
            return candidate

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Không thể tạo mã thanh toán duy nhất. Vui lòng thử lại.",
    )


def _expire_if_needed(order: PaymentOrder) -> None:
    if order.status == "pending" and order.expires_at and order.expires_at <= _utcnow():
        order.status = "expired"


def _extract_payload_value(payload: dict[str, Any], keys: list[str]) -> Any:
    for key in keys:
        value = payload.get(key)
        if value not in (None, ""):
            return value

    data = payload.get("data")
    if isinstance(data, dict):
        for key in keys:
            value = data.get(key)
            if value not in (None, ""):
                return value

    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                for key in keys:
                    value = item.get(key)
                    if value not in (None, ""):
                        return value

    return None


def _parse_amount(raw: Any) -> Optional[int]:
    if raw is None or isinstance(raw, bool):
        return None
    if isinstance(raw, int):
        return raw
    if isinstance(raw, float):
        return int(raw)
    if isinstance(raw, str):
        cleaned = re.sub(r"[^\d.\-]", "", raw)
        if not cleaned:
            return None
        try:
            return int(Decimal(cleaned))
        except (InvalidOperation, ValueError):
            return None
    return None


def _extract_order_code(text: Optional[str]) -> Optional[str]:
    if not text:
        return None
    pattern = rf"{re.escape(_order_prefix())}[A-Z0-9]{{8,24}}"
    match = re.search(pattern, text.upper())
    if not match:
        return None
    return match.group(0)


def _extract_webhook_secret(request: Request) -> Optional[str]:
    configured_header = (settings.SEPAY_WEBHOOK_HEADER or "").strip()
    token: Optional[str] = None

    if configured_header:
        token = request.headers.get(configured_header)
    if not token:
        token = request.headers.get("x-sepay-token")
    if not token:
        token = request.headers.get("authorization")

    if not token:
        return None

    token = token.strip()
    if token.lower().startswith("bearer "):
        token = token[7:].strip()
    elif token.lower().startswith("apikey "):
        token = token[7:].strip()
    return token or None


def _verify_webhook_secret(request: Request) -> None:
    expected_secret = settings.SEPAY_WEBHOOK_SECRET.strip()
    if not expected_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Webhook chưa được cấu hình secret.",
        )

    provided_secret = _extract_webhook_secret(request)
    if not provided_secret or not hmac.compare_digest(provided_secret, expected_secret):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Webhook secret không hợp lệ.",
        )


async def _get_or_create_user(
    email: str,
    full_name: Optional[str],
    db: AsyncSession,
) -> User:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user:
        if full_name and (not user.name or user.name == email.split("@")[0]):
            user.name = full_name.strip()
        return user

    user = User(
        email=email,
        name=(full_name.strip() if full_name else email.split("@")[0]),
        picture=None,
        google_id=None,
        is_enrolled=False,
        is_admin=False,
    )
    db.add(user)
    await db.flush()
    return user


async def _grant_access(order: PaymentOrder, db: AsyncSession) -> None:
    if not order.google_email:
        order.status = "paid_waiting_email"
        return

    normalized_email = _normalize_email(order.google_email)
    if not normalized_email:
        order.status = "paid_waiting_email"
        return

    user = await _get_or_create_user(normalized_email, order.full_name, db)
    user.is_enrolled = True

    order.google_email = normalized_email
    order.user_id = user.id
    order.status = "paid"
    if not order.access_granted_at:
        order.access_granted_at = _utcnow()


@router.post(
    "/orders",
    response_model=PaymentOrderOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_order(
    data: PaymentOrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Create a new transfer order and return dynamic VietQR payment info."""
    if (
        not settings.BANK_BIN.strip()
        or not settings.BANK_ACCOUNT_NUMBER.strip()
        or not settings.BANK_ACCOUNT_NAME.strip()
    ):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Thông tin tài khoản nhận tiền chưa được cấu hình.",
        )

    requested_email = _normalize_email(data.google_email)
    if current_user and requested_email and requested_email != current_user.email.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email nhập vào phải trùng email Google đang đăng nhập.",
        )

    google_email = requested_email or (
        _normalize_email(current_user.email) if current_user else None
    )
    full_name = (data.full_name or (current_user.name if current_user else "") or "").strip()
    full_name = full_name or None

    order_code = await _generate_unique_order_code(db)
    order = PaymentOrder(
        order_code=order_code,
        provider=settings.PAYMENT_PROVIDER,
        google_email=google_email,
        full_name=full_name,
        expected_amount=settings.COURSE_PRICE_VND,
        paid_amount=None,
        transfer_content=_build_transfer_content(order_code),
        status="pending",
        provider_transaction_id=None,
        provider_payload=None,
        expires_at=_utcnow()
        + datetime.timedelta(minutes=max(5, settings.PAYMENT_ORDER_EXPIRY_MINUTES)),
    )

    if google_email:
        user = await _get_or_create_user(google_email, full_name, db)
        order.user_id = user.id

    db.add(order)
    await db.flush()
    await db.refresh(order)
    return _serialize_order(order)


@router.get("/orders/{order_code}", response_model=PaymentOrderOut)
async def get_order_status(
    order_code: str,
    db: AsyncSession = Depends(get_db),
):
    """Check payment status for polling from frontend."""
    normalized_code = order_code.strip().upper()
    result = await db.execute(
        select(PaymentOrder).where(PaymentOrder.order_code == normalized_code)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Không tìm thấy mã thanh toán")

    _expire_if_needed(order)

    # Safety net: if payment already confirmed but access was not granted yet,
    # grant it as soon as email is available.
    if order.paid_at and order.status != "paid" and order.google_email:
        await _grant_access(order, db)

    await db.flush()
    await db.refresh(order)
    return _serialize_order(order)


@router.patch("/orders/{order_code}/email", response_model=PaymentOrderOut)
async def bind_order_email(
    order_code: str,
    data: PaymentOrderBindEmail,
    db: AsyncSession = Depends(get_db),
):
    """Bind or update Google email before/after payment to grant access."""
    normalized_code = order_code.strip().upper()
    result = await db.execute(
        select(PaymentOrder).where(PaymentOrder.order_code == normalized_code)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Không tìm thấy mã thanh toán")

    if order.status == "expired":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã thanh toán đã hết hạn, vui lòng tạo mã mới.",
        )

    email = _normalize_email(data.google_email)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email Google không hợp lệ.",
        )

    user = await _get_or_create_user(email, order.full_name, db)
    order.google_email = email
    order.user_id = user.id

    if order.paid_at or order.status == "paid_waiting_email":
        await _grant_access(order, db)

    await db.flush()
    await db.refresh(order)
    return _serialize_order(order)


@router.post("/sepay/webhook", response_model=PaymentWebhookAck)
async def sepay_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Receive SePay transfer webhook and update order/enrollment status."""
    _verify_webhook_secret(request)

    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payload webhook không phải JSON hợp lệ.",
        )

    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payload webhook phải là object.",
        )

    raw_content = _extract_payload_value(
        payload,
        [
            "content",
            "transferContent",
            "description",
            "transaction_content",
            "remark",
            "note",
        ],
    )
    raw_amount = _extract_payload_value(
        payload,
        ["amount", "transferAmount", "transfer_amount", "value", "creditAmount"],
    )
    raw_transaction_id = _extract_payload_value(
        payload,
        [
            "id",
            "transactionId",
            "transaction_id",
            "referenceCode",
            "reference_code",
            "code",
        ],
    )

    content = str(raw_content).strip() if raw_content is not None else ""
    amount = _parse_amount(raw_amount)
    transaction_id = str(raw_transaction_id).strip() if raw_transaction_id else None

    order_code = _extract_order_code(content)
    if not order_code:
        explicit_order_code = _extract_payload_value(
            payload,
            ["order_code", "orderCode", "order_id", "orderId"],
        )
        if explicit_order_code:
            order_code = str(explicit_order_code).strip().upper()

    if not order_code:
        return PaymentWebhookAck(accepted=True, reason="order_code_not_found")

    result = await db.execute(
        select(PaymentOrder).where(PaymentOrder.order_code == order_code)
    )
    order = result.scalar_one_or_none()
    if not order:
        return PaymentWebhookAck(
            accepted=True,
            order_code=order_code,
            reason="order_not_found",
        )

    order.provider_payload = payload

    if transaction_id:
        duplicate_tx = await db.execute(
            select(PaymentOrder.order_code).where(
                PaymentOrder.provider_transaction_id == transaction_id
            )
        )
        duplicate_order_code = duplicate_tx.scalar_one_or_none()
        if duplicate_order_code and duplicate_order_code != order.order_code:
            return PaymentWebhookAck(
                accepted=True,
                order_code=order.order_code,
                status=order.status,
                reason="duplicate_transaction_id",
            )
        if not order.provider_transaction_id:
            order.provider_transaction_id = transaction_id

    if amount is not None:
        order.paid_amount = amount

    if amount is None or amount <= 0:
        await db.flush()
        return PaymentWebhookAck(
            accepted=True,
            order_code=order.order_code,
            status=order.status,
            reason="amount_invalid",
        )

    if amount < order.expected_amount:
        if order.status != "paid":
            order.status = "partial"
        await db.flush()
        return PaymentWebhookAck(
            accepted=True,
            order_code=order.order_code,
            status=order.status,
            reason="amount_less_than_expected",
        )

    if not order.paid_at:
        order.paid_at = _utcnow()

    if order.status != "paid":
        if order.google_email:
            await _grant_access(order, db)
        else:
            order.status = "paid_waiting_email"

    await db.flush()
    return PaymentWebhookAck(
        accepted=True,
        order_code=order.order_code,
        status=order.status,
    )
