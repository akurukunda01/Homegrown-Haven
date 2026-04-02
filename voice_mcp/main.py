"""
Optimized MCP server for HomegrownHaven voice agent.
Consolidated from 25 tools to 17 for faster LLM tool selection.
All tools return voice-friendly messages.
"""

from mcp.server.fastmcp import FastMCP
import requests
from typing import Optional, Literal

# Create an MCP server
mcp = FastMCP("voice_agent", json_response=True, port=8001)

BASE_URL = "http://localhost:8000"  # Your Flask server URL


# search

@mcp.tool()
def search_businesses(
    query: str = "",
    category: Optional[str] = None,
    min_rating: Optional[float] = None,
    max_distance: Optional[float] = None,
    update_ui: bool = True
):
    """
    Search for businesses and optionally update the UI search bar.

    query: Search term
    category: Filter by category (e.g., "Pet Care", "Restaurant", "Cafe")
    min_rating: Minimum star rating (0-5)
    max_distance: Maximum distance in miles
    update_ui: If True, updates the frontend search bar (default: True)
    """
    params = {"q": query}
    if category:
        params["category"] = category
    if min_rating is not None:
        params["min_rating"] = min_rating
    if max_distance is not None:
        params["max_distance"] = max_distance

    try:
        response = requests.get(f"{BASE_URL}/search_local", params=params)
        if not response.ok:
            return {"error": True, "message": "I couldn't search right now. Please try again."}

        businesses = response.json()
        count = len(businesses)

        # Update UI search bar if requested
        if update_ui and query:
            requests.post(f"{BASE_URL}/agent/navigate", json={
                "action": "search",
                "query": query
            })

        # Build voice-friendly message
        if count == 0:
            message = f"I couldn't find any businesses matching '{query}'. Would you like to try a different search?"
        elif count == 1:
            b = businesses[0]
            message = f"I found {b['name']}, a {b['category'].lower()} with {b.get('rating', 'no')} stars. Would you like to see more details?"
        elif count <= 5:
            names = ", ".join([b['name'] for b in businesses[:3]])
            message = f"Found {count} businesses including {names}. Want me to tell you about any of them?"
        else:
            message = f"Found {count} businesses. The top ones are {businesses[0]['name']} and {businesses[1]['name']}. Want me to narrow it down?"

        return {
            "success": True,
            "businesses": [{"id": b["id"], "name": b["name"], "category": b["category"], "rating": b.get("rating")} for b in businesses],
            "count": count,
            "message": message
        }
    except Exception as e:
        return {"error": True, "message": "Something went wrong with the search. Please try again.", "details": str(e)}


@mcp.tool()
def navigate_to_business(business_id: Optional[int] = None, name: Optional[str] = None):
    """
    Open the detail page for a specific business by ID or name.

    business_id: ID of the business (use if known)
    name: Business name or partial name to search for (use if ID unknown)
    """
    if business_id is None and name is None:
        return {"error": True, "message": "Please tell me which business you'd like to see."}

    try:
        # If we have an ID, use it directly
        if business_id is not None:
            # Fetch business name for confirmation message
            response = requests.get(f"{BASE_URL}/search_local", params={"q": ""})
            businesses = response.json() if response.ok else []
            business = next((b for b in businesses if b["id"] == business_id), None)
            business_name = business["name"] if business else f"business #{business_id}"

            requests.post(f"{BASE_URL}/agent/navigate", json={
                "action": "select_business",
                "business_id": business_id
            })
            return {"success": True, "business_id": business_id, "message": f"I've opened {business_name} for you."}

        # Search by name
        response = requests.get(f"{BASE_URL}/search_local", params={"q": name})
        if not response.ok:
            return {"error": True, "message": f"I couldn't find '{name}'. Could you try a different name?"}

        businesses = response.json()
        if not businesses:
            return {"error": True, "message": f"I couldn't find a business called '{name}'. Want me to search for something similar?"}

        best_match = businesses[0]
        requests.post(f"{BASE_URL}/agent/navigate", json={
            "action": "select_business",
            "business_id": best_match["id"]
        })
        return {
            "success": True,
            "navigated_to": best_match["name"],
            "id": best_match["id"],
            "message": f"I've opened {best_match['name']} for you."
        }
    except Exception as e:
        return {"error": True, "message": "I had trouble opening that business. Please try again.", "details": str(e)}


