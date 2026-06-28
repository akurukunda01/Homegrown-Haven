from conftest import SEED

AUTH_HEADER = {"X-Auth0-User-ID": SEED["user_auth0_id"]}
OTHER_AUTH_HEADER = {"X-Auth0-User-ID": SEED["other_auth0_id"]}


class TestBusinessListing:
    def test_get_local_returns_all_seeded_businesses(self, client):
        resp = client.get("/get_local")
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data) == SEED["business_count"]
        assert float(data[0]["rating"]) == 4.8  # no location => sorted by rating desc

    def test_get_local_category_filter(self, client):
        resp = client.get("/get_local?category=Cafe")
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data) == 1
        assert data[0]["category"] == "Cafe"

    def test_get_local_min_rating_filter(self, client):
        resp = client.get("/get_local?min_rating=4")
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data) == 2
        assert all(float(b["rating"]) >= 4 for b in data)

    def test_get_local_with_location_adds_distance(self, client):
        resp = client.get("/get_local?lat=40.2859&lng=-76.6502")
        assert resp.status_code == 200
        data = resp.get_json()
        assert all("distance" in b and "distance_value" in b for b in data)
        values = [b["distance_value"] for b in data]
        assert values == sorted(values)  # nearest first

    def test_get_local_invalid_min_rating_returns_400(self, client):
        resp = client.get("/get_local?min_rating=99")
        assert resp.status_code == 400
        assert "errors" in resp.get_json()

    def test_search_local_by_name(self, client):
        resp = client.get("/search_local?q=Coffee")
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data) == 1
        assert "Coffee" in data[0]["name"]

    def test_categories_endpoint(self, client):
        resp = client.get("/categories")
        assert resp.status_code == 200
        cats = resp.get_json()
        assert {"Cafe", "Electronics", "Restaurant"}.issubset(set(cats))


class TestReviews:
    def test_get_reviews_for_business(self, client):
        resp = client.get(f"/get_reviews/{SEED['business_id']}")
        assert resp.status_code == 200
        reviews = resp.get_json()
        assert len(reviews) >= 1
        assert reviews[0]["business_id"] == SEED["business_id"]

    def test_add_review_validation_error(self, client):
        resp = client.post("/add_reviews", json={"business": 1, "rating": 99, "comment": "short"})
        assert resp.status_code == 400
        assert "errors" in resp.get_json()

    def test_add_review_nonexistent_business(self, client):
        resp = client.post(
            "/add_reviews",
            json={"business": 999999, "rating": 4, "comment": "A perfectly valid comment"},
            headers=AUTH_HEADER,
        )
        assert resp.status_code == 400
        assert "errors" in resp.get_json()

    def test_add_review_success_then_cleanup(self, client):
        resp = client.post(
            "/add_reviews",
            json={"business": SEED["business_id"], "rating": 4, "comment": "Genuinely a lovely place"},
            headers=AUTH_HEADER,
        )
        assert resp.status_code == 201
        created = resp.get_json()
        assert created["rating"] == 4
        assert created["business_id"] == SEED["business_id"]
        assert created["user_id"] == SEED["user_id"]

        del_resp = client.delete(f"/delete_reviews/{created['id']}", headers=AUTH_HEADER)
        assert del_resp.status_code == 204

    def test_delete_review_requires_ownership(self, client):
        resp = client.post(
            "/add_reviews",
            json={"business": SEED["business_id"], "rating": 3, "comment": "Ownership check review"},
            headers=AUTH_HEADER,
        )
        review_id = resp.get_json()["id"]
        try:
            forbidden = client.delete(f"/delete_reviews/{review_id}", headers=OTHER_AUTH_HEADER)
            assert forbidden.status_code == 403
        finally:
            client.delete(f"/delete_reviews/{review_id}", headers=AUTH_HEADER)


class TestAuthSync:
    def test_sync_creates_user_then_cleanup(self, client, db_conn):
        new_sub = "auth0|brand-new-user"
        resp = client.post(
            "/auth/sync-user",
            json={"sub": new_sub, "email": "newuser@example.com", "nickname": "newbie"},
        )
        assert resp.status_code == 201
        body = resp.get_json()
        assert body["message"] == "User created"
        assert body["user"]["auth0_id"] == new_sub

        with db_conn.cursor() as cur:
            cur.execute("DELETE FROM users WHERE auth0_id = %s", (new_sub,))
        db_conn.commit()

    def test_sync_rejects_malformed_email(self, client):
        resp = client.post(
            "/auth/sync-user",
            json={"sub": "auth0|whoever", "email": "not-an-email"},
        )
        assert resp.status_code == 400
        assert "errors" in resp.get_json()


class TestFavorites:
    def test_add_check_remove_flow(self, client):
        uid, bid = SEED["user_id"], 2  # business 2 is not favorited in the seed

        add = client.post("/favorites", json={"user_id": uid, "business_id": bid}, headers=AUTH_HEADER)
        assert add.status_code == 200
        assert add.get_json()["message"] == "Favorite added"

        check = client.get(f"/favorites/check/{uid}/{bid}", headers=AUTH_HEADER)
        assert check.status_code == 200
        assert check.get_json()["is_favorited"] is True

        remove = client.delete(f"/favorites/{uid}/{bid}", headers=AUTH_HEADER)
        assert remove.status_code == 200

        check2 = client.get(f"/favorites/check/{uid}/{bid}", headers=AUTH_HEADER)
        assert check2.get_json()["is_favorited"] is False

    def test_add_favorite_requires_auth(self, client):
        resp = client.post("/favorites", json={"user_id": SEED["user_id"], "business_id": 2})
        assert resp.status_code == 403

    def test_get_favorites_requires_matching_user(self, client):
        resp = client.get(f"/favorites/{SEED['user_id']}")  # no auth header
        assert resp.status_code == 403


class TestDeals:
    def test_active_deals(self, client):
        resp = client.get("/deals/active")
        assert resp.status_code == 200
        deals = resp.get_json()
        assert len(deals) == 2
        assert all("business_name" in d and "category" in d for d in deals)

    def test_deals_for_business(self, client):
        resp = client.get(f"/deals/business/{SEED['business_id']}")
        assert resp.status_code == 200
        deals = resp.get_json()
        assert len(deals) == 1
        assert deals[0]["code"] == "FIRST15"


class TestErrorHandling:
    def test_unknown_route_returns_json_404(self, client):
        resp = client.get("/this/route/does/not/exist")
        assert resp.status_code == 404
        assert "error" in resp.get_json()
