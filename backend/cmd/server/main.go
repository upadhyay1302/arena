package main

import (
"context"
"encoding/json"
"log"
"net/http"
	"os"
"sync"
"time"

"github.com/gorilla/websocket"
"github.com/upadhyay1302/arena/internal/elo"
"github.com/upadhyay1302/arena/internal/games"
"github.com/upadhyay1302/arena/internal/ws"
)

var upgrader = websocket.Upgrader{
CheckOrigin: func(r *http.Request) bool { return true },
}

type matchStore struct {
mu      sync.RWMutex
matches map[string]*games.Match
}

func (s *matchStore) add(m *games.Match) {
s.mu.Lock()
s.matches[m.ID] = m
s.mu.Unlock()
}

func (s *matchStore) get(id string) (*games.Match, bool) {
s.mu.RLock()
defer s.mu.RUnlock()
m, ok := s.matches[id]
return m, ok
}

var store = &matchStore{matches: make(map[string]*games.Match)}
var hub = ws.NewHub()
var eloStore *elo.Store

func main() {
var err error
eloStore, err = elo.NewStore("ratings.json")
if err != nil {
log.Fatalf("failed to init elo store: %v", err)
}

mux := http.NewServeMux()
mux.HandleFunc("POST /api/match", handleCreateMatch)
mux.HandleFunc("GET /api/match/{id}", handleGetMatch)
mux.HandleFunc("GET /ws/match/{id}", handleWS)
mux.HandleFunc("GET /api/leaderboard", handleLeaderboard)

port := os.Getenv("PORT")
if port == "" {
port = "8080"
}
log.Printf("Arena backend listening on :%s", port)
log.Fatal(http.ListenAndServe(":"+port, corsMiddleware(mux)))
}

func handleCreateMatch(w http.ResponseWriter, r *http.Request) {
var body struct {
Game       string   `json:"game"`
Models     []string `json:"models"`
SecretWord string   `json:"secret_word"`
}
if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
http.Error(w, "invalid body", http.StatusBadRequest)
return
}
if len(body.Models) < 2 {
http.Error(w, "need at least 2 models", http.StatusBadRequest)
return
}

m := &games.Match{
ID:     generateID(),
Game:   body.Game,
Models: body.Models,
Status: games.StatusPending,
}
m.SetHub(hub)
store.add(m)

go func() {
m.Run(context.Background(), body.SecretWord)
// Record ELO after match finishes
if len(body.Models) >= 2 {
log.Printf("recording result: %s vs %s, winner: %q", body.Models[0], body.Models[1], m.Winner)
eloStore.RecordResult(body.Models[0], body.Models[1], m.Winner)
}
}()

w.Header().Set("Content-Type", "application/json")
json.NewEncoder(w).Encode(map[string]string{"match_id": m.ID})
}

func handleGetMatch(w http.ResponseWriter, r *http.Request) {
id := r.PathValue("id")
m, ok := store.get(id)
if !ok {
http.Error(w, "match not found", http.StatusNotFound)
return
}
w.Header().Set("Content-Type", "application/json")
json.NewEncoder(w).Encode(m)
}

func handleWS(w http.ResponseWriter, r *http.Request) {
id := r.PathValue("id")
if _, ok := store.get(id); !ok {
http.Error(w, "match not found", http.StatusNotFound)
return
}

conn, err := upgrader.Upgrade(w, r, nil)
if err != nil {
return
}

client := hub.Register(id, conn)
defer hub.Unregister(client)

for {
if _, _, err := conn.ReadMessage(); err != nil {
return
}
}
}

func handleLeaderboard(w http.ResponseWriter, r *http.Request) {
board := eloStore.Leaderboard()
w.Header().Set("Content-Type", "application/json")
json.NewEncoder(w).Encode(board)
}

func corsMiddleware(next http.Handler) http.Handler {
return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
w.Header().Set("Access-Control-Allow-Origin", "*")
w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
if r.Method == http.MethodOptions {
w.WriteHeader(http.StatusNoContent)
return
}
next.ServeHTTP(w, r)
})
}

func generateID() string {
return time.Now().Format("20060102150405.000000")
}
