package games

import "testing"

func TestParseClue(t *testing.T) {
tests := []struct {
name       string
raw        string
wantWord   string
wantNumber int
}{
{
name:       "clean format",
raw:        "CLUE: OCEAN 3",
wantWord:   "OCEAN",
wantNumber: 3,
},
{
name:       "lowercase",
raw:        "clue: ocean 3",
wantWord:   "OCEAN",
wantNumber: 3,
},
{
name:       "with thinking tags",
raw:        "<think>Let me consider the board...</think>\nCLUE: OCEAN 3",
wantWord:   "OCEAN",
wantNumber: 3,
},
{
name:       "filler before clue, no prefix",
raw:        "Okay, let me think about this. OCEAN 3",
wantWord:   "", // we expect this to currently FAIL — no CLUE: prefix means ambiguous
wantNumber: 0,
},
{
name:       "filler word only, no real clue",
raw:        "Okay, I need to think about this carefully.",
wantWord:   "",
wantNumber: 0,
},
{
name:       "clue word with punctuation",
raw:        "CLUE: OCEAN, 3",
wantWord:   "OCEAN",
wantNumber: 0, // "3" with comma might fail Sscanf — test reveals this
},
}

for _, tt := range tests {
t.Run(tt.name, func(t *testing.T) {
word, number := parseClue(tt.raw)
if word != tt.wantWord {
t.Errorf("word: got %q want %q", word, tt.wantWord)
}
if number != tt.wantNumber {
t.Errorf("number: got %d want %d", number, tt.wantNumber)
}
})
}
}

func TestStripThinking(t *testing.T) {
tests := []struct {
name string
raw  string
want string
}{
{
name: "no thinking tags",
raw:  "CLUE: OCEAN 3",
want: "CLUE: OCEAN 3",
},
{
name: "with thinking tags",
raw:  "<think>hmm let me see</think>CLUE: OCEAN 3",
want: "CLUE: OCEAN 3",
},
{
name: "uppercase tags",
raw:  "<THINK>hmm</THINK>CLUE: OCEAN 3",
want: "CLUE: OCEAN 3",
},
{
name: "unterminated tag",
raw:  "<think>hmm this never closes",
want: "",
},
}

for _, tt := range tests {
t.Run(tt.name, func(t *testing.T) {
got := stripThinking(tt.raw)
if got != tt.want {
t.Errorf("got %q want %q", got, tt.want)
}
})
}
}
