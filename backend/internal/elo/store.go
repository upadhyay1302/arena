package elo

import (
"encoding/json"
"os"
"sync"
)

type ModelStats struct {
Model  string  `json:"model"`
Rating float64 `json:"rating"`
Wins   int     `json:"wins"`
Losses int     `json:"losses"`
Draws  int     `json:"draws"`
Games  int     `json:"games"`
}

type Store struct {
mu      sync.RWMutex
path    string
ratings map[string]*ModelStats
}

func NewStore(path string) (*Store, error) {
s := &Store{
path:    path,
ratings: make(map[string]*ModelStats),
}
if err := s.load(); err != nil && !os.IsNotExist(err) {
return nil, err
}
return s, nil
}

func (s *Store) get(model string) *ModelStats {
if _, ok := s.ratings[model]; !ok {
s.ratings[model] = &ModelStats{
Model:  model,
Rating: DefaultRating,
}
}
return s.ratings[model]
}

// RecordResult updates ELO ratings after a match.
// winner is the winning model ID, "" for draw.
func (s *Store) RecordResult(modelA, modelB, winner string) {
s.mu.Lock()
defer s.mu.Unlock()

a := s.get(modelA)
b := s.get(modelB)

var side string
switch winner {
case modelA:
side = "a"
case modelB:
side = "b"
default:
side = "draw"
}

newA, newB := NewRatings(a.Rating, b.Rating, side)
a.Rating = newA
b.Rating = newB
a.Games++
b.Games++

switch side {
case "a":
a.Wins++
b.Losses++
case "b":
b.Wins++
a.Losses++
default:
a.Draws++
b.Draws++
}

s.save()
}

// Leaderboard returns all models sorted by rating.
func (s *Store) Leaderboard() []ModelStats {
s.mu.RLock()
defer s.mu.RUnlock()

out := make([]ModelStats, 0, len(s.ratings))
for _, v := range s.ratings {
out = append(out, *v)
}

// Sort by rating descending
for i := 0; i < len(out); i++ {
for j := i + 1; j < len(out); j++ {
if out[j].Rating > out[i].Rating {
out[i], out[j] = out[j], out[i]
}
}
}
return out
}

func (s *Store) load() error {
data, err := os.ReadFile(s.path)
if err != nil {
return err
}
return json.Unmarshal(data, &s.ratings)
}

func (s *Store) save() {
data, _ := json.MarshalIndent(s.ratings, "", "  ")
os.WriteFile(s.path, data, 0644)
}
