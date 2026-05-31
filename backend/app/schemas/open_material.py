"""
ĐGNL Mỗi Ngày - Open Materials Schemas
"""

from datetime import datetime
from pydantic import BaseModel, Field

from app.schemas.qa import QAAuthorOut


class OpenMaterialCreate(BaseModel):
    title: str = Field(min_length=5, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    category: str | None = Field(default=None, max_length=100)
    subject: str | None = Field(default=None, max_length=100)
    tags: list[str] = Field(default_factory=list, max_length=10)
    file_type: str = "pdf"
    drive_url: str = Field(min_length=10, max_length=1000)
    preview_image_url: str | None = Field(default=None, max_length=1000)
    source_name: str | None = Field(default=None, max_length=255)
    copyright_note: str | None = Field(default=None, max_length=5000)
    is_published: bool = True
    is_featured: bool = False


class OpenMaterialUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=5, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    category: str | None = Field(default=None, max_length=100)
    subject: str | None = Field(default=None, max_length=100)
    tags: list[str] | None = Field(default=None, max_length=10)
    file_type: str | None = None
    drive_url: str | None = Field(default=None, min_length=10, max_length=1000)
    preview_image_url: str | None = Field(default=None, max_length=1000)
    source_name: str | None = Field(default=None, max_length=255)
    copyright_note: str | None = Field(default=None, max_length=5000)
    is_published: bool | None = None
    is_featured: bool | None = None


class OpenMaterialOut(BaseModel):
    id: int
    title: str
    description: str | None
    category: str | None
    subject: str | None
    tags: list[str]
    file_type: str
    drive_url: str
    preview_image_url: str | None
    source_name: str | None
    copyright_note: str | None
    is_published: bool
    is_featured: bool
    download_count: int
    created_at: datetime
    updated_at: datetime


class MaterialSubmissionOut(BaseModel):
    id: int
    title: str
    description: str | None
    category: str | None
    subject: str | None
    tags: list[str]
    file_urls: list[str]
    file_types: list[str]
    original_filenames: list[str]
    source_name: str | None
    copyright_attestation: bool
    copyright_note: str | None
    status: str
    admin_notes: str | None
    is_priority: bool
    contributor: QAAuthorOut
    reviewed_at: datetime | None
    published_material_id: int | None
    created_at: datetime
    updated_at: datetime


class MaterialReviewRequest(BaseModel):
    status: str = Field(pattern="^(approved|rejected|pending)$")
    admin_notes: str | None = Field(default=None, max_length=5000)
    publish_to_catalog: bool = False
    drive_url: str | None = Field(default=None, max_length=1000)
    is_featured: bool = False
