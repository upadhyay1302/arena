"use client"

import { useEffect, useRef, useState } from "react"
import { GuessRow } from "@/components/wordle/WordleBoard"

export interface PlayerState {
  guesses: GuessRow[]
  moves?: { col: number; row: number }[]
  won: boolean
  done: boolean
}

export interface MatchState {
  players: Record<string, PlayerState>
  winner: string
  game_over: boolean
  secret_word?: string
}

export type MatchEvent =
  | { type: "match_started"; payload: { match_id: string; game: string; models: string[] } }
  | { type: "state"; payload: MatchState }
  | { type: "guess"; payload: { model: string; word: string; tiles: { letter: string; color: "green" | "yellow" | "gray" }[] } }
  | { type: "move"; payload: { model: string; col: number; row: number } }
  | { type: "match_finished"; payload: { match_id: string; winner: string } }
  | { type: "error"; payload: { message: string; model?: string } }

interface UseMatchSocketOptions {
  matchId: string
  onEvent?: (event: MatchEvent) => void
}

export function useMatchSocket({ matchId, onEvent }: UseMatchSocketOptions) {
  const [connected, setConnected] = useState(false)
  const [state, setState] = useState<MatchState>({
    players: {},
    winner: "",
    game_over: false,
  })
  const ws = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!matchId) return

    const socket = new WebSocket(`ws://localhost:8080/ws/match/${matchId}`)
    ws.current = socket

    socket.onopen = () => setConnected(true)
    socket.onclose = () => setConnected(false)

    socket.onmessage = (e) => {
      const event: MatchEvent = JSON.parse(e.data)
      onEvent?.(event)

      if (event.type === "state") {
        setState(prev => ({
          ...prev,
          ...event.payload,
          players: Object.fromEntries(
            Object.entries(event.payload.players).map(([model, p]) => [
              model,
              {
                ...p,
                guesses: p.guesses ?? [],
              },
            ])
          ),
        }))
      }

      if (event.type === "guess") {
        const { model, word, tiles } = event.payload
        setState(prev => {
          const player = prev.players[model] ?? { guesses: [], won: false, done: false }
          const newGuess: GuessRow = { word, tiles }
          return {
            ...prev,
            players: {
              ...prev.players,
              [model]: {
                ...player,
                guesses: [...player.guesses, newGuess],
              },
            },
          }
        })
      }

      if (event.type === "match_finished") {
        setState(prev => ({
          ...prev,
          winner: event.payload.winner,
          game_over: true,
        }))
      }
    }

    return () => socket.close()
  }, [matchId])

  return { connected, state }
}
