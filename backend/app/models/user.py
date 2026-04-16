"""
ĐGNL Mỗi Ngày - User Model
Stores Google OAuth user info and enrollment status.
"""

import datetime
from sqlalchemy import Integer, String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    picture: Mapped[str | None] = mapped_column(String(500), nullable=True)
    google_id: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False
    )

    # Student info
    enrollment_year: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )  # Năm nhập học (vd: 2026)
    course_type: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )  # Loại khóa học: "tu_luyen" | "co_ban" | "nang_cao"

    # Access control
    is_enrolled: Mapped[bool] = mapped_column(Boolean, default=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    last_login: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
