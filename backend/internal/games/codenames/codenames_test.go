package codenames

import (
"testing"
)

func TestNewGame(t *testing.T) {
g := New("m1", "m2")
state := g.GetState("m1")

if len(state.Cards) != 25 {
t.Errorf("expected 25 cards, got %d", len(state.Cards))
}

blue, red, neutral, assassin := 0, 0, 0, 0
for _, c := range g.state.Cards {
switch c.Type {
case Blue:
blue++
case Red:
red++
case Neutral:
neutral++
case Assassin:
assassin++
}
}

if blue != 9 {
t.Errorf("expected 9 blue, got %d", blue)
}
if red != 8 {
t.Errorf("expected 8 red, got %d", red)
}
if neutral != 7 {
t.Errorf("expected 7 neutral, got %d", neutral)
}
if assassin != 1 {
t.Errorf("expected 1 assassin, got %d", assassin)
}
}

func TestGiveClue(t *testing.T) {
g := New("m1", "m2")

err := g.GiveClue("m2", "ocean", 2)
if err == nil {
t.Error("expected error when wrong player gives clue")
}

err = g.GiveClue("m1", "ocean", 2)
if err != nil {
t.Fatalf("unexpected error: %v", err)
}

if g.state.Phase != "guess" {
t.Errorf("expected guess phase, got %s", g.state.Phase)
}
if g.state.CurrentClue.Word != "OCEAN" {
t.Errorf("expected clue OCEAN, got %s", g.state.CurrentClue.Word)
}
if g.state.GuessesLeft != 3 {
t.Errorf("expected 3 guesses left, got %d", g.state.GuessesLeft)
}
}

func TestAssassinLoss(t *testing.T) {
g := New("m1", "m2")

// Find assassin word
var assassinWord string
for _, c := range g.state.Cards {
if c.Type == Assassin {
assassinWord = c.Word
break
}
}

// Give clue then guess assassin
g.GiveClue("m1", "test", 1)
cardType, err := g.GuessWord("m1", assassinWord)
if err != nil {
t.Fatalf("unexpected error: %v", err)
}
if cardType != Assassin {
t.Errorf("expected assassin card type, got %s", cardType)
}
if !g.state.GameOver {
t.Error("expected game over after assassin")
}
if g.state.Winner != "m2" {
t.Errorf("expected m2 to win after m1 hits assassin, got %s", g.state.Winner)
}
}

func TestTurnSwitch(t *testing.T) {
g := New("m1", "m2")

// Find a neutral word
var neutralWord string
for _, c := range g.state.Cards {
if c.Type == Neutral {
neutralWord = c.Word
break
}
}

g.GiveClue("m1", "test", 1)
g.GuessWord("m1", neutralWord)

// Should now be m2's turn
if g.state.CurrentTurn != "m2" {
t.Errorf("expected m2's turn after neutral guess, got %s", g.state.CurrentTurn)
}
if g.state.Phase != "clue" {
t.Errorf("expected clue phase after neutral guess, got %s", g.state.Phase)
}
}

func TestHiddenBoard(t *testing.T) {
g := New("m1", "m2")

// Guesser view should not see card types
guesserState := g.GetState("")
for _, c := range guesserState.Cards {
if !c.Revealed && c.Type != "" {
t.Error("guesser should not see unrevealed card types")
}
}

// Spymaster view should see all types
spymasterState := g.GetState("m1")
hasTypes := false
for _, c := range spymasterState.Cards {
if c.Type != "" {
hasTypes = true
break
}
}
if !hasTypes {
t.Error("spymaster should see card types")
}
}
