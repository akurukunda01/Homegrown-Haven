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

More Information on the features can be found here: 

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, TailwindCSS |
| Backend | Python, Flask |
| Database | PostgreSQL |
| Authentication | Auth0 |
| Voice AI | LiveKit Agents, Deepgram (STT), ElevenLabs (TTS), Groq (LLM) |

---

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
psql -d business_directory -f db.sql
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
python app.py
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

# Terminal 2: Start voice agent
python voice_chat.py
```

Open http://localhost:5173 in your browser.

---

## How the Voice AI Agent Works

The voice assistant allows hands-free navigation using natural speech.

### Architecture

```
User speaks → Microphone → LiveKit (WebRTC) → Deepgram STT → LLM → MCP Tools → Flask API → WebSocket → React UI
                                                                        ↓
                                                              ElevenLabs TTS → Speaker
```

### Components

| Component | Purpose |
|-----------|---------|
| **LiveKit** | Real-time audio streaming between browser and server |
| **Deepgram** | Converts speech to text (Speech-to-Text) |
| **LLM** | Understands user intent and decides which action to take |
| **MCP Server** | Provides tools the LLM can call (search, navigate, favorite, etc.) |
| **ElevenLabs** | Converts responses back to speech (Text-to-Speech) |

### Example Voice Commands

- "Find coffee shops near me"
- "Open Pet Haven"
- "Show me the reviews"
- "Add this to my favorites"
- "What deals are available?"
- "Sort by rating"
- "Go back to the list"

### How It Works

1. User clicks the AI Assistant button to connect
2. User speaks a command (e.g., "Find restaurants")
3. Audio streams to LiveKit Cloud
4. Deepgram transcribes speech to text
5. LLM interprets the request and calls the appropriate MCP tool
6. MCP tool sends a command to the Flask backend
7. Flask broadcasts the command via WebSocket
8. React frontend updates the UI
9. LLM response is converted to speech via ElevenLabs
10. User hears the confirmation

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

---

## License

This project was created for the FBLA Coding & Programming Competition.
