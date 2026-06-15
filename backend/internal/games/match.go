package games

import (
	"context"
	"strings"
	"sync"
	"time"

	"github.com/upadhyay1302/arena/internal/games/codenames"
	"github.com/upadhyay1302/arena/internal/games/connect4"
"github.com/upadhyay1302/arena/internal/games/wordle"
	"github.com/upadhyay1302/arena/internal/llm"
	"github.com/upadhyay1302/arena/internal/ws"
)

type Status string

const (
	StatusPending  Status = "pending"
	StatusRunning  Status = "running"
	StatusFinished Status = "finished"
)

type Match struct {
	ID     string
	Game   string
	Models []string
	Status Status
	Winner string
	hub    *ws.Hub
}

// Run starts the match — each model gets its own goroutine.
func (m *Match) Run(ctx context.Context, secretWord string) {
	m.Status = StatusRunning
	m.broadcast("match_started", map[string]any{
		"match_id": m.ID,
		"game":     m.Game,
		"models":   m.Models,
	})

	switch m.Game {
	case "wordle":
		m.runWordle(ctx, secretWord)
	case "connect4":
		m.runConnect4(ctx)
	case "codenames":
		m.runCodenames(ctx)
	}

	m.Status = StatusFinished
	m.broadcast("match_finished", map[string]any{
		"match_id": m.ID,
		"winner":   m.Winner,
	})
}

func (m *Match) runWordle(ctx context.Context, secretWord string) {
	game := wordle.New(secretWord, m.Models)

	// Build LLM clients for each model
	clients := make(map[string]*llm.Client)
	for _, model := range m.Models {
		c, err := llm.New(model)
		if err != nil {
			m.broadcast("error", map[string]any{"message": err.Error()})
			return
		}
		clients[model] = c
	}

	// Broadcast initial state
	m.broadcast("state", game.GetState(false))

	// Each model plays concurrently in its own goroutine
	var wg sync.WaitGroup
	for _, model := range m.Models {
		wg.Add(1)
		go func(model string) {
			defer wg.Done()
			m.playWordleModel(ctx, game, clients[model], model)
		}(model)
	}
	wg.Wait()

	// Reveal secret word at the end
	finalState := game.GetState(true)
	m.Winner = finalState.Winner
	m.broadcast("state", finalState)
}

func (m *Match) playWordleModel(ctx context.Context, game *wordle.Game, client *llm.Client, model string) {
	for {
		state := game.GetState(false)

		// Stop if this model is done or game is over
		p := state.Players[model]
		if p.Done || state.GameOver {
			return
		}

		// Build prompt and call LLM
		prompt := game.BuildPrompt(model)
		raw, err := client.Complete(ctx, "You are an expert Wordle player. Reply with ONE 5-letter word in ALL CAPS, nothing else.", prompt)
		if err != nil {
			m.broadcast("error", map[string]any{"model": model, "message": err.Error()})
			return
		}

		// Parse the word out — take first 5-letter alpha token
		word := extractWord(raw)
		if word == "" {
			continue
		}

		// Apply the guess
		tiles, err := game.MakeGuess(model, word)
		if err != nil {
			continue
		}

		// Broadcast this move
		m.broadcast("guess", map[string]any{
			"model": model,
			"word":  word,
			"tiles": tiles,
		})

		// Small delay so the frontend can animate
		time.Sleep(800 * time.Millisecond)

		// Check if game is over after this guess
		if game.GetState(false).GameOver {
			return
		}
	}
}

func (m *Match) broadcast(msgType string, payload any) {
	m.hub.Broadcast(m.ID, ws.Message{Type: msgType, Payload: payload})
}

// extractWord pulls the first 5-letter alphabetic token from an LLM response.
func extractWord(raw string) string {
	for _, token := range strings.Fields(raw) {
		clean := strings.ToUpper(strings.Trim(token, `"'.,:;!?`))
		if len(clean) == 5 && isAlpha(clean) {
			return clean
		}
	}
	return ""
}

func isAlpha(s string) bool {
	for _, r := range s {
		if r < 'A' || r > 'Z' {
			return false
		}
	}
	return true
}

// SetHub wires the hub after construction.
func (m *Match) SetHub(h *ws.Hub) {
	m.hub = h
}