@mcp.tool()
def go_back_to_list():
    """Return to the main business listing page."""
    try:
        requests.post(f"{BASE_URL}/agent/navigate", json={"action": "go_back"})
        return {"success": True, "message": "I've taken you back to the business list."}
    except Exception as e:
        return {"error": True, "message": "I couldn't go back. Please try again.", "details": str(e)}


# filters

@mcp.tool()
def apply_filters_to_page(
    category: Optional[str] = None,
    min_rating: Optional[float] = None,
    max_distance: Optional[float] = None,
    favorites_only: Optional[bool] = None,
    has_deals: Optional[bool] = None
):
    """
    Apply filters to the business listing. All parameters are optional.

    category: Business category (e.g., "Pet Care", "Restaurant", "Cafe")
    min_rating: Minimum star rating (0-5)
    max_distance: Maximum distance in miles (1, 2, 5, 10, 20)
    favorites_only: Show only favorited businesses
    has_deals: Show only businesses with active deals
    """
    filters = {}
    filter_descriptions = []

    if category:
        filters["category"] = category
        filter_descriptions.append(f"{category} businesses")
    if min_rating is not None:
        filters["minRating"] = min_rating
        filter_descriptions.append(f"{min_rating}+ stars")
    if max_distance is not None:
        filters["maxDistance"] = max_distance
        filter_descriptions.append(f"within {max_distance} miles")
    if favorites_only is not None:
        filters["favoritesOnly"] = favorites_only
        if favorites_only:
            filter_descriptions.append("favorites only")
    if has_deals is not None:
        filters["hasDeals"] = has_deals
        if has_deals:
            filter_descriptions.append("with deals")

    try:
        requests.post(f"{BASE_URL}/agent/navigate", json={
            "action": "apply_filters",
            "filters": filters
        })

        if filter_descriptions:
            message = f"Done! Showing {', '.join(filter_descriptions)}."
        else:
            message = "Filters applied."

        return {"success": True, "applied_filters": filters, "message": message}
    except Exception as e:
        return {"error": True, "message": "I couldn't apply those filters. Please try again.", "details": str(e)}


@mcp.tool()
def reset_all_filters():
    """Reset all filters to default values."""
    try:
        requests.post(f"{BASE_URL}/agent/navigate", json={"action": "reset_filters"})
        return {"success": True, "message": "I've cleared all filters. You're seeing all businesses now."}
    except Exception as e:
        return {"error": True, "message": "I couldn't reset the filters. Please try again.", "details": str(e)}


@mcp.tool()
def sort_businesses(sort_by: Literal["rating", "distance", "name", "reviews"], order: Literal["asc", "desc"] = "desc"):
    """
    Sort the business listing by a specific criteria.

    sort_by: What to sort by - "rating", "distance", "name", or "reviews"
    order: Sort order - "asc" (ascending) or "desc" (descending, default)
    """
    try:
        requests.post(f"{BASE_URL}/agent/navigate", json={
            "action": "sort_businesses",
            "sort_by": sort_by,
            "order": order
        })

        order_text = "highest" if order == "desc" else "lowest"
        if sort_by == "distance":
            order_text = "closest" if order == "asc" else "farthest"
        elif sort_by == "name":
            order_text = "A to Z" if order == "asc" else "Z to A"

        message = f"Done! Showing {order_text} {sort_by} first."
        return {"success": True, "sort_by": sort_by, "order": order, "message": message}
    except Exception as e:
        return {"error": True, "message": "I couldn't sort the businesses. Please try again.", "details": str(e)}


