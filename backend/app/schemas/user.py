"""
ĐGNL Mỗi Ngày - User Pydantic Schemas
"""

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class GoogleLoginRequest(BaseModel):
    credential: str  # Google ID token


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    picture: str | None = None
    enrollment_year: int | None = None
    course_type: str | None = None
    is_enrolled: bool = False
    is_admin: bool = False
    has_logged_in: bool = False  # True once google_id is set
    created_at: datetime
    last_login: datetime

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    """Admin pre-registers a student by email.
    All non-email fields are optional and will be filled in either now
    by the admin, or automatically when the student first signs in via Google.
    """

    email: EmailStr
    name: str | None = None
    enrollment_year: int | None = Field(default=None, ge=2000, le=2100)
    course_type: str | None = None
    is_enrolled: bool = True
    is_admin: bool = False


class UserUpdate(BaseModel):
    """Admin updates a student's profile / enrollment info."""

    name: str | None = None
    enrollment_year: int | None = Field(default=None, ge=2000, le=2100)
    course_type: str | None = None
    is_enrolled: bool | None = None
    is_admin: bool | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
