"""
ĐGNL Mỗi Ngày - Lesson Model
"""

import datetime
from sqlalchemy import Integer, String, Text, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0)

    # Course structure
    category: Mapped[str] = mapped_column(
        String(50), nullable=False, default="nentang", index=True
    )  # nentang | luyende | thucchien
    subject: Mapped[str | None] = mapped_column(
        String(100), nullable=True, index=True
    )  # tieng_viet, toan, ly, hoa, etc.

    # Google Drive video file ID
    video_drive_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # PDF material URL / Drive ID
    pdf_drive_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Optional answer PDF URL / Drive ID
    answer_pdf_drive_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Content (Markdown or HTML)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    is_free: Mapped[bool] = mapped_column(Boolean, default=False)  # Free preview content

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )
