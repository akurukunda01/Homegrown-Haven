"""Request validation for the HomegrownHaven Flask API.

Pydantic v2 models provide *syntactic* validation (types, lengths, ranges,
email format). The Flask routes layer on the DB-backed *semantic* checks
(existence, ownership/authorization) after a model has parsed successfully.
"""

import re
from typing import Optional

from flask import request
from pydantic import BaseModel, Field, ValidationError, field_validator

# Simple, dependency-free email pattern. (We deliberately avoid pydantic's
# EmailStr so we don't need the extra `email-validator` package.)
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class ReviewCreate(BaseModel):
    business: int = Field(gt=0)
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=10, max_length=500)

    @field_validator("comment")
    @classmethod
    def _strip_comment(cls, v: str) -> str:
        stripped = v.strip()
        if len(stripped) < 10:
            raise ValueError("must be at least 10 characters")
        return stripped


class ReviewUpdate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=10, max_length=500)

    @field_validator("comment")
    @classmethod
    def _strip_comment(cls, v: str) -> str:
        stripped = v.strip()
        if len(stripped) < 10:
            raise ValueError("must be at least 10 characters")
        return stripped


class FavoriteCreate(BaseModel):
    user_id: int = Field(gt=0)
    business_id: int = Field(gt=0)


class AuthSyncUser(BaseModel):
    sub: str = Field(min_length=1, max_length=255)
    # email may be absent from some Auth0 connections; the sync endpoint derives
    # a placeholder from sub when it's missing.
    email: Optional[str] = Field(default=None, max_length=255)
    nickname: Optional[str] = Field(default=None, max_length=255)
    name: Optional[str] = Field(default=None, max_length=255)
    given_name: Optional[str] = Field(default=None, max_length=255)
    family_name: Optional[str] = Field(default=None, max_length=255)
    # Real avatar URLs (e.g. Google) can be long; keep generous headroom.
    picture: Optional[str] = Field(default=None, max_length=2048)

    # Auth0 payloads carry many extra fields we don't use; ignore them.
    model_config = {"extra": "ignore"}

    @field_validator("email")
    @classmethod
    def _check_email(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not _EMAIL_RE.match(v):
            raise ValueError("must be a valid email address")
        return v


class BusinessQuery(BaseModel):
    """Query params for /get_local and /search_local. All optional."""

    q: Optional[str] = Field(default=None, max_length=200)
    category: Optional[str] = Field(default=None, max_length=100)
    min_rating: Optional[float] = Field(default=None, ge=0, le=5)
    max_distance: Optional[float] = Field(default=None, ge=0)
    lat: Optional[float] = Field(default=None, ge=-90, le=90)
    lng: Optional[float] = Field(default=None, ge=-180, le=180)

    model_config = {"extra": "ignore"}


def validate(model_cls, data):
    """Parse ``data`` into ``model_cls``.

    Returns ``(instance, None)`` on success, or ``(None, ["field: message"])``
    on failure — matching the ``{'errors': [...]}`` 400 shape the API already
    uses for review submission.
    """
    try:
        return model_cls.model_validate(data or {}), None
    except ValidationError as exc:
        errors = []
        for err in exc.errors():
            loc = ".".join(str(p) for p in err["loc"]) or "body"
            errors.append(f"{loc}: {err['msg']}")
        return None, errors


def current_user_id(cursor):
    """Resolve the caller's local user id from the X-Auth0-User-ID header.

    Returns the integer id, or None if the header is absent or the user is
    unknown. Used for ownership/authorization checks.
    """
    auth0_id = request.headers.get("X-Auth0-User-ID")
    if not auth0_id:
        return None
    cursor.execute("SELECT id FROM users WHERE auth0_id = %s", (auth0_id,))
    row = cursor.fetchone()
    return row["id"] if row else None
