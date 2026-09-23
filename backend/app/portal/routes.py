from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from geoalchemy2.elements import WKTElement
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth.dependencies import AdminUser, DiveCenterUser
from app.database import get_db
from app.models import (
    Comment,
    DiveCenterProfile,
    DiveSite,
    DiveSiteSubmission,
    SubmissionStatus,
    User,
    UserRole,
)
from app.schemas import (
    AdminCommentResponse,
    AdminDashboardResponse,
    AdminDiveCenterProfileResponse,
    AdminUserResponse,
    AdminUserUpdate,
    DiveCenterProfileRequest,
    DiveCenterProfileResponse,
    DiveCenterVerificationRequest,
    DiveSiteSubmissionRequest,
    DiveSiteSubmissionResponse,
    GeoJSONFeature,
    GeoJSONFeatureCollection,
    PointGeometry,
    SubmissionReviewRequest,
)

router = APIRouter(tags=["dive center portal and administration"])


def profile_for_user(db: Session, user_id: int) -> DiveCenterProfile | None:
    return db.scalar(
        select(DiveCenterProfile).where(DiveCenterProfile.user_id == user_id)
    )


def profile_response(db: Session, profile: DiveCenterProfile) -> DiveCenterProfileResponse:
    longitude, latitude = db.execute(
        select(
            func.ST_X(DiveCenterProfile.geom),
            func.ST_Y(DiveCenterProfile.geom),
        ).where(DiveCenterProfile.id == profile.id)
    ).one()
    return DiveCenterProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        business_name=profile.business_name,
        description=profile.description,
        phone=profile.phone,
        website=profile.website,
        address=profile.address,
        longitude=longitude,
        latitude=latitude,
        agencies=profile.agencies,
        services=profile.services,
        is_verified=profile.is_verified,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


def submission_statement():
    longitude = func.ST_X(DiveSiteSubmission.geom).label("longitude")
    latitude = func.ST_Y(DiveSiteSubmission.geom).label("latitude")
    return (
        select(
            DiveSiteSubmission,
            User.display_name.label("submitter_name"),
            DiveCenterProfile.business_name.label("business_name"),
            longitude,
            latitude,
        )
        .join(User, User.id == DiveSiteSubmission.submitted_by)
        .outerjoin(DiveCenterProfile, DiveCenterProfile.user_id == User.id)
    )


def submission_response(row) -> DiveSiteSubmissionResponse:
    submission = row[0]
    return DiveSiteSubmissionResponse(
        id=submission.id,
        submitted_by=submission.submitted_by,
        submitter_name=row.submitter_name,
        business_name=row.business_name,
        name=submission.name,
        site_type=submission.site_type,
        min_depth_m=submission.min_depth_m,
        max_depth_m=submission.max_depth_m,
        description=submission.description,
        longitude=row.longitude,
        latitude=row.latitude,
        status=submission.status,
        admin_note=submission.admin_note,
        reviewed_by=submission.reviewed_by,
        reviewed_at=submission.reviewed_at,
        created_at=submission.created_at,
        updated_at=submission.updated_at,
    )


def load_submission_row(db: Session, submission_id: int):
    row = db.execute(
        submission_statement().where(DiveSiteSubmission.id == submission_id)
    ).one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Dive site submission not found")
    return row


def require_pending_owner(submission: DiveSiteSubmission, current_user: User) -> None:
    if submission.submitted_by != current_user.id:
        raise HTTPException(status_code=403, detail="This submission belongs to another account")
    if submission.status != SubmissionStatus.PENDING:
        raise HTTPException(status_code=409, detail="Only pending submissions may be changed")


