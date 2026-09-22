from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models import UserRole


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
