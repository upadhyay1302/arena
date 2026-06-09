package connect4

import "testing"

func TestDropPiece(t *testing.T) {
g := New("m1", "m2")

// m1 drops in col 3
row, err := g.DropPiece("m1", 3)
if err != nil {
t.Fatal(err)
}
if row != 5 {
t.Errorf("expected row 5 (bottom), got %d", row)
}
if g.state.Board[5][3] != Black {
t.Error("expected Black piece at row 5 col 3")
}

// m2 drops in col 3 — should land on row 4
row, err = g.DropPiece("m2", 3)
if err != nil {
t.Fatal(err)
}
if row != 4 {
t.Errorf("expected row 4, got %d", row)
}
}

func TestWinHorizontal(t *testing.T) {
g := New("m1", "m2")
// m1 fills cols 0,1,2,3 at bottom — m2 plays col 6 between each
moves := [][2]int{{0, 0}, {6, 1}, {1, 0}, {6, 1}, {2, 0}, {6, 1}, {3, 0}}
for i, move := range moves {
model := "m1"
if i%2 == 1 {
model = "m2"
}
_, err := g.DropPiece(model, move[0])
if err != nil {
t.Fatalf("move %d failed: %v", i, err)
}
}
if !g.state.GameOver {
t.Error("expected game over after horizontal win")
}
if g.state.Winner != "m1" {
t.Errorf("expected m1 to win, got %q", g.state.Winner)
}
}

func TestWinVertical(t *testing.T) {
g := New("m1", "m2")
// m1 stacks col 0, m2 plays col 1
for i := 0; i < 4; i++ {
_, err := g.DropPiece("m1", 0)
if err != nil {
t.Fatal(err)
}
if !g.state.GameOver {
_, err = g.DropPiece("m2", 1)
if err != nil {
t.Fatal(err)
}
}
}
if !g.state.GameOver {
t.Error("expected game over after vertical win")
}
if g.state.Winner != "m1" {
t.Errorf("expected m1 to win, got %q", g.state.Winner)
}
}

func TestTurnEnforcement(t *testing.T) {
g := New("m1", "m2")
// m2 tries to go first
_, err := g.DropPiece("m2", 0)
if err == nil {
t.Error("expected error when wrong player moves")
}
}

func TestFullColumn(t *testing.T) {
g := New("m1", "m2")
// Fill column 0
for i := 0; i < 6; i++ {
model := "m1"
if i%2 == 1 {
model = "m2"
}
_, err := g.DropPiece(model, 0)
if err != nil && !g.state.GameOver {
t.Fatalf("unexpected error filling column: %v", err)
}
if g.state.GameOver {
break
}
}
}
