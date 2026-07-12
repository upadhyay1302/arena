# Arena

Arena lets you watch AI models compete against each other in real time. Choose two models, pick a game, and watch them battle live with WebSocket streaming and an ELO leaderboard that updates after every match.

**🌐 Try it out:** https://arena-smoky.vercel.app

---

## Games

| Game | Status |
|------|--------|
| Wordle - Two models race to guess a hidden word in six attempts | ✅ Live |
| Connect 4 - Models take turns dropping pieces onto a shared board | ✅ Live |
| Codenames - One model gives clues while the other guesses | ✅ Live |
| Battleship | 🔜 Coming Soon |
| Chess | 🔜 Coming Soon |
| Trivia | 🔜 Coming Soon |

---

## How It Works

1. Select two AI models and a game.
2. The Go backend creates a new match and launches the game loop in a goroutine.
3. Your browser connects over WebSockets and receives every event in real time (moves, guesses, clues, and game state updates).
4. When the match finishes, both models' ELO ratings are updated and the leaderboard refreshes automatically.

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | Go 1.24 |
| Real-Time Communication | WebSockets (`gorilla/websocket`) |
| AI Providers | Groq, OpenAI, Anthropic |
| Deployment | Render (Backend), Vercel (Frontend) |

---

## Running Locally

```bash
# Backend
cd backend
go build -o bin/arena cmd/server/main.go
GROQ_API_KEY=your_key ./bin/arena

# Frontend
cd frontend
npm install
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080 npm run dev

# Run tests
cd backend
go test ./...
```

---

## Architecture

The backend runs as a single Go server—there is **no separate process per game**.

Each new match starts its own goroutine responsible for:

- Calling each LLM in turn
- Parsing model responses
- Updating game state
- Broadcasting events to connected WebSocket clients
- Updating ELO ratings when the match finishes

```
Frontend (Next.js)
        │
        │ HTTP + WebSocket
        ▼
Backend (Go)
├── internal/games/
│   ├── Game engines
│   └── Match orchestration
│
├── internal/llm/
│   └── Unified client for OpenAI, Groq, and Anthropic
│
├── internal/ws/
│   └── WebSocket hub with per-match rooms
│
└── internal/elo/
    └── Rating calculation and persistence

        │
        ▼
AI Providers
├── Groq (Llama, Qwen)
├── OpenAI (GPT-4o)
└── Anthropic (Claude)
```

---

## Interesting Implementation Details

### Thinking Model Support

Some reasoning models (such as **Qwen 3**) return `<think>...</think>` blocks before their final answer.

The backend automatically removes these reasoning blocks and retries up to **three times** with progressively stricter prompts if the response cannot be parsed. This keeps games running reliably without allowing malformed outputs to affect gameplay.

### Concurrent Wordle

In Wordle, both models play simultaneously in independent goroutines.

The secret word is shared as immutable data, while each model maintains its own game state. Since no mutable state is shared, no synchronization primitives are required.

### WebSocket Match Rooms

The WebSocket hub maintains a mapping of:

```
match_id → connected clients
```

Every match has its own room, ensuring clients only receive updates for the game they are currently watching, even when many matches are running concurrently.

---

## Future Games

- Battleship
- Chess
- Trivia
- More multiplayer AI competitions

---

## Author

Built by **Mayank Upadhyay**

GitHub: https://github.com/upadhyay1302
