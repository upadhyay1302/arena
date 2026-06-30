"use client"

import { useEffect, useState } from "react"
import { BACKEND_URL } from "@/lib/config"
import Link from "next/link"

interface ModelStats {
  model: string
  rating: number
  wins: number
  losses: number
  draws: number
  games: number
}

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
  return "text-neutral-400"
}

function RatingBar({ rating }: { rating: number }) {
  const pct = Math.min(100, ((rating - 800) / 400) * 100)
  return (
    <div className="w-20 h-0.5 bg-neutral-800 overflow-hidden">
      <div
        className="h-full bg-[#E8FF00] transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function LeaderboardPage() {
  const [board, setBoard] = useState<ModelStats[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchBoard = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/leaderboard`)
      const data = await res.json()
      setBoard(data ?? [])
      setLastUpdated(new Date())
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBoard()
    const interval = setInterval(fetchBoard, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');`}</style>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <Link href="/" className="text-sm font-bold tracking-[0.15em] uppercase text-white hover:text-neutral-300 transition-colors">
          Arena
        </Link>
        <div className="flex items-center gap-5 text-xs text-neutral-500">
          <Link href="/matches" className="hover:text-white transition-colors">Match History</Link>
          <span className="text-white">Leaderboard</span>
          <Link href="/arena" className="bg-[#E8FF00] text-black px-4 py-2 text-xs font-bold tracking-wide hover:bg-yellow-200 transition-colors">
            Play →
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="text-[10px] text-neutral-600 uppercase tracking-widest mb-3">Global Rankings</div>
            <h1 className="text-3xl font-black text-white tracking-tight">Leaderboard</h1>
          </div>
          <div className="text-[10px] text-neutral-700 text-right">
            {lastUpdated && <div>Updated {lastUpdated.toLocaleTimeString()}</div>}
            <div>Refreshes every 10s</div>
          </div>
        </div>

        {/* States */}
        {loading ? (
          <div className="flex items-center gap-3 text-neutral-600 text-sm">
            <div className="w-3 h-3 border border-neutral-700 border-t-neutral-400 rounded-full animate-spin" />
            Loading...
          </div>
        ) : board.length === 0 ? (
          <div className="border border-neutral-800 p-12 text-center">
            <div className="text-3xl mb-4">🏆</div>
            <div className="text-neutral-400 text-sm mb-2">No matches played yet</div>
            <div className="text-neutral-600 text-xs mb-6">Play a match to see ELO ratings appear here</div>
            <Link href="/arena" className="bg-[#E8FF00] text-black px-5 py-2 text-xs font-bold hover:bg-yellow-200 transition-colors">
              Start a Match →
            </Link>
          </div>
        ) : (
          <div>
            {/* Column headers */}
            <div className="grid grid-cols-12 gap-4 px-4 pb-3 text-[10px] text-neutral-700 uppercase tracking-widest border-b border-neutral-800 mb-1">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Model</div>
              <div className="col-span-2 text-right">ELO</div>
              <div className="col-span-3 text-right">W / L / D</div>
              <div className="col-span-1 text-right">G</div>
              <div className="col-span-1 text-right">Win%</div>
            </div>

            {board.map((m, i) => (
              <div
                key={m.model}
                className="grid grid-cols-12 gap-4 items-center px-4 py-4 border-b border-neutral-900 hover:bg-neutral-900 transition-colors"
              >
                {/* Rank */}
                <div className="col-span-1 text-[11px] font-bold text-neutral-600">
                  {i === 0 ? <span className="text-[#E8FF00]">#1</span> : `#${i + 1}`}
                </div>

                {/* Model */}
                <div className="col-span-4">
                  <div className={`text-sm font-semibold ${modelColor(m.model)}`}>
                    {modelLabel(m.model)}
                  </div>
                  <div className="text-[10px] text-neutral-700 font-mono mt-0.5 truncate">{m.model}</div>
                </div>

                {/* ELO */}
                <div className="col-span-2 text-right">
                  <div className="text-sm font-bold tabular-nums">{Math.round(m.rating)}</div>
                  <div className="flex justify-end mt-1.5">
                    <RatingBar rating={m.rating} />
                  </div>
                </div>

                {/* W/L/D */}
                <div className="col-span-3 text-right text-sm tabular-nums">
                  <span className="text-emerald-400">{m.wins}</span>
                  <span className="text-neutral-700 mx-1">/</span>
                  <span className="text-red-400">{m.losses}</span>
                  <span className="text-neutral-700 mx-1">/</span>
                  <span className="text-neutral-500">{m.draws}</span>
                </div>

                {/* Games */}
                <div className="col-span-1 text-right text-sm text-neutral-600 tabular-nums">
                  {m.games}
                </div>

                {/* Win rate */}
                <div className="col-span-1 text-right text-[11px] text-neutral-600 tabular-nums">
                  {m.games > 0 ? `${Math.round((m.wins / m.games) * 100)}%` : "—"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
