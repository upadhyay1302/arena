package connect4

import "fmt"

const (
Rows = 6
Cols = 7
)

type Cell int

const (
Empty  Cell = 0
Black  Cell = 1 // player 1
Red    Cell = 2 // player 2
)

type Board [Rows][Cols]Cell

type Guess struct {
Col    int    `json:"col"`
Row    int    `json:"row"`
}

type PlayerState struct {
Moves []Guess `json:"moves"`
Done  bool    `json:"done"`
Won   bool    `json:"won"`
}

type State struct {
Board       Board                  `json:"board"`
Players     map[string]PlayerState `json:"players"`
CurrentTurn string                 `json:"current_turn"`
Winner      string                 `json:"winner"`
GameOver    bool                   `json:"game_over"`
}

type Game struct {
models [2]string
state  State
}

func New(model1, model2 string) *Game {
g := &Game{
models: [2]string{model1, model2},
state: State{
Players: map[string]PlayerState{
model1: {},
model2: {},
},
CurrentTurn: model1,
},
}
return g
}

func (g *Game) GetState() State {
return g.state
}

func (g *Game) CurrentTurn() string {
return g.state.CurrentTurn
}

func (g *Game) IsOver() bool {
return g.state.GameOver
}

// DropPiece drops a piece in the given column for the current player.
// Returns the row it landed on, or error if invalid.
func (g *Game) DropPiece(model string, col int) (row int, err error) {
if g.state.GameOver {
return -1, fmt.Errorf("game is over")
}
if model != g.state.CurrentTurn {
return -1, fmt.Errorf("not your turn")
}
if col < 0 || col >= Cols {
return -1, fmt.Errorf("column %d out of bounds", col)
}

// Find lowest empty row in column
row = -1
for r := Rows - 1; r >= 0; r-- {
if g.state.Board[r][col] == Empty {
row = r
break
}
}
if row == -1 {
return -1, fmt.Errorf("column %d is full", col)
}

// Place piece
var cell Cell
if model == g.models[0] {
cell = Black
} else {
cell = Red
}
g.state.Board[row][col] = cell

// Record move
p := g.state.Players[model]
p.Moves = append(p.Moves, Guess{Col: col, Row: row})
g.state.Players[model] = p

// Check winner
if g.checkWinner(row, col, cell) {
g.state.Winner = model
g.state.GameOver = true
p = g.state.Players[model]
p.Won = true
p.Done = true
g.state.Players[model] = p
// Mark other player done
other := g.otherModel(model)
op := g.state.Players[other]
op.Done = true
g.state.Players[other] = op
return row, nil
}

// Check draw
if g.isBoardFull() {
g.state.GameOver = true
for _, m := range g.models {
p := g.state.Players[m]
p.Done = true
g.state.Players[m] = p
}
return row, nil
}

// Switch turn
g.state.CurrentTurn = g.otherModel(model)
return row, nil
}

func (g *Game) otherModel(model string) string {
if model == g.models[0] {
return g.models[1]
}
return g.models[0]
}

func (g *Game) isBoardFull() bool {
for c := 0; c < Cols; c++ {
if g.state.Board[0][c] == Empty {
return false
}
}
return true
}

func (g *Game) checkWinner(row, col int, cell Cell) bool {
directions := [][2]int{
{0, 1},  // horizontal
{1, 0},  // vertical
{1, 1},  // diagonal down-right
{1, -1}, // diagonal down-left
}
for _, d := range directions {
count := 1
// Check in positive direction
for i := 1; i < 4; i++ {
r, c := row+d[0]*i, col+d[1]*i
if r < 0 || r >= Rows || c < 0 || c >= Cols || g.state.Board[r][c] != cell {
break
}
count++
}
// Check in negative direction
for i := 1; i < 4; i++ {
r, c := row-d[0]*i, col-d[1]*i
if r < 0 || r >= Rows || c < 0 || c >= Cols || g.state.Board[r][c] != cell {
break
}
count++
}
if count >= 4 {
return true
}
}
return false
}

// BuildPrompt generates the LLM prompt for the current game state.
func (g *Game) BuildPrompt(model string) string {
var cell Cell
if model == g.models[0] {
cell = Black
} else {
cell = Red
}

symbol := "X"
oppSymbol := "O"
if cell == Red {
symbol = "O"
oppSymbol = "X"
}

// Build board string
board := "  0 1 2 3 4 5 6\n"
for r := 0; r < Rows; r++ {
board += fmt.Sprintf("%d ", r)
for c := 0; c < Cols; c++ {
switch g.state.Board[r][c] {
case Empty:
board += ". "
case Black:
board += "X "
case Red:
board += "O "
}
}
board += "\n"
}

// Find valid columns
valid := []int{}
for c := 0; c < Cols; c++ {
if g.state.Board[0][c] == Empty {
valid = append(valid, c)
}
}

return fmt.Sprintf(`You are playing Connect 4. You are %s (%s), opponent is %s (%s).

Board (columns 0-6, pieces fall to the bottom):
%s
Valid columns: %v

Rules: Drop a piece in a column. First to connect 4 in a row (horizontal, vertical, or diagonal) wins.

Respond with ONLY a single digit (0-6) for the column you want to play. Nothing else.`,
model, symbol, g.otherModel(model), oppSymbol, board, valid)
}
