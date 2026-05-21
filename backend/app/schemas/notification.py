"""ĐGNL Mỗi Ngày - Notification Schemas"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    title: str
    body: str | None = None
    url: str | None = None
    is_read: bool
    created_at: datetime
    read_at: datetime | None = None


class NotificationListOut(BaseModel):
    unread_count: int = 0
    items: list[NotificationOut] = Field(default_factory=list)


class NotificationMarkAllReadOut(BaseModel):
    updated_count: int


class NotificationBroadcastIn(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    body: str | None = Field(default=None, max_length=4000)
    url: str | None = Field(default=None, max_length=500)
    target: str = Field(default="enrolled", pattern=r"^(enrolled|all)$")


class NotificationBroadcastOut(BaseModel):
    created_count: int
