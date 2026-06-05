"use client"

import { use, useState } from "react"
import { useMatchSocket } from "@/hooks/useMatchSocket"
import { WordleBoard } from "@/components/wordle/WordleBoard"
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

export default function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [models, setModels] = useState<string[]>([])
  const { connected, state } = useMatchSocket({
    matchId: id,
    onEvent: (event) => {
      if (event.type === "match_started") {
        setModels(event.payload.models)
      }
    },
  })

  const playerList = models.length > 0
    ? models
    : Object.keys(state.players)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight">Arena</span>
          <span className="text-slate-500 text-sm">Wordle</span>
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
                <span className="text-slate-400 font-normal ml-2">— the word was <span className="font-bold text-white">{state.secret_word}</span></span>
              )}
            </span>
          ) : (
            <span className="text-slate-400">No winner — neither model solved it</span>
          )}
        </div>
      )}

      {/* Boards */}
      <div className="flex items-start justify-center gap-16 px-8 py-12">
        {playerList.map((model) => {
          const player = state.players[model] ?? { guesses: [], won: false, done: false }
          const isWinner = state.winner === model

          return (
            <div key={model} className="flex flex-col items-center gap-6">
              {/* Model header */}
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

              {/* Board */}
              <WordleBoard guesses={player.guesses} />

              {/* Guess count */}
              <span className="text-xs text-slate-500">
                {player.guesses.length} / 6 guesses
              </span>
            </div>
          )
        })}

        {/* Waiting state */}
        {playerList.length === 0 && (
          <div className="flex flex-col items-center gap-4 text-slate-500 mt-20">
            <div className="w-8 h-8 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin" />
            <span className="text-sm">Waiting for match to start...</span>
          </div>
        )}
      </div>
    </div>
  )
}
