package ws

import (
	"encoding/json"
	"sync"

	"github.com/gorilla/websocket"
)

// Message is what gets broadcast to all clients watching a match.
type Message struct {
	Type    string `json:"type"`
	Payload any    `json:"payload"`
}

// Client is a single WebSocket connection.
type Client struct {
	conn    *websocket.Conn
	send    chan []byte
	matchID string
}

// Hub manages all active WebSocket clients grouped by match ID.
type Hub struct {
	mu      sync.RWMutex
	matches map[string]map[*Client]struct{}
}

func NewHub() *Hub {
	return &Hub{
		matches: make(map[string]map[*Client]struct{}),
	}
}

// Register adds a client to a match room.
func (h *Hub) Register(matchID string, conn *websocket.Conn) *Client {
	c := &Client{
		conn:    conn,
		send:    make(chan []byte, 64),
		matchID: matchID,
	}
	h.mu.Lock()
	if h.matches[matchID] == nil {
		h.matches[matchID] = make(map[*Client]struct{})
	}
	h.matches[matchID][c] = struct{}{}
	h.mu.Unlock()

	go c.writePump()
	return c
}

// Unregister removes a client.
func (h *Hub) Unregister(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if room, ok := h.matches[c.matchID]; ok {
		delete(room, c)
		close(c.send)
		if len(room) == 0 {
			delete(h.matches, c.matchID)
		}
	}
}

// Broadcast sends a message to every client watching a match.
func (h *Hub) Broadcast(matchID string, msg Message) {
	data, err := json.Marshal(msg)
	if err != nil {
		return
	}
	h.mu.RLock()
	defer h.mu.RUnlock()
	for c := range h.matches[matchID] {
		select {
		case c.send <- data:
		default:
			// slow client — drop the frame
		}
	}
}

// writePump drains the send channel to the WebSocket connection.
func (c *Client) writePump() {
	defer c.conn.Close()
	for data := range c.send {
		if err := c.conn.WriteMessage(websocket.TextMessage, data); err != nil {
			return
		}
	}
}
