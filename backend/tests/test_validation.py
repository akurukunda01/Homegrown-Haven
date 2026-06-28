"""Unit tests for backend/validation.py.

These exercise the Pydantic request models and the validate() wrapper in pure
isolation -- no database, no Flask request context, no network.
"""

import pytest

from validation import (
    ReviewCreate,
    ReviewUpdate,
    FavoriteCreate,
    AuthSyncUser,
    BusinessQuery,
    validate,
)
from pydantic import ValidationError


# --------------------------------------------------------------- ReviewCreate
class TestReviewCreate:
    def test_valid_review_parses(self):
        review = ReviewCreate(business=1, rating=5, comment="Great local spot!")
        assert review.business == 1
        assert review.rating == 5
        assert review.comment == "Great local spot!"

    def test_comment_is_stripped(self):
        review = ReviewCreate(business=1, rating=4, comment="   padded comment here   ")
        assert review.comment == "padded comment here"

    @pytest.mark.parametrize("bad_rating", [0, 6, -1, 10])
    def test_rating_out_of_range_rejected(self, bad_rating):
        with pytest.raises(ValidationError):
            ReviewCreate(business=1, rating=bad_rating, comment="A valid length comment")

    def test_short_comment_rejected(self):
        with pytest.raises(ValidationError):
            ReviewCreate(business=1, rating=3, comment="too short")

    def test_whitespace_only_comment_rejected(self):
        # Passes the min_length=10 check on raw input but fails after .strip().
        with pytest.raises(ValidationError):
            ReviewCreate(business=1, rating=3, comment="          ")

    def test_non_positive_business_rejected(self):
        with pytest.raises(ValidationError):
            ReviewCreate(business=0, rating=3, comment="A valid length comment")


# --------------------------------------------------------------- ReviewUpdate
class TestReviewUpdate:
    def test_valid_update_parses(self):
        upd = ReviewUpdate(rating=2, comment="Updated, still detailed enough")
        assert upd.rating == 2
        assert upd.comment == "Updated, still detailed enough"

    def test_invalid_rating_rejected(self):
        with pytest.raises(ValidationError):
            ReviewUpdate(rating=9, comment="A valid length comment")


# -------------------------------------------------------------- FavoriteCreate
class TestFavoriteCreate:
    def test_valid_favorite(self):
        fav = FavoriteCreate(user_id=3, business_id=7)
        assert (fav.user_id, fav.business_id) == (3, 7)

    @pytest.mark.parametrize("payload", [
        {"user_id": 0, "business_id": 1},
        {"user_id": 1, "business_id": 0},
    ])
    def test_non_positive_ids_rejected(self, payload):
        with pytest.raises(ValidationError):
            FavoriteCreate(**payload)


# --------------------------------------------------------------- AuthSyncUser
class TestAuthSyncUser:
    def test_valid_email_accepted(self):
        u = AuthSyncUser(sub="auth0|abc", email="person@example.com")
        assert u.email == "person@example.com"

    def test_missing_email_allowed(self):
        # email is optional; the sync endpoint derives a placeholder downstream.
        u = AuthSyncUser(sub="auth0|abc")
        assert u.email is None

    @pytest.mark.parametrize("bad_email", ["not-an-email", "missing@domain", "a@b@c.com", "no spaces @x.com"])
    def test_malformed_email_rejected(self, bad_email):
        with pytest.raises(ValidationError):
            AuthSyncUser(sub="auth0|abc", email=bad_email)

    def test_extra_fields_ignored(self):
        u = AuthSyncUser(sub="auth0|abc", email="p@e.com", updated_at="whatever", foo="bar")
        assert not hasattr(u, "foo")

    def test_empty_sub_rejected(self):
        with pytest.raises(ValidationError):
            AuthSyncUser(sub="", email="p@e.com")


# --------------------------------------------------------------- BusinessQuery
class TestBusinessQuery:
    def test_all_optional_defaults_to_none(self):
        q = BusinessQuery()
        assert q.q is None and q.category is None and q.min_rating is None
        assert q.lat is None and q.lng is None and q.max_distance is None

    def test_valid_values(self):
        q = BusinessQuery(q="coffee", category="Cafe", min_rating=4.0, lat=40.0, lng=-76.0)
        assert q.min_rating == 4.0
        assert q.lat == 40.0

    @pytest.mark.parametrize("payload", [
        {"min_rating": 6},     # > 5
        {"min_rating": -1},    # < 0
        {"lat": 95},           # > 90
        {"lat": -95},          # < -90
        {"lng": 200},          # > 180
        {"max_distance": -5},  # < 0
    ])
    def test_out_of_range_rejected(self, payload):
        with pytest.raises(ValidationError):
            BusinessQuery(**payload)


# ----------------------------------------------------------------- validate()
class TestValidateWrapper:
    def test_success_returns_instance_and_no_errors(self):
        instance, errors = validate(ReviewCreate, {"business": 1, "rating": 5, "comment": "Solid place to visit"})
        assert errors is None
        assert isinstance(instance, ReviewCreate)
        assert instance.rating == 5

    def test_failure_returns_none_and_error_list(self):
        instance, errors = validate(ReviewCreate, {"business": 1, "rating": 99, "comment": "short"})
        assert instance is None
        assert isinstance(errors, list)
        assert len(errors) >= 1
        # Errors are formatted as "field: message".
        assert all(":" in e for e in errors)

    def test_none_data_treated_as_empty(self):
        # validate(None) -> validates {} -> missing required fields -> errors list.
        instance, errors = validate(ReviewCreate, None)
        assert instance is None
        assert isinstance(errors, list)
