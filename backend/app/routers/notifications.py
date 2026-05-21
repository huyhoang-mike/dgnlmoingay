"""ĐGNL Mỗi Ngày - Notifications Router

In-app notifications for:
- Students: when their Q&A question receives a new answer.
- Admin: broadcast announcements to students.
"""

import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, insert, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_admin, require_auth
from app.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import (
    NotificationBroadcastIn,
    NotificationBroadcastOut,
    NotificationListOut,
    NotificationMarkAllReadOut,
    NotificationOut,
)

router = APIRouter()


@router.get("/", response_model=NotificationListOut)
async def list_notifications(
    limit: int = 20,
    offset: int = 0,
    user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    limit = max(1, min(limit, 50))
    offset = max(0, offset)

    items_result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    items = items_result.scalars().all()

    unread_count = await db.scalar(
        select(func.count())
        .select_from(Notification)
        .where(Notification.user_id == user.id, Notification.is_read.is_(False))
    )

    return NotificationListOut(
        unread_count=int(unread_count or 0),
        items=[NotificationOut.model_validate(item) for item in items],
    )


@router.patch("/{notification_id}/read", response_model=NotificationOut)
async def mark_notification_read(
    notification_id: int,
    user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id, Notification.user_id == user.id)
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    if not notification.is_read:
        notification.is_read = True
        notification.read_at = datetime.datetime.utcnow()
        await db.flush()
        await db.refresh(notification)

    return NotificationOut.model_validate(notification)


@router.post("/mark-all-read", response_model=NotificationMarkAllReadOut)
async def mark_all_notifications_read(
    user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.datetime.utcnow()
    result = await db.execute(
        update(Notification)
        .where(Notification.user_id == user.id, Notification.is_read.is_(False))
        .values(is_read=True, read_at=now)
    )
    return NotificationMarkAllReadOut(updated_count=int(result.rowcount or 0))


@router.post("/broadcast", response_model=NotificationBroadcastOut, status_code=status.HTTP_201_CREATED)
async def broadcast_notification(
    payload: NotificationBroadcastIn,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.datetime.utcnow()

    recipients_stmt = select(User.id)
    if payload.target == "enrolled":
        recipients_stmt = recipients_stmt.where(User.is_enrolled.is_(True))

    recipients_result = await db.execute(recipients_stmt)
    recipient_ids = [row[0] for row in recipients_result.all()]

    if not recipient_ids:
        return NotificationBroadcastOut(created_count=0)

    rows = [
        {
            "user_id": user_id,
            "type": "admin_broadcast",
            "title": payload.title.strip(),
            "body": payload.body.strip() if payload.body else None,
            "url": payload.url.strip() if payload.url else None,
            "is_read": False,
            "created_at": now,
            "read_at": None,
        }
        for user_id in recipient_ids
    ]

    await db.execute(insert(Notification), rows)

    return NotificationBroadcastOut(created_count=len(rows))
