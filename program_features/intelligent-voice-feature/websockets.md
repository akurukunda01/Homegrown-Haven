# WebSockets — How the Screen Updates Live

## First, what's a WebSocket?

Normally a website works in a "you ask, the server answers" pattern. The browser
sends a request, gets one response, and that's it. The server can't just speak up
on its own — it only ever replies when asked.

That's a problem for the voice assistant. When you say "open Pet Haven," it's the
*assistant* (running on the server side) that decides the screen should change.
The browser never asked for it. We need the server to be able to tap the browser
on the shoulder and say "hey, do this now."

A **WebSocket** is what makes that possible. Instead of a one-time request and
response, it opens a single connection that stays open, and **either side can
send a message through it at any time**. Think of a regular request as mailing a
letter and waiting for a reply, versus a WebSocket as keeping a phone line open
the whole time.

## How we use it here

When the website loads, it immediately opens a WebSocket to the Flask backend and
just keeps it open. Then it sits and listens. This happens in `page.jsx`:

```jsx
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);   // a command from the assistant
  switch (data.action) {
    case 'select_business': /* open that business */ break;
    case 'search':          /* fill in the search box */ break;
    case 'apply_filters':   /* apply those filters */ break;
    // ...and so on
  }
};
```

On the backend, Flask keeps track of every browser that's connected, and has a
helper to broadcast a message to all of them (`backend/app.py`):

```python
connected_clients = set()          # every open browser tab

def send_to_frontend(message):
    for client in list(connected_clients):
        client.send(json.dumps(message))   # push the command down the wire
```

## The hand-off that ties it together

Here's the piece that connects MCP to the screen. Remember from
**[mcp.md](./mcp.md)** that a tool, after it acts, POSTs to `/agent/navigate`.
That endpoint is tiny — its only job is to take whatever the tool sent and
broadcast it to every browser over the WebSocket:

```python
@app.route('/agent/navigate', methods=['POST'])
def agent_navigate():
    data = request.json
    send_to_frontend(data)     # push it out to the browser(s)
    return {"status": "sent"}, 200
```

So the chain is:

```
MCP tool runs  →  POST /agent/navigate  →  send_to_frontend()  →  WebSocket
                                                                     ↓
                                              page.jsx onmessage → screen updates
```

## A concrete example

You say **"open Pet Haven."**

1. The `navigate_to_business` tool finds Pet Haven's id and POSTs
   `{ "action": "select_business", "business_id": 3 }` to `/agent/navigate`.
2. Flask broadcasts that message over the WebSocket.
3. `page.jsx` receives it, matches `case 'select_business'`, finds the business
   in its list, and opens its detail page — all without you touching the mouse.

```jsx
case 'select_business':
  const business = businesses.find(b => b.id === data.business_id);
  if (business) setSelectedBusiness(business);   // the page navigates itself
  break;
```

## The actions the assistant can trigger

Each message has an `action` that tells the page what to do. The ones `page.jsx`
listens for:

`select_business`, `go_back`, `search`, `apply_filters`, `update_favorite`,
`refresh_reviews`, `copy_deal_code`, `sort_filter_reviews`, `reset_filters`,
`toggle_filter_panel`, `switch_view`, `sort_businesses`.

## One more thing: audio vs. commands

It's easy to mix these up, so to be clear — there are *two* separate channels:

- **LiveKit** carries the **audio** (your voice in, the assistant's voice out).
- The **WebSocket** carries the **commands** that move the screen.

They run side by side. LiveKit handles the talking; the WebSocket handles the
"make the website do the thing." Keeping them separate is what lets the assistant
speak and act at the same time.
