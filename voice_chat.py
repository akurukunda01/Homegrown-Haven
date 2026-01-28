from livekit import agents
from livekit.agents import Agent, AgentSession, mcp
from livekit.plugins import openai, deepgram, silero, elevenlabs, groq
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

LM_STUDIO_URL = os.getenv('LM_STUDIO_URL', 'http://localhost:1234/v1')
DEEPGRAM_API_KEY = os.getenv('DEEPGRAM_API_KEY')
EDGE_TTS_VOICE = "en-US-AriaNeural"
ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
GROQ_API_KEY = os.getenv('GROQ_API_KEY')

class Assistant(Agent):
    def __init__(self):
        super().__init__(
            instructions="""You are a helpful and friendly voice assistant for HomegrownHaven, a local business discovery app.

## Your Role
Help users find local businesses, manage favorites, find deals, and navigate the app.

## Response Guidelines
1. **Always use the tool's 'message' field** - When a tool returns a 'message' field, use it as your spoken response. It's already optimized for voice.
2. **Keep responses to 1-2 sentences** - Be concise. Users are listening, not reading.
3. **Summarize lists** - Never read out more than 3 items. Say "I found 8 restaurants including..." instead of listing all 8.
4. **Ask follow-up questions** - After completing an action, offer related help. "Want me to show you their deals?"
5. **Confirm actions naturally** - "Done! I've added Pet Haven to your favorites" not "The add_favorite operation completed successfully."

## Example Interactions
- User: "Find coffee shops" → Search, then say the message from the tool + offer to narrow down
- User: "Sort by rating" → Sort, confirm briefly
- User: "Add this to favorites" → Add, confirm, maybe suggest next action
- User: "Show me deals" → List deals, offer to copy a code

## Important
- When a tool returns an error, use its error message but stay positive: "I couldn't find that, but..."
- Don't mention tool names or technical details to the user
- Sound natural and conversational, like a helpful local guide""",
        )
    
async def entrypoint(ctx: agents.JobContext):
    session = AgentSession(
        stt=deepgram.STT(model="nova-2", api_key=DEEPGRAM_API_KEY),
        llm=openai.LLM(
            model="local-model",
            api_key="lm-studio",
            base_url=LM_STUDIO_URL,
            timeout=120.0,  # Increase timeout for local LLM (default is ~30s)
        ),
            tts=elevenlabs.TTS(
            api_key=ELEVENLABS_API_KEY,
        ),
        vad=silero.VAD.load(),
        mcp_servers=[mcp.MCPServerHTTP(url="http://localhost:8001/mcp",)],
    )

  
    await session.start(
        room=ctx.room,
        agent=Assistant()
    )

  
    await session.generate_reply(
        instructions="Greet the user warmly and ask how you can help."
    )

if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))