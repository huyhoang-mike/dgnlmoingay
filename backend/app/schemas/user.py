"""
ĐGNL Mỗi Ngày - User Pydantic Schemas
"""

from datetime import datetime
from pydantic import BaseModel


class GoogleLoginRequest(BaseModel):
    credential: str  # Google ID token


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    picture: str | None = None
    is_enrolled: bool = False
    is_admin: bool = False
    created_at: datetime
    last_login: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
