from datetime import datetime
from typing import Any, Literal
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.models import SubmissionStatus, UserRole


class PointGeometry(BaseModel):
    type: Literal["Point"] = "Point"
    coordinates: tuple[float, float]


class GeoJSONFeature(BaseModel):
    type: Literal["Feature"] = "Feature"
    id: int
    geometry: PointGeometry
    properties: dict[str, Any]


class GeoJSONFeatureCollection(BaseModel):
    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: list[GeoJSONFeature]


class HealthResponse(BaseModel):
    api: Literal["ok"]
    database: Literal["ok"]
    postgis_version: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=2, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    display_name: str
    role: UserRole
    is_active: bool


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int
    user: UserResponse


class CommentBody(BaseModel):
    body: str = Field(min_length=1, max_length=2000)

    @field_validator("body")
    @classmethod
    def body_must_contain_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Comment cannot be empty")
        return cleaned


class CommentCreate(CommentBody):
    pass


class CommentUpdate(CommentBody):
    pass


class CommentResponse(BaseModel):
    id: int
    user_id: int
    display_name: str
    role: UserRole
    body: str
    created_at: datetime
    updated_at: datetime


class RatingRequest(BaseModel):
    rating: int = Field(ge=1, le=5)


class RatingSummary(BaseModel):
    average_rating: float | None
    rating_count: int
    current_user_rating: int | None


class FavoriteStatus(BaseModel):
    favorited: bool


def clean_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


class DiveCenterProfileRequest(BaseModel):
    business_name: str = Field(min_length=2, max_length=150)
    description: str | None = Field(default=None, max_length=2000)
    phone: str | None = Field(default=None, max_length=100)
    website: str | None = Field(default=None, max_length=500)
    address: str | None = Field(default=None, max_length=500)
    agencies: list[str] = Field(default_factory=list, max_length=30)
    services: list[str] = Field(default_factory=list, max_length=30)

    @field_validator("business_name")
    @classmethod
    def clean_business_name(cls, value: str) -> str:
        return value.strip()

    @field_validator("description", "phone", "website", "address")
    @classmethod
    def clean_text_fields(cls, value: str | None) -> str | None:
        return clean_optional_text(value)

    @field_validator("website")
    @classmethod
    def validate_website(cls, value: str | None) -> str | None:
        if value is None:
            return None
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("Website must use http or https")
        return value

    @field_validator("agencies", "services")
    @classmethod
    def clean_string_lists(cls, values: list[str]) -> list[str]:
        cleaned: list[str] = []
        for value in values:
            item = value.strip()
            if item and item not in cleaned:
                cleaned.append(item)
        return cleaned


class DiveCenterProfileResponse(DiveCenterProfileRequest):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    is_verified: bool
    created_at: datetime
    updated_at: datetime


class AdminDiveCenterProfileResponse(DiveCenterProfileResponse):
    email: EmailStr
    display_name: str


class DiveSiteSubmissionRequest(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    site_type: Literal["Reef", "Wreck", "Wall"]
    min_depth_m: float | None = Field(default=None, ge=0, le=300)
    max_depth_m: float | None = Field(default=None, ge=0, le=300)
    description: str = Field(min_length=10, max_length=2000)
    longitude: float = Field(ge=-180, le=180)
    latitude: float = Field(ge=-90, le=90)

    @field_validator("name", "description")
    @classmethod
    def clean_required_text(cls, value: str) -> str:
        return value.strip()

    @model_validator(mode="after")
    def validate_depth_order(self) -> "DiveSiteSubmissionRequest":
        if (
            self.min_depth_m is not None
            and self.max_depth_m is not None
            and self.max_depth_m < self.min_depth_m
        ):
            raise ValueError("Maximum depth must be greater than or equal to minimum depth")
        return self


class DiveSiteSubmissionResponse(BaseModel):
    id: int
    submitted_by: int
    submitter_name: str
    business_name: str | None
    name: str
    site_type: str
    min_depth_m: float | None
    max_depth_m: float | None
    description: str
    longitude: float
    latitude: float
    status: SubmissionStatus
    admin_note: str | None
    reviewed_by: int | None
    reviewed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class AdminUserResponse(UserResponse):
    created_at: datetime
    updated_at: datetime


class AdminUserUpdate(BaseModel):
    role: Literal[UserRole.USER, UserRole.DIVE_CENTER] | None = None
    is_active: bool | None = None

    @model_validator(mode="after")
    def require_change(self) -> "AdminUserUpdate":
        if self.role is None and self.is_active is None:
            raise ValueError("At least one user field must be supplied")
        return self


class DiveCenterVerificationRequest(BaseModel):
    is_verified: bool


class SubmissionReviewRequest(BaseModel):
    admin_note: str | None = Field(default=None, max_length=1000)

    @field_validator("admin_note")
    @classmethod
    def clean_note(cls, value: str | None) -> str | None:
        return clean_optional_text(value)


class AdminCommentResponse(BaseModel):
    id: int
    user_id: int
    display_name: str
    role: UserRole
    dive_site_id: int
    dive_site_name: str
    body: str
    created_at: datetime
    updated_at: datetime


class AdminDashboardResponse(BaseModel):
    total_users: int
    dive_center_accounts: int
    comments: int
    pending_submissions: int
    approved_submissions: int
    rejected_submissions: int
