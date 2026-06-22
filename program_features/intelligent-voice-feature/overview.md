# The Intelligent Voice Assistant

Instead of clicking around, you can just talk to the web app ie. "find coffee shops," "open Pet Haven,"
"add this to my favorites," "what deals are there?". The voice assistant can both converse and *drive the screen*.

This folder explains how it all fits together:

- **overview.md** (current file) — full user flow and set up of the agent.
- **[mcp.md](./mcp.md)** — details the "tools" the assistant uses to take
  action (the MCP server).
- **[websockets.md](./websockets.md)** — details how the assistant is able to drive the screen from the user's POV

## Basic User Flow 

1. **microphone** streams audio to the cloud (handled by **LiveKit**).
2. **Deepgram** listens and turns user speech into text (STT).
3. A **Groq** language model reads that text and figures out what is the user *want*.
4. The model picks one of the app's **tools** and runs it to cater to the user.
5. That tool tells the website to update, and **ElevenLabs** turns the model's
   reply back into a voice you hear.


## Tech Stack

| Job | What I used | Lives in |
|---|---|---|
| Streaming audio in real time | **LiveKit Agents** | `voice_chat.py` |
| Speech → text (STT) | **Deepgram** (`nova-2`) | `voice_chat.py` |
| The "brain" that decides what to do | **Groq** LLM (`llama-4-scout`) | `voice_chat.py` |
| Text → speech (TTS) | **ElevenLabs** | `voice_chat.py` |
| Knowing when you've started/stopped talking | **Silero VAD** | `voice_chat.py` |
| The tools the AI can run | **FastMCP** | `voice_mcp/main.py` |
| Pushing live updates to the screen | **Flask-Sock** (WebSocket) | `app.py`, `page.jsx` |

## Example User Flow

Here is an example user flow communicating with the agent:

```
User: "Find coffee shops"
  → LiveKit carries your audio to the agent
  → Deepgram writes it down: "find coffee shops"
  → Groq reads it and decides: this is a search, call the search tool
  → the search_businesses tool (voice_mcp/main.py) calls the Flask API
  → Flask searches the database and the tool gets the results back
  → the tool also pings Flask's /agent/navigate so the page can follow along
  → Flask pushes that over the WebSocket → the React UI runs the search on screen
  → meanwhile the tool hands a short, friendly sentence back to Groq
  → ElevenLabs speaks it: "Found 8 cafes including Coffee House. Want me to
     narrow it down?"
```

- **The model is told to behave like a person, not a machine.** In
  `voice_chat.py` the assistant's instructions say things like "keep responses
  to 1–2 sentences," "never read out more than 3 items," and "don't mention tool
  names." That's why it summarizes instead of reading a list of 8 businesses.
- **Every tool writes its own spoken reply.** Each tool returns a ready-made
  `message` (e.g. *"I've opened Pet Haven for you."*) so the voice stays natural
  and consistent. 

## Running the full assistant

The voice feature is three programs running together:

1. `python app.py` — the Flask API + WebSocket (port 8000)
2. `cd voice_mcp && uv run main.py` — the tool server (port 8001)
3. `python voice_chat.py` — the LiveKit voice agent

Once all three are up and the browser joins the audio room, you can start
talking. For more details of the last two pieces, see **mcp.md** and
**websockets.md**.
