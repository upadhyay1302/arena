package elo

import (
"encoding/json"
"os"
"sync"
)

type MatchRecord struct {
ID        string   `json:"id"`
Game      string   `json:"game"`
Models    []string `json:"models"`
Winner    string   `json:"winner"`
Timestamp string   `json:"timestamp"`
}

type HistoryStore struct {
mu      sync.RWMutex
path    string
matches []MatchRecord
}

func NewHistoryStore(path string) (*HistoryStore, error) {
h := &HistoryStore{path: path}
if err := h.load(); err != nil && !os.IsNotExist(err) {
return nil, err
}
return h, nil
}

func (h *HistoryStore) Add(r MatchRecord) {
h.mu.Lock()
defer h.mu.Unlock()
h.matches = append([]MatchRecord{r}, h.matches...) // newest first
h.save()
}

func (h *HistoryStore) List(limit int) []MatchRecord {
h.mu.RLock()
defer h.mu.RUnlock()
if limit <= 0 || limit > len(h.matches) {
limit = len(h.matches)
}
return h.matches[:limit]
}

func (h *HistoryStore) load() error {
data, err := os.ReadFile(h.path)
if err != nil {
return err
}
return json.Unmarshal(data, &h.matches)
}

func (h *HistoryStore) save() {
data, _ := json.MarshalIndent(h.matches, "", "  ")
os.WriteFile(h.path, data, 0644)
}
