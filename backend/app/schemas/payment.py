"""
ĐGNL Mỗi Ngày - Payment Schemas
"""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class PaymentOrderCreate(BaseModel):
    google_email: EmailStr | None = None
    full_name: str | None = Field(default=None, max_length=255)


class PaymentOrderBindEmail(BaseModel):
    google_email: EmailStr


class PaymentOrderOut(BaseModel):
    order_code: str
    status: str
    provider: str
    google_email: str | None = None
    full_name: str | None = None
    expected_amount: int
    paid_amount: int | None = None
    transfer_content: str

    bank_name: str
    bank_account_number: str
    bank_account_name: str
    qr_image_url: str

    created_at: datetime
    expires_at: datetime | None = None
    paid_at: datetime | None = None
    access_granted_at: datetime | None = None
    is_access_granted: bool = False

    zalo_group_url: str | None = None
    youtube_guide_url: str | None = None
    support_zalo_url: str | None = None


class PaymentWebhookAck(BaseModel):
    accepted: bool = True
    order_code: str | None = None
    status: str | None = None
    reason: str | None = None
