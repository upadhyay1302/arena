package codenames

import (
"fmt"
"math/rand"
"strings"
)

type CardType string

const (
Blue     CardType = "blue"
Red      CardType = "red"
Neutral  CardType = "neutral"
Assassin CardType = "assassin"
)

type Card struct {
Word     string   `json:"word"`
Type     CardType `json:"type"`
Revealed bool     `json:"revealed"`
}

type Clue struct {
Word   string `json:"word"`
Number int    `json:"number"`
}

type PlayerState struct {
Clues   []Clue   `json:"clues"`
Guesses []string `json:"guesses"`
Won     bool     `json:"won"`
Done    bool     `json:"done"`
}

type State struct {
Cards       []Card                 `json:"cards"`
Players     map[string]PlayerState `json:"players"`
CurrentTurn string                 `json:"current_turn"`
Phase       string                 `json:"phase"` // "clue" or "guess"
Winner      string                 `json:"winner"`
GameOver    bool                   `json:"game_over"`
BlueLeft    int                    `json:"blue_left"`
RedLeft     int                    `json:"red_left"`
CurrentClue *Clue                  `json:"current_clue,omitempty"`
GuessesLeft int                    `json:"guesses_left"`
}

type Game struct {
models    [2]string
teamColor map[string]CardType // model -> their color
state     State
}

var WORD_LIST = []string{
"AFRICA", "AGENT", "AIR", "ALIEN", "ALPS", "AMAZON", "ANGEL", "ANTARCTICA",
"APPLE", "ARM", "ATLANTIS", "BACK", "BALL", "BAND", "BANK", "BARK", "BAT",
"BEAR", "BEAT", "BED", "BILL", "BLOCK", "BOARD", "BOLT", "BOMB", "BOND",
"BOOK", "BOOM", "BOOT", "BOW", "BOX", "BRIDGE", "BRUSH", "BUG", "BURN",
"BUTTER", "BUTTON", "CALF", "CANADA", "CAP", "CAPITAL", "CAR", "CARD",
"CARROT", "CAST", "CAT", "CELL", "CHAIR", "CHANGE", "CHECK", "CHEST",
"CHINA", "CHOCOLATE", "CHURCH", "CIRCLE", "CLIFF", "CLOUD", "CLUB", "CODE",
"COLD", "COLUMN", "COMIC", "COMPOUND", "CONTACT", "COOK", "COPPER", "COTTON",
"COURT", "COVER", "CRACK", "CRANE", "CRASH", "CRICKET", "CROSS", "CROWN",
"CYCLE", "CZECH", "DANCE", "DATE", "DAY", "DEATH", "DECK", "DEGREE",
"DIAMOND", "DICE", "DIG", "DINOSAUR", "DOCTOR", "DOG", "DRAFT", "DRAGON",
"DRESS", "DRILL", "DROP", "DRUM", "DUCK", "DWARF", "EAR", "EGYPT",
"EMBASSY", "ENGINE", "ENGLAND", "EYE", "FACE", "FAIR", "FALL", "FAN",
"FENCE", "FIGHTER", "FILM", "FIRE", "FISH", "FLAG", "FLAT", "FLY",
"FOOT", "FORCE", "FOREST", "FORK", "FRANCE", "GAME", "GAS", "GHOST",
}

func New(model1, model2 string) *Game {
// Shuffle and pick 25 words
words := make([]string, len(WORD_LIST))
copy(words, WORD_LIST)
rand.Shuffle(len(words), func(i, j int) { words[i], words[j] = words[j], words[i] })
words = words[:25]

// Assign card types: 9 blue, 8 red, 7 neutral, 1 assassin
types := make([]CardType, 25)
for i := 0; i < 9; i++ {
types[i] = Blue
}
for i := 9; i < 17; i++ {
types[i] = Red
}
for i := 17; i < 24; i++ {
types[i] = Neutral
}
types[24] = Assassin
rand.Shuffle(len(types), func(i, j int) { types[i], types[j] = types[j], types[i] })

cards := make([]Card, 25)
for i, w := range words {
cards[i] = Card{Word: w, Type: types[i]}
}

g := &Game{
models: [2]string{model1, model2},
teamColor: map[string]CardType{
model1: Blue,
model2: Red,
},
state: State{
Cards: cards,
Players: map[string]PlayerState{
model1: {},
model2: {},
},
CurrentTurn: model1,
Phase:       "clue",
BlueLeft:    9,
RedLeft:     8,
},
}
return g
}

func (g *Game) GetState(spymasterModel string) State {
s := g.state
// Hide card types unless this is the spymaster's view
if spymasterModel == "" {
cards := make([]Card, len(s.Cards))
copy(cards, s.Cards)
for i := range cards {
if !cards[i].Revealed {
cards[i].Type = ""
}
}
s.Cards = cards
}
return s
}

func (g *Game) IsOver() bool {
return g.state.GameOver
}

func (g *Game) CurrentTurn() string {
return g.state.CurrentTurn
}

