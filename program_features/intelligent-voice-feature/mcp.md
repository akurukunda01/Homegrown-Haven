# MCP 

**MCP (Model Context Protocol)** is a standard
way to hand an AI model a set of **tools** it's allowed to use. Each tool is 
a function with a clear name and description. The model reads the descriptions,
decides which tool fits what you asked, and calls it.

## Implementation

In this repository, the tools live in their own server: `voice_mcp/main.py`.
It's built with **FastMCP**, which is a library that makes a Python function into
an MCP tool just by adding a decorator on top of it. The server runs separately
from everything else, on **port 8001**, and the voice agent connects to it.

The wiring is one line in `voice_chat.py`:

```python
mcp_servers=[mcp.MCPServerHTTP(url="http://localhost:8001/mcp")]
```

That's when the LLM (in `voice_chat.py`) gets handed the toolbox
(in `voice_mcp/main.py`).

## Tool Example

This is a tool example: a search tool. Three key aspects: the **decorator** that
registers it, the **docstring** the model reads to decide when to use it, and the
** `message`** it returns for the assistant to say out loud:

```python
@mcp.tool()                         # 1. registers this function as a tool
def search_businesses(query="", category=None, min_rating=None, ...):
    """Search for businesses and optionally update the UI search bar."""   # 2. the model reads this

    response = requests.get(f"{BASE_URL}/search_local", params=params)     # call the Flask API
    businesses = response.json()
    count = len(businesses)

    # also tell the website to follow along (more on this in websockets.md)
    requests.post(f"{BASE_URL}/agent/navigate", json={"action": "search", "query": query})

    return {                                                               # 3. voice-friendly reply
        "success": True,
        "count": count,
        "message": f"Found {count} businesses including {names}. Want me to narrow it down?"
    }
```



- **The docstring is the guidelines.** The model only sees the function name and that description. So I wrote the docstrings
  to read like plain hints ("Open the detail page for a specific business by ID
  or name"). 
- **Every tool talks to the Flask API, not the database directly.** The tools use
  the `requests` library to call the same endpoints the website uses
  (`BASE_URL = http://localhost:8000`). That keeps all the real logic in one
  place and avoids duplicating it.
- **Every tool returns a `message` written for the ear.** Instead of raw
  data, each tool in the server returns a short sentence. If something fails,
  the message become "I couldn't find that but..."

## Server Tools

The server exposes **17 tools**. 

| Group | Tools |
|---|---|
| Finding & moving around | `search_businesses`, `navigate_to_business`, `go_back_to_list` |
| Filtering & sorting | `apply_filters_to_page`, `reset_all_filters`, `sort_businesses` |
| Context (what's on screen) | `get_available_categories`, `get_current_businesses` |
| Controlling the layout | `toggle_filter_panel`, `switch_view` |
| Reviews | `get_reviews`, `add_review` |
| Favorites | `get_user_favorites`, `toggle_favorite` |
| Deals | `get_deals`, `copy_deal_code` |

## Types of tools

In this server, tools do one of two jobs:

1. **"Do something" tools** also nudge the screen. After they act, they POST to
   `/agent/navigate` so the website visually responds (search runs, a business
   opens, a filter applies). That hand-off is exactly what
   **[websockets.md](./websockets.md)** picks up next.
2. **"Tell me something" tools** (like `get_current_businesses`) just read data
   and hand it back to the model so it can answer a question.


