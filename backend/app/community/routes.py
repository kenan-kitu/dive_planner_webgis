from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import Float, cast, delete, func, select
from sqlalchemy.orm import Session

from app.auth.dependencies import CurrentUser, OptionalCurrentUser
from app.database import get_db
from app.geojson import collection, feature_from_record
from app.models import Comment, DiveSite, Favorite, Rating, User, UserRole
from app.schemas import (
    CommentCreate,
    CommentResponse,
    CommentUpdate,
    FavoriteStatus,
    GeoJSONFeatureCollection,
    RatingRequest,
    RatingSummary,
)

router = APIRouter(tags=["community"])


def require_dive_site(db: Session, site_id: int) -> DiveSite:
    site = db.get(DiveSite, site_id)
    if site is None:
        raise HTTPException(status_code=404, detail="Dive site not found")
    return site


def comment_response(comment: Comment, author: User) -> CommentResponse:
    return CommentResponse(
        id=comment.id,
        user_id=comment.user_id,
        display_name=author.display_name,
        role=author.role,
        body=comment.body,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
    )


def load_comment(db: Session, comment_id: int) -> tuple[Comment, User]:
    row = db.execute(
        select(Comment, User)
        .join(User, User.id == Comment.user_id)
        .where(Comment.id == comment_id)
    ).one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Comment not found")
    return row


def require_comment_owner_or_admin(comment: Comment, current_user: User) -> None:
    if comment.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the comment owner or an administrator may change this comment",
        )


def rating_summary(
    db: Session,
    site_id: int,
    current_user: User | None,
) -> RatingSummary:
    average, count = db.execute(
        select(
            cast(func.avg(Rating.rating), Float),
            func.count(Rating.id),
        ).where(Rating.dive_site_id == site_id)
    ).one()
    current_rating = None
    if current_user is not None:
        current_rating = db.scalar(
            select(Rating.rating).where(
                Rating.user_id == current_user.id,
                Rating.dive_site_id == site_id,
            )
        )
    return RatingSummary(
        average_rating=round(float(average), 1) if average is not None else None,
        rating_count=count,
        current_user_rating=current_rating,
    )


@router.get(
    "/api/dive-sites/{site_id}/comments",
    response_model=list[CommentResponse],
)
def list_comments(
    site_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> list[CommentResponse]:
    require_dive_site(db, site_id)
    rows = db.execute(
        select(Comment, User)
        .join(User, User.id == Comment.user_id)
        .where(Comment.dive_site_id == site_id)
        .order_by(Comment.created_at, Comment.id)
    ).all()
    return [comment_response(comment, author) for comment, author in rows]


@router.post(
    "/api/dive-sites/{site_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_comment(
    site_id: int,
    payload: CommentCreate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> CommentResponse:
    require_dive_site(db, site_id)
    comment = Comment(
        user_id=current_user.id,
        dive_site_id=site_id,
        body=payload.body,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment_response(comment, current_user)


@router.patch("/api/comments/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: int,
    payload: CommentUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> CommentResponse:
    comment, author = load_comment(db, comment_id)
    require_comment_owner_or_admin(comment, current_user)
    comment.body = payload.body
    db.commit()
    db.refresh(comment)
    return comment_response(comment, author)


@router.delete("/api/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> Response:
    comment, _ = load_comment(db, comment_id)
    require_comment_owner_or_admin(comment, current_user)
    db.delete(comment)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/api/dive-sites/{site_id}/rating", response_model=RatingSummary)
def get_rating(
    site_id: int,
    current_user: OptionalCurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> RatingSummary:
    require_dive_site(db, site_id)
    return rating_summary(db, site_id, current_user)


@router.put("/api/dive-sites/{site_id}/rating", response_model=RatingSummary)
def set_rating(
    site_id: int,
    payload: RatingRequest,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> RatingSummary:
    require_dive_site(db, site_id)
    rating = db.scalar(
        select(Rating).where(
            Rating.user_id == current_user.id,
            Rating.dive_site_id == site_id,
        )
    )
    if rating is None:
        rating = Rating(
            user_id=current_user.id,
            dive_site_id=site_id,
            rating=payload.rating,
        )
        db.add(rating)
    else:
        rating.rating = payload.rating
    db.commit()
    return rating_summary(db, site_id, current_user)


@router.delete("/api/dive-sites/{site_id}/rating", status_code=status.HTTP_204_NO_CONTENT)
def delete_rating(
    site_id: int,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> Response:
    require_dive_site(db, site_id)
    db.execute(
        delete(Rating).where(
            Rating.user_id == current_user.id,
            Rating.dive_site_id == site_id,
        )
    )
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/api/account/favorites", response_model=GeoJSONFeatureCollection)
def list_favorites(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> GeoJSONFeatureCollection:
    longitude = func.ST_X(DiveSite.geom).label("longitude")
    latitude = func.ST_Y(DiveSite.geom).label("latitude")
    rows = db.execute(
        select(DiveSite, longitude, latitude)
        .join(Favorite, Favorite.dive_site_id == DiveSite.fid)
        .where(Favorite.user_id == current_user.id)
        .order_by(DiveSite.site_name, DiveSite.fid)
    ).all()
    return collection(
        [feature_from_record(site, row_longitude, row_latitude) for site, row_longitude, row_latitude in rows]
    )


@router.get(
    "/api/dive-sites/{site_id}/favorite-status",
    response_model=FavoriteStatus,
)
def favorite_status(
    site_id: int,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> FavoriteStatus:
    require_dive_site(db, site_id)
    favorite_id = db.scalar(
        select(Favorite.id).where(
            Favorite.user_id == current_user.id,
            Favorite.dive_site_id == site_id,
        )
    )
    return FavoriteStatus(favorited=favorite_id is not None)


@router.post(
    "/api/dive-sites/{site_id}/favorite",
    response_model=FavoriteStatus,
)
def add_favorite(
    site_id: int,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> FavoriteStatus:
    require_dive_site(db, site_id)
    favorite = db.scalar(
        select(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.dive_site_id == site_id,
        )
    )
    if favorite is None:
        db.add(Favorite(user_id=current_user.id, dive_site_id=site_id))
        db.commit()
    return FavoriteStatus(favorited=True)


@router.delete(
    "/api/dive-sites/{site_id}/favorite",
    response_model=FavoriteStatus,
)
def remove_favorite(
    site_id: int,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> FavoriteStatus:
    require_dive_site(db, site_id)
    db.execute(
        delete(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.dive_site_id == site_id,
        )
    )
    db.commit()
    return FavoriteStatus(favorited=False)