# Business Info

@mcp.tool()
def get_available_categories():
    """Get all available business categories."""
    try:
        response = requests.get(f"{BASE_URL}/categories")
        if not response.ok:
            return {"error": True, "message": "I couldn't get the categories right now."}

        categories = response.json()
        if len(categories) <= 5:
            cat_list = ", ".join(categories)
            message = f"We have {cat_list}."
        else:
            cat_list = ", ".join(categories[:4])
            message = f"We have {len(categories)} categories including {cat_list}, and more."

        return {"success": True, "categories": categories, "message": message}
    except Exception as e:
        return {"error": True, "message": "I couldn't fetch categories.", "details": str(e)}


@mcp.tool()
def get_current_businesses():
    """Get list of businesses currently available."""
    try:
        response = requests.get(f"{BASE_URL}/get_local")
        if not response.ok:
            return {"error": True, "message": "I couldn't get the business list right now."}

        businesses = response.json()
        count = len(businesses)

        if count == 0:
            message = "There are no businesses to show right now."
        elif count <= 3:
            names = ", ".join([b['name'] for b in businesses])
            message = f"There are {count} businesses: {names}."
        else:
            names = ", ".join([b['name'] for b in businesses[:3]])
            message = f"There are {count} businesses. The first few are {names}. Want details on any of them?"

        return {
            "success": True,
            "businesses": [{"id": b["id"], "name": b["name"], "category": b["category"], "rating": b.get("rating")} for b in businesses],
            "count": count,
            "message": message
        }
    except Exception as e:
        return {"error": True, "message": "I couldn't fetch businesses.", "details": str(e)}


#UI control

@mcp.tool()
def toggle_filter_panel(open: bool):
    """
    Open or close the filter sidebar panel.

    open: True to open the panel, False to close it
    """
    try:
        requests.post(f"{BASE_URL}/agent/navigate", json={
            "action": "toggle_filter_panel",
            "open": open
        })
        state = "opened" if open else "closed"
        return {"success": True, "message": f"I've {state} the filter panel."}
    except Exception as e:
        return {"error": True, "message": "I couldn't toggle the filter panel.", "details": str(e)}


@mcp.tool()
def switch_view(view: Literal["businesses", "analytics"]):
    """
    Switch between views.

    view: View to switch to - 'businesses' (main listing) or 'analytics' (dashboard)
    """
    try:
        requests.post(f"{BASE_URL}/agent/navigate", json={
            "action": "switch_view",
            "view": view
        })
        view_name = "analytics dashboard" if view == "analytics" else "business listing"
        return {"success": True, "message": f"Switched to the {view_name}."}
    except Exception as e:
        return {"error": True, "message": "I couldn't switch views.", "details": str(e)}


# reviews

