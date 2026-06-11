"use client"

import { use, useState } from "react"
import { useMatchSocket } from "@/hooks/useMatchSocket"
import { WordleBoard } from "@/components/wordle/WordleBoard"
import { Connect4Board, C4Cell } from "@/components/connect4/Connect4Board"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

function modelLabel(model: string) {
  if (model.includes("llama")) return "Llama"
  if (model.includes("qwen")) return "Qwen"
  if (model.includes("gpt")) return "GPT"
  if (model.includes("claude")) return "Claude"
  if (model.includes("gemini")) return "Gemini"
  if (model.includes("mixtral")) return "Mixtral"
  return model
}

function modelColor(model: string) {
  if (model.includes("llama")) return "text-violet-400"
  if (model.includes("qwen")) return "text-sky-400"
  if (model.includes("gpt")) return "text-emerald-400"
  if (model.includes("claude")) return "text-orange-400"
  if (model.includes("gemini")) return "text-blue-400"
  return "text-slate-400"
}

const EMPTY_BOARD: C4Cell[][] = Array.from({ length: 6 }, () => Array(7).fill(0) as C4Cell[])

export default function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null
  const [models, setModels] = useState<string[]>([])
  const [game, setGame] = useState<string>(searchParams?.get("game") ?? "wordle")
  const [board, setBoard] = useState<C4Cell[][]>(EMPTY_BOARD)
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | undefined>()
  const [currentTurn, setCurrentTurn] = useState<string>("")

  const { connected, state } = useMatchSocket({
    matchId: id,
    onEvent: (event) => {
      if (event.type === "match_started") {
        setModels(event.payload.models)
        setGame(event.payload.game)
      }
      if (event.type === "state" && "board" in event.payload) {
        const s = event.payload as any
        setBoard(s.board ?? EMPTY_BOARD)
        setCurrentTurn(s.current_turn ?? "")
      }
      if (event.type === "move") {
        setLastMove({ row: event.payload.row, col: event.payload.col })
      }
    },
  })

  const playerList = models.length > 0 ? models : Object.keys(state.players)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight">Arena</span>
          <span className="text-slate-500 text-sm capitalize">{game}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", connected ? "bg-emerald-500" : "bg-slate-600")} />
          <span className="text-xs text-slate-400">{connected ? "live" : "disconnected"}</span>
        </div>
      </div>

      {/* Winner banner */}
      {state.game_over && (
        <div className="bg-emerald-950 border-b border-emerald-800 px-6 py-3 text-center">
          {state.winner ? (
            <span className="text-emerald-400 font-semibold">
              🏆 {modelLabel(state.winner)} wins
              {state.secret_word && (
                <span className="text-slate-400 font-normal ml-2">
                  — the word was <span className="font-bold text-white">{state.secret_word}</span>
                </span>
              )}
            </span>
          ) : (
            <span className="text-slate-400">Draw — neither model won</span>
          )}
        </div>
      )}

      {/* Connect 4 — single shared board */}
      {game === "connect4" && (
        <div className="flex flex-col items-center gap-8 px-8 py-12">
          <div className="flex items-center gap-8">
            {playerList.map((model, i) => (
              <div key={model} className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full border transition-all",
                currentTurn === model
                  ? "border-white bg-slate-800"
                  : "border-slate-700 opacity-50"
              )}>
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  i === 0 ? "bg-slate-200" : "bg-red-500"
                )} />
                <span className={cn("text-sm font-semibold", modelColor(model))}>
                  {modelLabel(model)}
                </span>
                {currentTurn === model && !state.game_over && (
                  <span className="text-xs text-slate-400">thinking...</span>
                )}
              </div>
            ))}
          </div>

          <Connect4Board board={board} lastMove={lastMove} />

          <div className="flex gap-6 text-xs text-slate-500">
            {playerList.map((model, i) => {
              const p = state.players[model]
              return (
                <div key={model} className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", i === 0 ? "bg-slate-200" : "bg-red-500")} />
                  <span>{modelLabel(model)}</span>
                  <span>({p?.moves?.length ?? 0} moves)</span>
                  {state.winner === model && <Badge className="bg-amber-500 text-white border-0 text-xs">Winner 🏆</Badge>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Wordle — two boards side by side */}
      {game === "wordle" && (
        <div className="flex items-start justify-center gap-16 px-8 py-12">
          {playerList.map((model) => {
            const player = state.players[model] ?? { guesses: [], won: false, done: false }
            const isWinner = state.winner === model
            return (
              <div key={model} className="flex flex-col items-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <span className={cn("text-lg font-bold tracking-tight", modelColor(model))}>
                    {modelLabel(model)}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">{model}</span>
                  <div className="flex gap-2">
                    {player.won && <Badge className="bg-emerald-600 text-white border-0">Solved ✓</Badge>}
                    {player.done && !player.won && <Badge variant="secondary">Failed</Badge>}
                    {isWinner && <Badge className="bg-amber-500 text-white border-0">Winner 🏆</Badge>}
                  </div>
                </div>
                <WordleBoard guesses={player.guesses} />
                <span className="text-xs text-slate-500">{player.guesses.length} / 6 guesses</span>
              </div>
            )
          })}
          {playerList.length === 0 && (
            <div className="flex flex-col items-center gap-4 text-slate-500 mt-20">
              <div className="w-8 h-8 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin" />
              <span className="text-sm">Waiting for match to start...</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
