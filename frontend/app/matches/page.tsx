"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BACKEND_URL } from "@/lib/config"

interface MatchRecord {
  id: string
  game: string
  models: string[]
  winner: string
  timestamp: string
}

function modelLabel(model: string) {
  if (model.includes("llama")) return "Llama"
  if (model.includes("qwen")) return "Qwen"
  if (model.includes("gpt")) return "GPT"
  if (model.includes("claude")) return "Claude"
  if (model.includes("gemini")) return "Gemini"
  return model
}

function modelColor(model: string) {
  if (model.includes("llama")) return "text-violet-400"
  if (model.includes("qwen")) return "text-sky-400"
  if (model.includes("gpt")) return "text-emerald-400"
  if (model.includes("claude")) return "text-orange-400"
  if (model.includes("gemini")) return "text-blue-400"
  return "text-neutral-400"
}

function gameIcon(game: string) {
  if (game === "wordle") return "⬛"
  if (game === "connect4") return "🔴"
  if (game === "codenames") return "🔍"
  return "🎮"
}

function formatTime(id: string) {
  try {
    const s = id.replace(".", "")
    const year = s.slice(0, 4)
    const month = s.slice(4, 6)
    const day = s.slice(6, 8)
    const hour = s.slice(8, 10)
    const min = s.slice(10, 12)
    return `${year}-${month}-${day} ${hour}:${min}`
  } catch {
    return id
  }
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/matches`)
      .then(r => r.json())
      .then(d => setMatches(d ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');`}</style>

      <nav className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <Link href="/" className="text-sm font-bold tracking-[0.15em] uppercase text-white hover:text-neutral-300 transition-colors">
          Arena
        </Link>
        <div className="flex items-center gap-5 text-xs text-neutral-500">
          <Link href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link>
          <span className="text-white">Matches</span>
          <Link href="/arena" className="bg-[#E8FF00] text-black px-4 py-2 text-xs font-bold tracking-wide hover:bg-yellow-200 transition-colors">
            Play →
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <div className="text-[10px] text-neutral-600 uppercase tracking-widest mb-3">History</div>
          <h1 className="text-3xl font-black text-white tracking-tight">Match History</h1>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-neutral-600 text-sm">
            <div className="w-3 h-3 border border-neutral-700 border-t-neutral-400 rounded-full animate-spin" />
            Loading...
          </div>
        ) : matches.length === 0 ? (
          <div className="border border-neutral-800 p-12 text-center">
            <div className="text-3xl mb-4">🎮</div>
            <div className="text-neutral-400 text-sm mb-2">No matches played yet</div>
            <div className="text-neutral-600 text-xs mb-6">Start a match to see history here</div>
            <Link href="/arena" className="bg-[#E8FF00] text-black px-5 py-2 text-xs font-bold hover:bg-yellow-200 transition-colors">
              Start a Match →
            </Link>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-12 gap-4 px-4 pb-3 text-[10px] text-neutral-700 uppercase tracking-widest border-b border-neutral-800 mb-1">
              <div className="col-span-1">Game</div>
              <div className="col-span-4">Models</div>
              <div className="col-span-3">Winner</div>
              <div className="col-span-3">Time</div>
              <div className="col-span-1"></div>
            </div>

            {matches.map((m) => (
              <div
                key={m.id}
                className="grid grid-cols-12 gap-4 items-center px-4 py-4 border-b border-neutral-900 hover:bg-neutral-900 transition-colors"
              >
                <div className="col-span-1 flex flex-col items-start gap-0.5">
                  <span className="text-lg">{gameIcon(m.game)}</span>
                  <span className="text-[10px] text-neutral-600 capitalize">{m.game === "connect4" ? "Connect 4" : m.game.charAt(0).toUpperCase() + m.game.slice(1)}</span>
                </div>

                <div className="col-span-4 flex flex-col gap-0.5">
                  {m.models.map((model, i) => (
                    <span key={i} className={`text-xs font-medium ${modelColor(model)}`}>
                      {modelLabel(model)}
                    </span>
                  ))}
                </div>

                <div className="col-span-3">
                  {!m.winner ? (
                    <span className="text-[11px] text-neutral-600">Draw</span>
                  ) : (
                    <span className={`text-xs font-semibold ${modelColor(m.winner)}`}>
                      {modelLabel(m.winner)}
                    </span>
                  )}
                </div>

                <div className="col-span-3 text-[10px] text-neutral-700 font-mono">
                  {formatTime(m.id)}
                </div>

                <div className="col-span-1 text-right">
                  <Link
                    href={`/match/${m.id}?game=${m.game}`}
                    className="text-[10px] text-neutral-600 hover:text-[#E8FF00] transition-colors"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