@mcp.tool()
def get_reviews(
    business_id: int,
    sort_by: Literal["recent", "highest", "lowest"] = "recent",
    filter_rating: Optional[int] = None,
    apply_to_ui: bool = False
):
    """
    Get reviews for a business with optional sorting/filtering.

    business_id: ID of the business
    sort_by: Sort order - "recent", "highest", or "lowest"
    filter_rating: Filter by star rating 1-5, or None for all
    apply_to_ui: If True, also updates the review display in the UI
    """
    try:
        response = requests.get(f"{BASE_URL}/get_reviews/{business_id}")
        if not response.ok:
            return {"error": True, "message": "I couldn't get the reviews right now."}

        reviews = response.json()

        # Apply sorting
        if sort_by == "highest":
            reviews = sorted(reviews, key=lambda r: r.get('rating', 0), reverse=True)
        elif sort_by == "lowest":
            reviews = sorted(reviews, key=lambda r: r.get('rating', 0))
        else:
            reviews = sorted(reviews, key=lambda r: r.get('created_at', ''), reverse=True)

        # Apply rating filter
        if filter_rating is not None:
            if 1 <= filter_rating <= 5:
                reviews = [r for r in reviews if r.get('rating') == filter_rating]
            else:
                return {"error": True, "message": "Rating filter must be between 1 and 5."}

        # Update UI if requested
        if apply_to_ui:
            requests.post(f"{BASE_URL}/agent/navigate", json={
                "action": "sort_filter_reviews",
                "business_id": business_id,
                "sort_by": sort_by,
                "filter_rating": filter_rating
            })

        # Build message
        count = len(reviews)
        if count == 0:
            message = "This business doesn't have any reviews yet."
        elif count == 1:
            r = reviews[0]
            message = f"There's 1 review with {r.get('rating')} stars."
        else:
            avg = sum(r.get('rating', 0) for r in reviews) / count
            message = f"There are {count} reviews with an average of {avg:.1f} stars."

        return {
            "success": True,
            "reviews": reviews,
            "total_count": count,
            "sort_by": sort_by,
            "message": message
        }
    except Exception as e:
        return {"error": True, "message": "I couldn't fetch the reviews.", "details": str(e)}


@mcp.tool()
def add_review(business_id: int, rating: int, comment: str, user_id: int):
    """
    Add a new review to a business.

    business_id: ID of the business to review
    rating: Star rating from 1-5
    comment: Review text (10-500 characters)
    user_id: ID of the user submitting the review
    """
    if not isinstance(rating, int) or rating < 1 or rating > 5:
        return {"error": True, "message": "Please give a rating between 1 and 5 stars."}

    comment_stripped = comment.strip()
    if len(comment_stripped) < 10:
        return {"error": True, "message": "Your review needs to be at least 10 characters. Could you add a bit more detail?"}
    if len(comment_stripped) > 500:
        return {"error": True, "message": "Your review is too long. Please keep it under 500 characters."}

    try:
        response = requests.post(f"{BASE_URL}/add_reviews",
            json={"business": business_id, "rating": rating, "comment": comment_stripped},
            headers={"X-Auth0-User-ID": str(user_id)}
        )

        if not response.ok:
            data = response.json()
            if 'errors' in data:
                return {"error": True, "message": f"Couldn't submit your review: {data['errors'][0]}"}
            return {"error": True, "message": "I couldn't submit your review. Please try again."}

        # Trigger UI refresh
        requests.post(f"{BASE_URL}/agent/navigate", json={
            "action": "refresh_reviews",
            "business_id": business_id
        })

        star_word = "star" if rating == 1 else "stars"
        return {
            "success": True,
            "message": f"I've submitted your {rating}-{star_word} review. Thanks for sharing!",
            "review": response.json()
        }
    except Exception as e:
        return {"error": True, "message": "Something went wrong submitting your review.", "details": str(e)}


#favorites

@mcp.tool()
def get_user_favorites(user_id: int):
    """
    Get all favorited businesses for a user.

    user_id: ID of the user
    """
    try:
        response = requests.get(f"{BASE_URL}/favorites/{user_id}")
        if not response.ok:
            return {"error": True, "message": "I couldn't get your favorites right now."}

        favorites = response.json()
        count = len(favorites)

        if count == 0:
            message = "You haven't saved any favorites yet. Would you like me to help you find some businesses?"
        elif count == 1:
            message = f"You have 1 favorite: {favorites[0]['name']}."
        elif count <= 3:
            names = ", ".join([f['name'] for f in favorites])
            message = f"You have {count} favorites: {names}."
        else:
            names = ", ".join([f['name'] for f in favorites[:2]])
            message = f"You have {count} favorites including {names}."

        return {"success": True, "favorites": favorites, "count": count, "message": message}
    except Exception as e:
        return {"error": True, "message": "I couldn't fetch your favorites.", "details": str(e)}


