package wordle

import (
	"fmt"
	"strings"
)

type Color string

const (
	Green  Color = "green"
	Yellow Color = "yellow"
	Gray   Color = "gray"
)

type Tile struct {
	Letter string `json:"letter"`
	Color  Color  `json:"color"`
}

type Guess struct {
	Word  string `json:"word"`
	Tiles []Tile `json:"tiles"`
}

type PlayerState struct {
	Guesses []Guess `json:"guesses"`
	Won     bool    `json:"won"`
	Done    bool    `json:"done"`
}

type State struct {
	SecretWord string                 `json:"secret_word,omitempty"`
	Players    map[string]PlayerState `json:"players"`
	Winner     string                 `json:"winner"`
	GameOver   bool                   `json:"game_over"`
}

type Game struct {
	secretWord string
	state      State
}

func New(secretWord string, models []string) *Game {
	players := make(map[string]PlayerState)
	for _, m := range models {
		players[m] = PlayerState{}
	}
	return &Game{
		secretWord: strings.ToUpper(secretWord),
		state: State{
			Players: players,
		},
	}
}

func (g *Game) GetState(revealSecret bool) State {
	s := g.state
	if revealSecret {
		s.SecretWord = g.secretWord
	}
	return s
}

func (g *Game) MakeGuess(model, word string) ([]Tile, error) {
	word = strings.ToUpper(word)
	tiles := g.score(word)

	p := g.state.Players[model]
	p.Guesses = append(p.Guesses, Guess{Word: word, Tiles: tiles})

	if word == g.secretWord {
		p.Won = true
		p.Done = true
		if g.state.Winner == "" {
			g.state.Winner = model
		}
	} else if len(p.Guesses) >= 6 {
		p.Done = true
	}

	g.state.Players[model] = p
	g.checkGameOver()
	return tiles, nil
}

func (g *Game) checkGameOver() {
	for _, p := range g.state.Players {
		if !p.Done {
			return
		}
	}
	g.state.GameOver = true
}

func (g *Game) score(guess string) []Tile {
	tiles := make([]Tile, 5)
	secret := []rune(g.secretWord)
	guessRunes := []rune(guess)
	used := make([]bool, 5)

	for i := range guessRunes {
		tiles[i].Letter = string(guessRunes[i])
		if guessRunes[i] == secret[i] {
			tiles[i].Color = Green
			used[i] = true
		}
	}

	for i := range guessRunes {
		if tiles[i].Color == Green {
			continue
		}
		tiles[i].Color = Gray
		for j := range secret {
			if !used[j] && guessRunes[i] == secret[j] {
				tiles[i].Color = Yellow
				used[j] = true
				break
			}
		}
	}

	return tiles
}

func (g *Game) BuildPrompt(model string) string {
	p := g.state.Players[model]
	var sb strings.Builder

	sb.WriteString("You are playing Wordle. Guess the secret 5-letter English word.\n\n")
	sb.WriteString("Rules:\n- Green: correct letter, correct position\n- Yellow: correct letter, wrong position\n- Gray: letter not in the word\n\n")

	if len(p.Guesses) == 0 {
		sb.WriteString("This is your first guess. Choose a strong opening word.\n\n")
	} else {
		sb.WriteString("Your guesses so far:\n")
		for i, guess := range p.Guesses {
			sb.WriteString(fmt.Sprintf("%d. %s → ", i+1, guess.Word))
			for _, t := range guess.Tiles {
				sb.WriteString(fmt.Sprintf("%s(%s) ", t.Letter, t.Color))
			}
			sb.WriteString("\n")
		}
		sb.WriteString("\n")
	}

	sb.WriteString("Respond with ONLY a single 5-letter word in ALL CAPS. Nothing else.")
	return sb.String()
}

// MarkDone marks a model as done without a win — used when LLM errors out.
func (g *Game) MarkDone(model string) {
p := g.state.Players[model]
p.Done = true
g.state.Players[model] = p
g.checkGameOver()
}
