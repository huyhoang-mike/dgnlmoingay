"""
ĐGNL Mỗi Ngày - Payment Order Model
Tracks SePay bank-transfer orders and enrollment grant state.
"""

import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PaymentOrder(Base):
    __tablename__ = "payment_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_code: Mapped[str] = mapped_column(
        String(64), unique=True, nullable=False, index=True
    )
    provider: Mapped[str] = mapped_column(String(32), default="sepay", nullable=False)

    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    google_email: Mapped[str | None] = mapped_column(
        String(255), nullable=True, index=True
    )
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    expected_amount: Mapped[int] = mapped_column(Integer, nullable=False)
    paid_amount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    transfer_content: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)

    # pending | partial | paid_waiting_email | paid | expired | failed
    status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False)
    provider_transaction_id: Mapped[str | None] = mapped_column(
        String(255), unique=True, nullable=True
    )
    provider_payload: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
        nullable=False,
    )
    expires_at: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True)
    paid_at: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True)
    access_granted_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime, nullable=True
    )