@mcp.tool()
def toggle_favorite(user_id: int, business_id: int, action: Literal["add", "remove"]):
    """
    Add or remove a business from favorites.

    user_id: ID of the user
    business_id: ID of the business
    action: "add" to favorite, "remove" to unfavorite
    """
    try:
        if action == "add":
            response = requests.post(f"{BASE_URL}/favorites", json={
                "user_id": user_id,
                "business_id": business_id
            })
            if not response.ok:
                data = response.json()
                if "already" in str(data).lower():
                    return {"success": True, "message": "This one's already in your favorites!"}
                return {"error": True, "message": "I couldn't add that to your favorites."}

            requests.post(f"{BASE_URL}/agent/navigate", json={
                "action": "update_favorite",
                "business_id": business_id,
                "is_favorited": True
            })
            return {"success": True, "message": "Added to your favorites!"}

        else:  # remove
            response = requests.delete(f"{BASE_URL}/favorites/{user_id}/{business_id}")
            if not response.ok:
                return {"error": True, "message": "I couldn't remove that from your favorites."}

            requests.post(f"{BASE_URL}/agent/navigate", json={
                "action": "update_favorite",
                "business_id": business_id,
                "is_favorited": False
            })
            return {"success": True, "message": "Removed from your favorites."}

    except Exception as e:
        return {"error": True, "message": "Something went wrong updating your favorites.", "details": str(e)}


# deals

@mcp.tool()
def get_deals(business_id: Optional[int] = None, category: Optional[str] = None):
    """
    Get active deals. If business_id given, fetches for that business only. Otherwise fetches all deals, optionally filtered by category.

    business_id: ID of a specific business, or omit for all deals
    category: Optional category to filter deals (e.g., "Restaurant", "Cafe")
    """
    try:
        if business_id is not None:
            response = requests.get(f"{BASE_URL}/deals/business/{business_id}")
            if not response.ok:
                return {"error": True, "message": "I couldn't get the deals right now."}

            deals = response.json()
            count = len(deals)

            if count == 0:
                message = "There aren't any deals for this business right now."
            elif count == 1:
                deal = deals[0]
                discount = f"{deal.get('discount_percentage')}% off" if deal.get('discount_percentage') else deal.get('title')
                message = f"There's 1 deal: {discount}. Would you like the code?"
            else:
                message = f"There are {count} deals available! Would you like me to go through them?"
        else:
            response = requests.get(f"{BASE_URL}/deals/active")
            if not response.ok:
                return {"error": True, "message": "I couldn't get the deals right now."}

            deals = response.json()

            if category:
                deals = [d for d in deals if d.get('category', '').lower() == category.lower()]

            count = len(deals)

            if count == 0:
                if category:
                    message = f"There aren't any {category.lower()} deals right now."
                else:
                    message = "There aren't any deals available right now."
            elif count <= 3:
                business_names = ", ".join([d.get('business_name', 'Unknown') for d in deals])
                message = f"Found {count} deals at {business_names}."
            else:
                message = f"Found {count} deals! The best ones are at {deals[0].get('business_name')} and {deals[1].get('business_name')}."

        return {"success": True, "deals": deals, "count": count, "message": message}
    except Exception as e:
        return {"error": True, "message": "I couldn't fetch the deals.", "details": str(e)}


@mcp.tool()
def copy_deal_code(code: str):
    """
    Copy a deal code to the user's clipboard.

    code: The promotional code to copy
    """
    try:
        requests.post(f"{BASE_URL}/agent/navigate", json={
            "action": "copy_deal_code",
            "code": code
        })
        return {"success": True, "message": f"I've copied the code '{code}' to your clipboard!"}
    except Exception as e:
        return {"error": True, "message": "I couldn't copy that code.", "details": str(e)}


# Run with streamable HTTP transport
if __name__ == "__main__":
    mcp.run(transport="streamable-http")
