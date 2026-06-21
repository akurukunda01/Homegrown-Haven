# MCP — How the Assistant Actually Does Things

## First, what is MCP?

A language model on its own can only *talk*. It can't search a database or open
a page — it just produces words. So how does our assistant open Pet Haven for
you?

That's what **MCP (Model Context Protocol)** is for. Think of it as a standard
way to hand an AI model a set of **tools** it's allowed to use. Each tool is just
a function with a clear name and description. The model reads the descriptions,
decides which tool fits what you asked, and "calls" it — almost like a person
picking the right app on their phone for a task.

The nice thing about MCP is that it's a shared standard. The model doesn't need
to know *how* our tools work internally; it just needs the list of what's
available and what each one does.

## How we use it here

In HomegrownHaven, the tools live in their own little server: `voice_mcp/main.py`.
It's built with **FastMCP**, which is a library that makes a Python function into
an MCP tool just by adding a decorator on top of it. The server runs separately
from everything else, on **port 8001**, and the voice agent connects to it.

The wiring is one line in `voice_chat.py`:

```python
mcp_servers=[mcp.MCPServerHTTP(url="http://localhost:8001/mcp")]
```

That's the moment the AI "brain" (in `voice_chat.py`) gets handed the toolbox
(in `voice_mcp/main.py`).

## What one tool looks like

Here's the search tool, trimmed down. Notice three things: the **decorator** that
registers it, the **docstring** the model reads to decide when to use it, and the
**friendly `message`** it returns for the assistant to say out loud:

```python
@mcp.tool()                         # 1. registers this function as a tool
def search_businesses(query="", category=None, min_rating=None, ...):
    """Search for businesses and optionally update the UI search bar."""   # 2. the model reads this

    response = requests.get(f"{BASE_URL}/search_local", params=params)     # call our Flask API
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

A few design choices I made on purpose:

- **The docstring is the instruction manual.** The model never sees the code —
  it only sees the function name and that description. So I wrote the docstrings
  to read like plain hints ("Open the detail page for a specific business by ID
  or name"). Better descriptions = the model picks the right tool more often.
- **Every tool talks to the Flask API, not the database directly.** The tools use
  the `requests` library to call the same endpoints the website uses
  (`BASE_URL = http://localhost:8000`). That keeps all the real logic in one
  place and avoids duplicating it.
- **Every tool returns a `message` written for the ear.** Tools never return raw
  data for the user to hear — they return a short sentence. If something fails,
  the message stays calm and positive ("I couldn't find that, but…").

## The full toolbox

The server exposes **17 tools**, grouped by what they do. The header comment in
`main.py` notes these were trimmed down from 25 — fewer, clearer tools means the
model spends less time choosing and picks correctly more often.

| Group | Tools |
|---|---|
| Finding & moving around | `search_businesses`, `navigate_to_business`, `go_back_to_list` |
| Filtering & sorting | `apply_filters_to_page`, `reset_all_filters`, `sort_businesses` |
| Context (what's on screen) | `get_available_categories`, `get_current_businesses` |
| Controlling the layout | `toggle_filter_panel`, `switch_view` |
| Reviews | `get_reviews`, `add_review` |
| Favorites | `get_user_favorites`, `toggle_favorite` |
| Deals | `get_deals`, `copy_deal_code` |

## The two kinds of tools

It's worth noticing that the tools do one of two jobs:

1. **"Do something" tools** also nudge the screen. After they act, they POST to
   `/agent/navigate` so the website visually responds (search runs, a business
   opens, a filter applies). That hand-off is exactly what
   **[websockets.md](./websockets.md)** picks up next.
2. **"Tell me something" tools** (like `get_current_businesses`) just read data
   and hand it back to the model so it can answer a question — no screen change
   needed.

So MCP is the "hands" of the assistant, and the WebSocket is how those hands move
the screen you're looking at.
