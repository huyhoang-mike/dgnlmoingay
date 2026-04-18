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
    # Nullable so admins can pre-register a student by email before they
    # actually sign in via Google. Set on first successful Google login.
    google_id: Mapped[str | None] = mapped_column(
        String(255), unique=True, nullable=True
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

    @property
    def has_logged_in(self) -> bool:
        """True once the student has actually authenticated via Google
        (i.e. ``google_id`` has been populated). False for accounts
        created in advance by an admin via /api/auth/users."""
        return self.google_id is not None
