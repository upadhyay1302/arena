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
  return "text-slate-400"
}

function RatingBar({ rating }: { rating: number }) {
  const pct = Math.min(100, ((rating - 800) / 400) * 100)
  return (
    <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div
        className="h-full bg-emerald-500 rounded-full transition-all duration-700"
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
      // backend not running
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
    <div className="min-h-screen bg-slate-950 text-white" style={{ fontFamily: "'DM Mono', monospace" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');`}</style>

      {/* Fixed grid background */}
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-slate-800">
        <Link href="/" className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
          ARENA
        </Link>
        <div className="flex items-center gap-6 text-sm text-slate-400">
          <Link href="/leaderboard" className="text-white">Leaderboard</Link>
          <Link href="/arena" className="bg-white text-slate-950 px-4 py-1.5 rounded text-sm font-semibold hover:bg-slate-200 transition-colors">
            Play →
          </Link>
        </div>
      </nav>

      <div className="relative z-10 max-w-3xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-3">Global Rankings</div>
            <h1 className="text-4xl font-extrabold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
              Leaderboard
            </h1>
          </div>
          <div className="text-xs text-slate-600 text-right">
            {lastUpdated && (
              <>Updated {lastUpdated.toLocaleTimeString()}<br /></>
            )}
            <span className="text-slate-700">refreshes every 10s</span>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center gap-3 text-slate-500">
            <div className="w-4 h-4 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin" />
            Loading ratings...
          </div>
        ) : board.length === 0 ? (
          <div className="border border-slate-800 rounded-xl p-12 text-center">
            <div className="text-4xl mb-4">🏆</div>
            <div className="text-slate-400 text-sm mb-2">No matches played yet</div>
            <div className="text-slate-600 text-xs mb-6">Play a match to see ELO ratings appear here</div>
            <Link href="/arena" className="bg-white text-slate-950 px-5 py-2 rounded text-sm font-semibold hover:bg-slate-200 transition-colors">
              Start a Match →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Column headers */}
            <div className="grid grid-cols-12 gap-4 px-4 pb-2 text-xs text-slate-600 uppercase tracking-widest">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Model</div>
              <div className="col-span-2 text-right">ELO</div>
              <div className="col-span-2 text-right">W / L / D</div>
              <div className="col-span-2 text-right">Games</div>
              <div className="col-span-1" />
            </div>

            {board.map((m, i) => (
              <div
                key={m.model}
                className="grid grid-cols-12 gap-4 items-center border border-slate-800 rounded-xl px-4 py-4 hover:border-slate-700 hover:bg-slate-900/50 transition-all"
              >
                {/* Rank */}
                <div className="col-span-1 text-slate-500 text-sm font-bold">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </div>

                {/* Model */}
                <div className="col-span-4">
                  <div className={`font-semibold text-sm ${modelColor(m.model)}`}>
                    {modelLabel(m.model)}
                  </div>
                  <div className="text-xs text-slate-600 font-mono mt-0.5 truncate">{m.model}</div>
                </div>

                {/* ELO */}
                <div className="col-span-2 text-right">
                  <div className="text-sm font-bold">{Math.round(m.rating)}</div>
                  <div className="flex justify-end mt-1.5">
                    <RatingBar rating={m.rating} />
                  </div>
                </div>

                {/* W/L/D */}
                <div className="col-span-2 text-right text-sm">
                  <span className="text-emerald-400">{m.wins}</span>
                  <span className="text-slate-600 mx-1">/</span>
                  <span className="text-red-400">{m.losses}</span>
                  <span className="text-slate-600 mx-1">/</span>
                  <span className="text-slate-400">{m.draws}</span>
                </div>

                {/* Games */}
                <div className="col-span-2 text-right text-sm text-slate-400">
                  {m.games}
                </div>

                {/* Win rate */}
                <div className="col-span-1 text-right text-xs text-slate-600">
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
