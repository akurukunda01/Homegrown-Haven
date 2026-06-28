# HomegrownHaven

A local business discovery platform with an AI-powered voice assistant.

---

## Project Overview

### Description

HomegrownHaven helps users discover and support local businesses in their community. Users can search for businesses, read and write reviews, save favorites, and find deals. The platform includes an AI voice assistant that lets users navigate the app hands-free using natural language commands.

### Features

- **Business Search & Filtering** - Search by name, filter by category, rating, and distance
- **Reviews & Ratings** - Read reviews and submit your own with 1-5 star ratings
- **Favorites** - Save businesses to a personal favorites list
- **Deals & Coupons** - View active promotions and copy discount codes
- **AI Voice Assistant** - Navigate the app using voice commands (e.g., "Find coffee shops", "Add this to my favorites")
- **Analytics Dashboard** - View business statistics and insights
- **User Authentication** - Secure login via Auth0

More Information on the features can be found here: [https://github.com/akurukunda01/Homegrown-Haven/tree/main/program_features]


### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, TailwindCSS |
| Backend | Python, Flask |
| Database | PostgreSQL |
| Authentication | Auth0 |
| Voice AI | LiveKit Agents, Deepgram (STT), ElevenLabs (TTS), Groq (LLM) |


## Repository Structure

The repo has three runnable parts — a React frontend, a Python/Flask backend, and
a separate tool server for the voice agent — plus the database schema and docs.

```
HomegrownHaven/
│
├── homegrown-haven/            # ── FRONTEND ── React 19 + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/         # UI building blocks:
│   │   │   ├── business-card.jsx       #   listing card
│   │   │   ├── business-detail.jsx     #   single-business detail view
│   │   │   ├── business-filter.jsx     #   category / rating / distance filters
│   │   │   ├── search-bar.jsx          #   debounced search input
│   │   │   ├── analytics-dashboard.jsx #   stats tab
│   │   │   ├── report-config.jsx       #   report builder UI
│   │   │   ├── report-fields.js        #   report column/field definitions
│   │   │   ├── auth.jsx                 #   Auth0 login/logout
│   │   │   └── about-page.jsx           #   static about view
│   │   ├── utils/
│   │   │   └── validators.js   # shared client-side input validation
│   │   ├── page.jsx            # main app: listing, state, WebSocket, LiveKit
│   │   ├── App.jsx             # Auth0 provider wrapper
│   │   └── main.jsx            # React entry point
│   ├── public/                 # screenshots, demo GIF, static assets
│   └── package.json            # frontend dependencies
│
├── backend/                    # ── BACKEND ── Python / Flask
│   ├── app.py                  #   Flask REST API + WebSocket relay (port 8000)
│   ├── validation.py           #   Pydantic request models + auth/ownership helpers
│   ├── voice_chat.py           #   LiveKit voice agent (Deepgram → Groq → ElevenLabs)
│   ├── generate_token.py       #   LiveKit access-token helper
│   └── db.sql                  #   PostgreSQL schema + seed data
│
├── voice_mcp/                  # ── VOICE TOOLS ── FastMCP server the agent calls (port 8001)
│   └── main.py                 #   tool definitions (search, navigate, filter, review…)
│
├── program_features/           # ── DOCS ── feature-by-feature write-ups (see above)
├── .env                        # secrets (LiveKit / API keys) — not committed
└── README.md                   # you are here
```

**Three things run together for the full app:** the Flask API (`backend/app.py`),
the frontend (`homegrown-haven/`), and — for voice — the MCP tool server
(`voice_mcp/`) plus the agent (`backend/voice_chat.py`). See [How to Run](#how-to-run).

---

## Documentation

This README is the starting point — the big picture, setup, and how to run.
For how each feature actually works, the
[`program_features/`](./program_features/README.md) folder has a standalone
write-up for each one:

| Feature | Doc |
|---|---|
| Search, filtering & distance sorting | [search-and-discovery.md](./program_features/search-and-discovery.md) |
| Reviews, favorites & deals | [reviews-favorites-deals.md](./program_features/reviews-favorites-deals.md) |
| Customizable reports (CSV / JSON / PDF export) | [customizable-report.md](./program_features/customizable-report.md) |
| Analytics dashboard | [analytics-dashboard.md](./program_features/analytics-dashboard.md) |
| **AI voice assistant** (3-part deep dive) | [intelligent-voice-feature/](./program_features/intelligent-voice-feature/overview.md) |

**Cross-cutting concerns** — apply across the whole app:

| Topic | Doc |
|---|---|
| Auth0 login & ownership checks | [authentication.md](./program_features/authentication.md) |
| Two-layer input validation | [input-validation.md](./program_features/input-validation.md) |
| Data storage across all layers | [data-storage.md](./program_features/data-storage.md) |
| Code style & conventions | [comments-and-conventions.md](./program_features/comments-and-conventions.md) |



## Setup and Installation

### Prerequisites

- **Node.js** 18+
- **Python** 3.10+
- **PostgreSQL** 16+
- **Auth0 Account** (free tier available)
- **API Keys** for: Deepgram, ElevenLabs, Groq for LLM
- **LiveKit Cloud Account** (for voice features)

### Installation Steps

**1. Clone the repository**
```bash
git clone https://github.com/your-username/HomegrownHaven.git
cd HomegrownHaven
```

**2. Set up the database**
```bash
createdb business_directory
psql -d business_directory -f backend/db.sql
```

**3. Set up the backend**
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install flask flask-cors flask-sock psycopg2-binary python-dotenv livekit livekit-agents
```

**4. Set up the frontend**
```bash
cd homegrown-haven
npm install
```

**5. Configure environment variables**

Create a `.env` file in the root directory:
```
LIVEKIT_URL=wss://your-livekit-url
LIVEKIT_API_KEY=your-key
LIVEKIT_API_SECRET=your-secret
DEEPGRAM_API_KEY=your-key
ELEVENLABS_API_KEY=your-key
GROQ_API_KEY=your-key
```

### How to Run

**Start the backend** (from root directory):
```bash
python backend/app.py
# Runs at http://localhost:8000
```

**Start the frontend** (from homegrown-haven/):
```bash
npm run dev
# Runs at http://localhost:5173
```

**Start the voice agent** (optional, from root directory):
```bash
# Terminal 1: Start MCP server
cd voice_mcp && uv run main.py
# Runs at http://localhost:8001

# Terminal 2: Start voice agent (run from root so it finds .env)
python backend/voice_chat.py dev
```

Open http://localhost:5173 in your browser.

---

## The AI Voice Assistant

The standout feature: a hands-free assistant that both **answers questions and
drives the screen**. Say *"Find coffee shops near me"* or *"Add this to my
favorites"* and the UI responds in real time — voice and clicks hit the exact
same backend, so they always behave identically.

```
User speaks --> LiveKit --> Deepgram (STT) --> LLM --> MCP tools --> Flask --> WebSocket --> React UI
                                                                          |
                                                            ElevenLabs (TTS) → reply
```

**Try saying:** "Find coffee shops near me" · "Open Pet Haven" · "Show me the
reviews" · "What deals are available?" · "Sort by rating" · "Go back to the list"

**Full breakdown** in [`program_features/intelligent-voice-feature/`](./program_features/intelligent-voice-feature/overview.md) —
the user flow ([overview](./program_features/intelligent-voice-feature/overview.md)),
the tools the assistant calls ([mcp](./program_features/intelligent-voice-feature/mcp.md)),
and how it drives the screen live ([websockets](./program_features/intelligent-voice-feature/websockets.md)).

---

## Documentation of Resources

### External Libraries

**Frontend:**
- [React](https://react.dev/) - UI framework (MIT License)
- [Vite](https://vitejs.dev/) - Build tool (MIT License)
- [TailwindCSS](https://tailwindcss.com/) - CSS framework (MIT License)
- [Lucide React](https://lucide.dev/) - Icons (ISC License)
- [Auth0 React SDK](https://auth0.com/) - Authentication (MIT License)
- [LiveKit Client](https://livekit.io/) - WebRTC client (Apache 2.0)

**Backend:**
- [Flask](https://flask.palletsprojects.com/) - Web framework (BSD-3 License)
- [psycopg2](https://www.psycopg.org/) - PostgreSQL adapter (LGPL-3)
- [LiveKit Agents](https://docs.livekit.io/agents/) - Voice agent framework (Apache 2.0)
- [FastMCP](https://github.com/jlowin/fastmcp) - MCP server (MIT License)

**AI Services:**
- [Deepgram](https://deepgram.com/) - Speech-to-text API
- [ElevenLabs](https://elevenlabs.io/) - Text-to-speech API
- [Groq](https://groq.com/) - Large language model API (`llama-4-scout`)
- [Silero VAD](https://github.com/snakers4/silero-vad) - Voice activity detection (MIT License)

### Attribution

- Authentication powered by [Auth0](https://auth0.com/)
- Real-time audio powered by [LiveKit](https://livekit.io/)
- Database powered by [PostgreSQL](https://www.postgresql.org/)
- Icons from [Lucide](https://lucide.dev/)

### Learning Resources

- [LiveKit Agent Guide (ottomator-agents)](https://github.com/coleam00/ottomator-agents/tree/main/livekit-agent) - Reference implementation for building LiveKit voice agents
- [LiveKit Agent YouTube Tutorial](https://www.youtube.com/watch?v=DJ3sab0jVco) - Video guide by Cole Medin on building AI voice agents with LiveKit

