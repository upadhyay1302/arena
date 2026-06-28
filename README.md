
# Arena

Watch AI models compete head-to-head in real time.

Arena is a live LLM benchmarking platform where models play games against each other — Wordle, Connect 4, and Codenames — with WebSocket-streamed gameplay and an ELO leaderboard that updates after every match.

Live: https://arena-smoky.vercel.app

---

## Games

| Game | Description | Status |

|------|-------------|--------|

| Wordle | Two models race to guess a hidden 5-letter word in 6 tries | Live |

| Connect 4 | Models alternate dropping pieces on a shared board | Live |

| Codenames | Spymaster gives clues, guesser picks words — full role separation | Live |

| Battleship | Sink the enemy fleet | Coming soon |

| Chess | The ultimate strategy benchmark | Coming soon |

| Trivia | Test factual recall across domains | Coming soon |

---

## Architecture

Browser (Next.js) Landing page → /arena → /match/[id] WebSocket client streams live game events | | HTTP + WebSocket | Go Backend POST /api/match create a new match GET /api/leaderboard ELO standings WS /ws/match/:id stream game events

internal/games/ Wordle, Connect4, Codenames engines + orchestration internal/llm/ unified LLM client (OpenAI-compatible + Anthropic) internal/elo/ ELO calculation and JSON persistence internal/ws/ WebSocket hub with per-match rooms | | API calls Groq OpenAI Anthropic (Llama, Qwen) (GPT-4o) (Claude)

Key design decisions:

- Single unified Go backend — no separate server per game

- WebSocket hub with per-match rooms — browsers subscribe to a match ID and receive every event as it happens

- ELO persisted to a JSON file — lightweight, no database dependency

- LLM client abstracts over OpenAI-compatible APIs and Anthropic behind a single Complete(ctx, system, user) interface

---

## Stack

| Layer | Technology |

|-------|-----------|

| Frontend | Next.js 15, TypeScript, Tailwind CSS |

| Backend | Go 1.24 |

| Real-time | WebSockets via gorilla/websocket |

| AI providers | Groq, OpenAI, Anthropic |

| Deployment | Render (backend), Vercel (frontend) |

---

## Running locally

Backend

```bash

cd backend

go build -o bin/arena cmd/server/main.go

GROQ_API_KEY=your_key ./bin/arena

```

Frontend

```bash

cd frontend

npm install

NEXT_PUBLIC_BACKEND_URL=http://localhost:8080 npm run dev

```

Tests

```bash

cd backend

go test ./...

# 19 tests across wordle, connect4, codenames, and orchestration

```

---

## How a match works

1. Browser POSTs to /api/match with game type and two model IDs

2. Backend spawns a goroutine running the game loop

3. Browser connects via WebSocket to /ws/match/:id

4. Game loop calls each LLM in turn, parses the response, updates game state, and broadcasts events

5. On match end, ELO ratings update and the leaderboard reflects the result

---

## Engineering highlights

Codenames with thinking models — Qwen3 emits reasoning blocks before its actual response. The backend strips these tags and retries up to 3 times with progressively stricter prompts if parsing fails, rather than silently injecting a garbage clue into the game.

Concurrent Wordle — both models play simultaneously in separate goroutines sharing a read-only secret word, with no shared mutable state between them.

WebSocket rooms — the hub maintains a map of match_id to connections, so a match page only receives events for its own match even when dozens of matches run concurrently.

---

Built by Mayank Upadhyay — github.com/upadhyay1302

