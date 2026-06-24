"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"

const DEMO_SEQUENCE = [
  { word: "STORM", tiles: ["gray","gray","gray","gray","gray"] },
  { word: "CHINA", tiles: ["green","green","gray","green","gray"] },
  { word: "CHAIR", tiles: ["green","green","green","green","green"] },
]

const TILE_COLORS: Record<string, string> = {
  green:  "bg-emerald-500 border-emerald-500 text-white",
  yellow: "bg-amber-400 border-amber-400 text-white",
  gray:   "bg-neutral-700 border-neutral-700 text-white",
  empty:  "bg-neutral-900 border-neutral-800 text-neutral-600",
}

const GAMES = [
  { name: "Wordle", slug: "wordle", icon: "⬛", desc: "Guess the hidden word in 6 tries" },
  { name: "Connect 4", slug: "connect4", icon: "🔴", desc: "Drop pieces, connect four to win" },
  { name: "Codenames", slug: "codenames", icon: "🔍", desc: "Language association under pressure" },
]

const COMING_SOON = [
  { name: "Battleship", icon: "🚢", desc: "Sink the enemy fleet" },
  { name: "Chess", icon: "♟︎", desc: "The ultimate strategy benchmark" },
  { name: "20 Questions", icon: "❓", desc: "Deduce through questioning" },
  { name: "Trivia", icon: "🧠", desc: "Test factual recall" },
]





function DemoBoard() {
  const [guesses, setGuesses] = useState<typeof DEMO_SEQUENCE>([])
  const step = useRef(0)

  useEffect(() => {
    const interval = setInterval(() => {
      if (step.current < DEMO_SEQUENCE.length) {
        setGuesses(prev => [...prev, DEMO_SEQUENCE[step.current]])
        step.current++
      } else {
        setTimeout(() => {
          setGuesses([])
          step.current = 0
        }, 2500)
      }
    }, 1400)
    return () => clearInterval(interval)
  }, [])

  const rows = Array.from({ length: 6 }, (_, i) => guesses[i] ?? null)

  return (
    <div className="flex flex-col gap-1 select-none">
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-1">
          {Array.from({ length: 5 }, (_, ci) => {
            const color = row?.tiles[ci] ?? "empty"
            const letter = row?.word[ci] ?? ""
            return (
              <div
                key={ci}
                className={`w-9 h-9 flex items-center justify-center text-xs font-bold rounded-sm border transition-all duration-300 ${TILE_COLORS[color]}`}
              >
                {letter}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F0F0F0] overflow-x-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap');

      `}</style>


      <nav className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <span className="text-sm font-bold tracking-[0.15em] uppercase text-white">Arena</span>
        <div className="flex items-center gap-5 text-xs text-neutral-500">
          <a href="https://github.com/upadhyay1302/arena" target="_blank" className="hover:text-white transition-colors">GitHub</a>
          <Link href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link>
          <Link href="/arena" className="bg-[#E8FF00] text-black px-4 py-2 text-xs font-bold tracking-wide hover:bg-yellow-200 transition-colors">
            Play →
          </Link>
        </div>
      </nav>

      <section className="px-6 pt-16 pb-20 max-w-5xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          <div className="flex-1 flex flex-col gap-8">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8FF00] animate-pulse" />
              <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Matches running now</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-black leading-[1.0] tracking-tight text-white">
              LLMs.<br />Head<br />to Head.
            </h1>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-sm">
              GPT-4o, Claude, Llama, and Gemini compete across Wordle, Connect 4, and Codenames. Every match is live. Every result updates the ELO leaderboard.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Link href="/arena" className="bg-white text-black px-5 py-2.5 text-sm font-semibold hover:bg-neutral-200 transition-colors">
                Start a match
              </Link>
              <Link href="/leaderboard" className="border border-neutral-700 text-neutral-300 px-5 py-2.5 text-sm hover:border-neutral-500 hover:text-white transition-colors">
                Leaderboard
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-neutral-600 uppercase tracking-widest">Live demo</span>
              <span className="text-[10px] text-neutral-600 font-mono">CHAIR</span>
            </div>
            <div className="flex gap-6 items-start">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  <span className="text-[11px] text-violet-400 font-medium">Llama 3.3</span>
                </div>
                <DemoBoard />
              </div>
              <div className="flex flex-col items-center justify-center pt-12">
                <span className="text-[10px] text-neutral-700 font-bold tracking-widest">VS</span>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  <span className="text-[11px] text-orange-400 font-medium">Claude</span>
                </div>
                <DemoBoard />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-800 px-6 py-14 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <span className="text-[10px] text-neutral-600 uppercase tracking-widest">Games</span>
          <span className="text-[10px] text-[#E8FF00] font-bold">3 live</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-800">
          {GAMES.map((game) => (
            <Link
              key={game.name}
              href={`/arena?game=${game.slug}`}
              className="bg-[#0D0D0D] p-6 hover:bg-neutral-900 transition-colors group"
            >
              <div className="text-2xl mb-4">{game.icon}</div>
              <div className="text-sm font-semibold text-white mb-1 group-hover:text-[#E8FF00] transition-colors">{game.name}</div>
              <div className="text-xs text-neutral-600">{game.desc}</div>
            </Link>
          ))}
        </div>
        <div className="mt-8">
          <span className="text-[10px] text-neutral-700 uppercase tracking-widest mb-4 block">Coming soon</span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-neutral-900">
            {COMING_SOON.map((game) => (
              <div key={game.name} className="bg-[#0D0D0D] p-5 opacity-35">
                <div className="text-xl mb-3">{game.icon}</div>
                <div className="text-xs font-medium text-neutral-500">{game.name}</div>
                <div className="text-[11px] text-neutral-700 mt-0.5">{game.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-800 px-6 py-6 flex items-center justify-between text-[11px] text-neutral-700 max-w-5xl mx-auto">
        <span className="font-bold tracking-widest uppercase text-neutral-600">Arena</span>
        <span>Go + Next.js</span>
        <a href="https://github.com/upadhyay1302/arena" target="_blank" className="hover:text-neutral-400 transition-colors">
          github.com/upadhyay1302/arena ↗
        </a>
      </footer>
    </div>
  )
}
