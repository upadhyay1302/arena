package games

import (
	"context"
	"strings"
	"sync"
	"time"

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
	time.Sleep(30 * time.Second)
	m.broadcast("match_started", map[string]any{
		"match_id": m.ID,
		"game":     m.Game,
		"models":   m.Models,
	})

	switch m.Game {
	case "wordle":
		m.runWordle(ctx, secretWord)
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