func (m *Match) runConnect4(ctx context.Context) {
if len(m.Models) < 2 {
return
}
game := connect4.New(m.Models[0], m.Models[1])

// Build LLM clients
clients := make(map[string]*llm.Client)
for _, model := range m.Models {
c, err := llm.New(model)
if err != nil {
m.broadcast("error", map[string]any{"message": err.Error()})
return
}
clients[model] = c
}

m.broadcast("state", game.GetState())

// Turn-based loop — Connect 4 is sequential not concurrent
for !game.IsOver() {
current := game.CurrentTurn()
client := clients[current]

prompt := game.BuildPrompt(current)
raw, err := client.Complete(ctx, "You are playing Connect 4. Reply with ONLY a single digit 0-6 for the column. Nothing else.", prompt)
if err != nil {
m.broadcast("error", map[string]any{"model": current, "message": err.Error()})
break
}

// Parse column from response
col := extractCol(raw)
if col == -1 {
// Invalid response — try next turn anyway with col 0 fallback
col = 0
}

row, err := game.DropPiece(current, col)
if err != nil {
// Try each column until one works
placed := false
for c := 0; c < 7; c++ {
row, err = game.DropPiece(current, c)
if err == nil {
col = c
placed = true
break
}
}
if !placed {
break
}
}

m.broadcast("move", map[string]any{
"model": current,
"col":   col,
"row":   row,
})
m.broadcast("state", game.GetState())

time.Sleep(600 * time.Millisecond)
}

finalState := game.GetState()
m.Winner = finalState.Winner
m.broadcast("state", finalState)
}

// extractCol pulls the first digit 0-6 from an LLM response.
func extractCol(raw string) int {
for _, ch := range raw {
if ch >= '0' && ch <= '6' {
return int(ch - '0')
}
}
return -1
}

func (m *Match) runCodenames(ctx context.Context) {
if len(m.Models) < 2 {
return
}
game := codenames.New(m.Models[0], m.Models[1])

clients := make(map[string]*llm.Client)
for _, model := range m.Models {
c, err := llm.New(model)
if err != nil {
m.broadcast("error", map[string]any{"message": err.Error()})
return
}
clients[model] = c
}

// Broadcast full board to spymaster, hidden to guesser
m.broadcast("state", game.GetState(m.Models[0]))
time.Sleep(500 * time.Millisecond)

maxTurns := 50
for !game.IsOver() && maxTurns > 0 {
maxTurns--
current := game.CurrentTurn()
client := clients[current]

if game.Phase() == "clue" {
// Spymaster gives clue
prompt := game.BuildCluePrompt(current)
raw, err := client.Complete(ctx,
"You are the Spymaster in Codenames. Follow the format exactly: CLUE: <word> <number>",
prompt)
if err != nil {
m.broadcast("error", map[string]any{"model": current, "message": err.Error()})
break
}

word, number := parseClue(raw)
if word == "" {
word = "THING"
number = 1
}

if err := game.GiveClue(current, word, number); err != nil {
break
}

m.broadcast("clue", map[string]any{
"model":  current,
"word":   word,
"number": number,
})
m.broadcast("state", game.GetState(current))
time.Sleep(800 * time.Millisecond)

} else {
// Guesser picks a word
prompt := game.BuildGuessPrompt(current)
raw, err := client.Complete(ctx,
"You are the Guesser in Codenames. Reply with ONLY one word from the board.",
prompt)
if err != nil {
m.broadcast("error", map[string]any{"model": current, "message": err.Error()})
break
}

guessWord := extractWord(raw)
if guessWord == "" {
guessWord = extractAnyWord(raw)
}

cardType, err := game.GuessWord(current, guessWord)
if err != nil {
// Skip bad guess
continue
}

m.broadcast("guess", map[string]any{
"model":     current,
"word":      guessWord,
"card_type": cardType,
})
m.broadcast("state", game.GetState(current))
time.Sleep(600 * time.Millisecond)
}
}

finalState := game.GetState("")
m.Winner = finalState.Winner
m.broadcast("state", finalState)
}

// parseClue extracts word and number from "CLUE: OCEAN 3"
func parseClue(raw string) (string, int) {
raw = strings.ToUpper(strings.TrimSpace(raw))
// Find "CLUE:" prefix
idx := strings.Index(raw, "CLUE:")
if idx >= 0 {
raw = strings.TrimSpace(raw[idx+5:])
}
parts := strings.Fields(raw)
if len(parts) < 2 {
return "", 0
}
word := parts[0]
number := 0
fmt.Sscanf(parts[1], "%d", &number)
if number < 1 {
number = 1
}
if number > 9 {
number = 9
}
return word, number
}

// extractAnyWord gets the first word from a response
func extractAnyWord(raw string) string {
parts := strings.Fields(strings.ToUpper(raw))
if len(parts) > 0 {
return strings.Trim(parts[0], `"'.,!?`)
}
return ""
}
