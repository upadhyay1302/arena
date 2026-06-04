package wordle

import (
	"testing"
)

func TestScore(t *testing.T) {
	tests := []struct {
		secret   string
		guess    string
		expected []Color
	}{
		{
			"CRANE",
			"CRANE",
			[]Color{Green, Green, Green, Green, Green},
		},
		{
			"CRANE",
			"XXXXX",
			[]Color{Gray, Gray, Gray, Gray, Gray},
		},
		{
			"CRANE",
			"RCANE",
			[]Color{Yellow, Yellow, Green, Green, Green},
		},
		{
			// C is green at 0, second C is gray (only one C in secret)
			"CRANE",
			"CCXXX",
			[]Color{Green, Gray, Gray, Gray, Gray},
		},
		{
			// ABBEY vs KEEPS
			// K→gray, E→yellow (E exists at pos3), E→gray (E already claimed), P→gray, S→gray
			"ABBEY",
			"KEEPS",
			[]Color{Gray, Yellow, Gray, Gray, Gray},
		},
	}

	for _, tt := range tests {
		g := New(tt.secret, []string{"m1", "m2"})
		tiles := g.score(tt.guess)
		for i, tile := range tiles {
			if tile.Color != tt.expected[i] {
				t.Errorf("secret=%s guess=%s pos=%d: got %s want %s",
					tt.secret, tt.guess, i, tile.Color, tt.expected[i])
			}
		}
	}
}

func TestMakeGuess(t *testing.T) {
	g := New("CRANE", []string{"gpt-4o", "claude-3-5-sonnet"})

	_, err := g.MakeGuess("gpt-4o", "SLATE")
	if err != nil {
		t.Fatal(err)
	}

	state := g.GetState(false)
	if state.GameOver {
		t.Error("game should not be over after one wrong guess")
	}
	if state.Players["gpt-4o"].Won {
		t.Error("player should not have won with wrong guess")
	}

	_, err = g.MakeGuess("gpt-4o", "CRANE")
	if err != nil {
		t.Fatal(err)
	}

	state = g.GetState(false)
	if !state.Players["gpt-4o"].Won {
		t.Error("player should have won")
	}
	if state.Winner != "gpt-4o" {
		t.Errorf("winner should be gpt-4o, got %s", state.Winner)
	}
}

func TestGameOverWhenAllDone(t *testing.T) {
	g := New("CRANE", []string{"m1", "m2"})

	for i := 0; i < 6; i++ {
		g.MakeGuess("m1", "SLATE")
		g.MakeGuess("m2", "SLATE")
	}

	state := g.GetState(false)
	if !state.GameOver {
		t.Error("game should be over when all players exhausted guesses")
	}
}
