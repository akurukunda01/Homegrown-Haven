"""Unit tests for the pure helper functions in backend/app.py.

calculate_distance() and _clean_query_args() have no DB or network dependencies,
so they can be imported and called directly. (Importing app.py does not open a DB
connection -- connections are made lazily per-request via get_db().)
"""

from werkzeug.datastructures import MultiDict

import app


# ----------------------------------------------------------- calculate_distance
class TestCalculateDistance:
    def test_zero_distance_to_self(self):
        assert app.calculate_distance(40.0, -76.0, 40.0, -76.0) == 0.0

    def test_symmetry(self):
        a = app.calculate_distance(40.2859, -76.6502, 40.30, -76.60)
        b = app.calculate_distance(40.30, -76.60, 40.2859, -76.6502)
        assert a == b

    def test_known_distance_within_tolerance(self):
        # Harrisburg, PA (~40.2732, -76.8867) to Lancaster, PA (~40.0379, -76.3055)
        # is roughly 35 miles. Assert within a generous tolerance.
        d = app.calculate_distance(40.2732, -76.8867, 40.0379, -76.3055)
        assert 30 < d < 40

    def test_result_is_rounded_to_one_decimal(self):
        d = app.calculate_distance(40.2859, -76.6502, 41.0, -77.0)
        assert d == round(d, 1)


# ------------------------------------------------------------- _clean_query_args
class TestCleanQueryArgs:
    def test_drops_all_and_empty_sentinels(self):
        args = MultiDict([
            ("min_rating", "all"),
            ("max_distance", ""),
            ("lat", "all"),
            ("lng", ""),
        ])
        cleaned = app._clean_query_args(args)
        for key in ("min_rating", "max_distance", "lat", "lng"):
            assert key not in cleaned

    def test_keeps_real_numeric_values(self):
        args = MultiDict([("min_rating", "4"), ("lat", "40.0"), ("lng", "-76.0")])
        cleaned = app._clean_query_args(args)
        assert cleaned["min_rating"] == "4"
        assert cleaned["lat"] == "40.0"
        assert cleaned["lng"] == "-76.0"

    def test_preserves_non_numeric_keys(self):
        # q and category are never stripped, even when blank/'all'.
        args = MultiDict([("q", "coffee"), ("category", "all"), ("min_rating", "all")])
        cleaned = app._clean_query_args(args)
        assert cleaned["q"] == "coffee"
        assert cleaned["category"] == "all"   # category sentinel handled in the route, not here
        assert "min_rating" not in cleaned