func (g *Game) Phase() string {
return g.state.Phase
}

// GiveClue — spymaster gives a clue
func (g *Game) GiveClue(model, word string, number int) error {
if g.state.Phase != "clue" {
return fmt.Errorf("not clue phase")
}
if model != g.state.CurrentTurn {
return fmt.Errorf("not your turn")
}
clue := Clue{Word: strings.ToUpper(word), Number: number}
g.state.CurrentClue = &clue
g.state.GuessesLeft = number + 1 // allow one extra guess
g.state.Phase = "guess"

p := g.state.Players[model]
p.Clues = append(p.Clues, clue)
g.state.Players[model] = p
return nil
}

// GuessWord — guesser picks a word
func (g *Game) GuessWord(model, word string) (CardType, error) {
if g.state.Phase != "guess" {
return "", fmt.Errorf("not guess phase")
}
if model != g.state.CurrentTurn {
return "", fmt.Errorf("not your turn")
}

word = strings.ToUpper(word)
myColor := g.teamColor[model]

// Find the card
cardIdx := -1
for i, c := range g.state.Cards {
if c.Word == word && !c.Revealed {
cardIdx = i
break
}
}
if cardIdx == -1 {
return "", fmt.Errorf("word %q not found or already revealed", word)
}

// Reveal it
g.state.Cards[cardIdx].Revealed = true
cardType := g.state.Cards[cardIdx].Type

p := g.state.Players[model]
p.Guesses = append(p.Guesses, word)
g.state.Players[model] = p

// Update counts
switch cardType {
case Blue:
g.state.BlueLeft--
case Red:
g.state.RedLeft--
}

// Check assassin
if cardType == Assassin {
g.state.GameOver = true
g.state.Winner = g.otherModel(model)
g.markAllDone()
return cardType, nil
}

// Check win conditions
if g.state.BlueLeft == 0 {
g.state.GameOver = true
g.state.Winner = g.models[0] // blue team
g.markAllDone()
return cardType, nil
}
if g.state.RedLeft == 0 {
g.state.GameOver = true
g.state.Winner = g.models[1] // red team
g.markAllDone()
return cardType, nil
}

// Wrong color or neutral — end turn
g.state.GuessesLeft--
if cardType != myColor || g.state.GuessesLeft == 0 {
g.state.Phase = "clue"
g.state.CurrentClue = nil
g.state.CurrentTurn = g.otherModel(model)
}

return cardType, nil
}

func (g *Game) otherModel(model string) string {
if model == g.models[0] {
return g.models[1]
}
return g.models[0]
}

func (g *Game) markAllDone() {
for _, m := range g.models {
p := g.state.Players[m]
p.Done = true
g.state.Players[m] = p
}
if g.state.Winner != "" {
p := g.state.Players[g.state.Winner]
p.Won = true
g.state.Players[g.state.Winner] = p
}
}

// BuildCluePrompt — for spymaster
func (g *Game) BuildCluePrompt(model string) string {
myColor := g.teamColor[model]
otherColor := Red
if myColor == Red {
otherColor = Blue
}

var myWords, otherWords, neutral, assassin []string
for _, c := range g.state.Cards {
if c.Revealed {
continue
}
switch c.Type {
case myColor:
myWords = append(myWords, c.Word)
case otherColor:
otherWords = append(otherWords, c.Word)
case Neutral:
neutral = append(neutral, c.Word)
case Assassin:
assassin = append(assassin, c.Word)
}
}

return fmt.Sprintf(`You are the Spymaster in Codenames. You are on the %s team.

YOUR WORDS (you want your guesser to pick these): %s
OPPONENT WORDS (avoid these): %s  
NEUTRAL WORDS (avoid these): %s
ASSASSIN (never hint at this - instant loss): %s

Give a ONE-WORD clue and a NUMBER indicating how many of your words it connects to.
The clue cannot be any word on the board or a variation of it.

Respond in EXACTLY this format:
CLUE: <word> <number>

Example: CLUE: OCEAN 3`,
myColor,
strings.Join(myWords, ", "),
strings.Join(otherWords, ", "),
strings.Join(neutral, ", "),
strings.Join(assassin, ", "),
)
}

// BuildGuessPrompt — for guesser
func (g *Game) BuildGuessPrompt(model string) string {
var unrevealed []string
for _, c := range g.state.Cards {
if !c.Revealed {
unrevealed = append(unrevealed, c.Word)
}
}

clue := ""
if g.state.CurrentClue != nil {
clue = fmt.Sprintf("%s %d", g.state.CurrentClue.Word, g.state.CurrentClue.Number)
}

return fmt.Sprintf(`You are the Guesser in Codenames.

The clue is: %s
Guesses remaining: %d

Unrevealed words on the board: %s

Based on the clue, pick ONE word from the board that you think matches.
Respond with ONLY the word. Nothing else.`,
clue,
g.state.GuessesLeft,
strings.Join(unrevealed, ", "),
)
}