@router.get("/api/dive-center/profile", response_model=DiveCenterProfileResponse)
def get_profile(
    current_user: DiveCenterUser,
    db: Annotated[Session, Depends(get_db)],
) -> DiveCenterProfileResponse:
    profile = profile_for_user(db, current_user.id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Dive center profile not created")
    return profile_response(db, profile)


@router.put("/api/dive-center/profile", response_model=DiveCenterProfileResponse)
@router.patch("/api/dive-center/profile", response_model=DiveCenterProfileResponse)
def upsert_profile(
    payload: DiveCenterProfileRequest,
    current_user: DiveCenterUser,
    db: Annotated[Session, Depends(get_db)],
) -> DiveCenterProfileResponse:
    profile = profile_for_user(db, current_user.id)
    values = payload.model_dump(exclude={"longitude", "latitude"})
    location = (
        WKTElement(f"POINT({payload.longitude} {payload.latitude})", srid=4326)
        if payload.longitude is not None and payload.latitude is not None
        else None
    )
    if profile is None:
        profile = DiveCenterProfile(user_id=current_user.id, geom=location, **values)
        db.add(profile)
    else:
        for key, value in values.items():
            setattr(profile, key, value)
        profile.geom = location
    db.commit()
    db.refresh(profile)
    return profile_response(db, profile)


@router.post(
    "/api/dive-center/submissions",
    response_model=DiveSiteSubmissionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_submission(
    payload: DiveSiteSubmissionRequest,
    current_user: DiveCenterUser,
    db: Annotated[Session, Depends(get_db)],
) -> DiveSiteSubmissionResponse:
    submission = DiveSiteSubmission(
        submitted_by=current_user.id,
        name=payload.name,
        site_type=payload.site_type,
        min_depth_m=payload.min_depth_m,
        max_depth_m=payload.max_depth_m,
        description=payload.description,
        geom=WKTElement(f"POINT({payload.longitude} {payload.latitude})", srid=4326),
        status=SubmissionStatus.PENDING,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission_response(load_submission_row(db, submission.id))


@router.get(
    "/api/dive-center/submissions",
    response_model=list[DiveSiteSubmissionResponse],
)
def list_own_submissions(
    current_user: DiveCenterUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[DiveSiteSubmissionResponse]:
    rows = db.execute(
        submission_statement()
        .where(DiveSiteSubmission.submitted_by == current_user.id)
        .order_by(DiveSiteSubmission.created_at.desc(), DiveSiteSubmission.id.desc())
    ).all()
    return [submission_response(row) for row in rows]


@router.get(
    "/api/dive-center/submissions/{submission_id}",
    response_model=DiveSiteSubmissionResponse,
)
def get_own_submission(
    submission_id: int,
    current_user: DiveCenterUser,
    db: Annotated[Session, Depends(get_db)],
) -> DiveSiteSubmissionResponse:
    row = load_submission_row(db, submission_id)
    if row[0].submitted_by != current_user.id:
        raise HTTPException(status_code=403, detail="This submission belongs to another account")
    return submission_response(row)


@router.patch(
    "/api/dive-center/submissions/{submission_id}",
    response_model=DiveSiteSubmissionResponse,
)
def update_own_submission(
    submission_id: int,
    payload: DiveSiteSubmissionRequest,
    current_user: DiveCenterUser,
    db: Annotated[Session, Depends(get_db)],
) -> DiveSiteSubmissionResponse:
    submission = load_submission_row(db, submission_id)[0]
    require_pending_owner(submission, current_user)
    submission.name = payload.name
    submission.site_type = payload.site_type
    submission.min_depth_m = payload.min_depth_m
    submission.max_depth_m = payload.max_depth_m
    submission.description = payload.description
    submission.geom = WKTElement(
        f"POINT({payload.longitude} {payload.latitude})", srid=4326
    )
    db.commit()
    return submission_response(load_submission_row(db, submission.id))


@router.delete(
    "/api/dive-center/submissions/{submission_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_own_submission(
    submission_id: int,
    current_user: DiveCenterUser,
    db: Annotated[Session, Depends(get_db)],
) -> Response:
    submission = load_submission_row(db, submission_id)[0]
    require_pending_owner(submission, current_user)
    db.delete(submission)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/api/community/dive-sites", response_model=GeoJSONFeatureCollection)
def public_community_dive_sites(
    db: Annotated[Session, Depends(get_db)],
) -> GeoJSONFeatureCollection:
    rows = db.execute(
        submission_statement()
        .where(DiveSiteSubmission.status == SubmissionStatus.APPROVED)
        .order_by(DiveSiteSubmission.name, DiveSiteSubmission.id)
    ).all()
    features = []
    for row in rows:
        submission = row[0]
        features.append(
            GeoJSONFeature(
                id=submission.id,
                geometry=PointGeometry(coordinates=(row.longitude, row.latitude)),
                properties={
                    "site_name": submission.name,
                    "site_type": submission.site_type,
                    "min_depth_m": submission.min_depth_m,
                    "max_depth_m": submission.max_depth_m,
                    "description": submission.description,
                    "submitted_by": submission.submitted_by,
                    "submitter_name": row.submitter_name,
                    "business_name": row.business_name,
                    "data_origin": "dive_center_submitted",
                },
            )
        )
    return GeoJSONFeatureCollection(features=features)


@router.get("/api/admin/dashboard", response_model=AdminDashboardResponse)
def admin_dashboard(
    _current_admin: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> AdminDashboardResponse:
    count = lambda statement: int(db.scalar(statement) or 0)
    return AdminDashboardResponse(
        total_users=count(select(func.count()).select_from(User)),
        dive_center_accounts=count(
            select(func.count()).select_from(User).where(User.role == UserRole.DIVE_CENTER)
        ),
        comments=count(select(func.count()).select_from(Comment)),
        pending_submissions=count(
            select(func.count()).select_from(DiveSiteSubmission).where(
                DiveSiteSubmission.status == SubmissionStatus.PENDING
            )
        ),
        approved_submissions=count(
            select(func.count()).select_from(DiveSiteSubmission).where(
                DiveSiteSubmission.status == SubmissionStatus.APPROVED
            )
        ),
        rejected_submissions=count(
            select(func.count()).select_from(DiveSiteSubmission).where(
                DiveSiteSubmission.status == SubmissionStatus.REJECTED
            )
        ),
        archived_submissions=count(
            select(func.count()).select_from(DiveSiteSubmission).where(
                DiveSiteSubmission.status == SubmissionStatus.ARCHIVED
            )
        ),
    )


@router.get("/api/admin/users", response_model=list[AdminUserResponse])
def admin_users(
    _current_admin: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[User]:
    return list(db.scalars(select(User).order_by(User.created_at, User.id)))


@router.patch("/api/admin/users/{user_id}", response_model=AdminUserResponse)
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    current_admin: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Administrators cannot modify their own access")
    if user.role == UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Administrator accounts cannot be changed here")
    if payload.role is not None:
        user.role = UserRole(payload.role)
    if payload.is_active is not None:
        user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return user


@router.get(
    "/api/admin/dive-centers",
    response_model=list[AdminDiveCenterProfileResponse],
)
def admin_dive_centers(
    _current_admin: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[AdminDiveCenterProfileResponse]:
    rows = db.execute(
        select(DiveCenterProfile, User.email, User.display_name)
        .join(User, User.id == DiveCenterProfile.user_id)
        .order_by(DiveCenterProfile.business_name, DiveCenterProfile.id)
    ).all()
    return [
        AdminDiveCenterProfileResponse(
            **profile_response(db, profile).model_dump(),
            email=email,
            display_name=display_name,
        )
        for profile, email, display_name in rows
    ]


@router.patch(
    "/api/admin/dive-centers/{profile_id}/verification",
    response_model=AdminDiveCenterProfileResponse,
)
def verify_dive_center(
    profile_id: int,
    payload: DiveCenterVerificationRequest,
    _current_admin: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> AdminDiveCenterProfileResponse:
    row = db.execute(
        select(DiveCenterProfile, User.email, User.display_name)
        .join(User, User.id == DiveCenterProfile.user_id)
        .where(DiveCenterProfile.id == profile_id)
    ).one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Dive center profile not found")
    profile, email, display_name = row
    profile.is_verified = payload.is_verified
    db.commit()
    db.refresh(profile)
    return AdminDiveCenterProfileResponse(
        **profile_response(db, profile).model_dump(),
        email=email,
        display_name=display_name,
    )


@router.get("/api/admin/comments", response_model=list[AdminCommentResponse])
def admin_comments(
    _current_admin: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[AdminCommentResponse]:
    rows = db.execute(
        select(Comment, User, DiveSite.site_name)
        .join(User, User.id == Comment.user_id)
        .join(DiveSite, DiveSite.fid == Comment.dive_site_id)
        .order_by(Comment.created_at.desc(), Comment.id.desc())
    ).all()
    return [
        AdminCommentResponse(
            id=comment.id,
            user_id=user.id,
            display_name=user.display_name,
            role=user.role,
            dive_site_id=comment.dive_site_id,
            dive_site_name=site_name or f"Dive site {comment.dive_site_id}",
            body=comment.body,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
        )
        for comment, user, site_name in rows
    ]


@router.get(
    "/api/admin/submissions",
    response_model=list[DiveSiteSubmissionResponse],
)
def admin_submissions(
    _current_admin: AdminUser,
    db: Annotated[Session, Depends(get_db)],
    submission_status: SubmissionStatus | None = Query(default=None, alias="status"),
) -> list[DiveSiteSubmissionResponse]:
    statement = submission_statement()
    if submission_status is not None:
        statement = statement.where(DiveSiteSubmission.status == submission_status)
    rows = db.execute(
        statement.order_by(DiveSiteSubmission.created_at.desc(), DiveSiteSubmission.id.desc())
    ).all()
    return [submission_response(row) for row in rows]


def review_submission(
    db: Session,
    submission_id: int,
    admin: User,
    next_status: SubmissionStatus,
    admin_note: str | None,
) -> DiveSiteSubmissionResponse:
    submission = load_submission_row(db, submission_id)[0]
    if submission.status != SubmissionStatus.PENDING:
        raise HTTPException(status_code=409, detail="Only pending submissions may be reviewed")
    submission.status = next_status
    submission.admin_note = admin_note
    submission.reviewed_by = admin.id
    submission.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    return submission_response(load_submission_row(db, submission.id))


@router.post(
    "/api/admin/submissions/{submission_id}/approve",
    response_model=DiveSiteSubmissionResponse,
)
def approve_submission(
    submission_id: int,
    payload: SubmissionReviewRequest,
    current_admin: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> DiveSiteSubmissionResponse:
    return review_submission(
        db, submission_id, current_admin, SubmissionStatus.APPROVED, payload.admin_note
    )


@router.post(
    "/api/admin/submissions/{submission_id}/reject",
    response_model=DiveSiteSubmissionResponse,
)
def reject_submission(
    submission_id: int,
    payload: SubmissionReviewRequest,
    current_admin: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> DiveSiteSubmissionResponse:
    return review_submission(
        db, submission_id, current_admin, SubmissionStatus.REJECTED, payload.admin_note
    )


@router.post(
    "/api/admin/submissions/{submission_id}/archive",
    response_model=DiveSiteSubmissionResponse,
)
def archive_submission(
    submission_id: int,
    payload: SubmissionReviewRequest,
    current_admin: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> DiveSiteSubmissionResponse:
    submission = load_submission_row(db, submission_id)[0]
    if submission.status != SubmissionStatus.APPROVED:
        raise HTTPException(status_code=409, detail="Only approved submissions may be archived")
    submission.status = SubmissionStatus.ARCHIVED
    if payload.admin_note is not None:
        submission.admin_note = payload.admin_note
    submission.reviewed_by = current_admin.id
    submission.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    return submission_response(load_submission_row(db, submission.id))
