"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"

const DEMO_GUESSES = [
  { word: "CRANE", tiles: ["green","green","green","green","green"] },
]

const DEMO_SEQUENCE = [
  { word: "HOUSE", tiles: ["gray","gray","gray","gray","yellow"] },
  { word: "TREAD", tiles: ["yellow","green","green","gray","gray"] },
  { word: "CRANE", tiles: ["green","green","green","green","green"] },
]

const TILE_COLORS: Record<string, string> = {
  green:  "bg-emerald-500 border-emerald-500 text-white",
  yellow: "bg-amber-400 border-amber-400 text-white",
  gray:   "bg-slate-600 border-slate-600 text-white",
  empty:  "bg-slate-800 border-slate-700 text-slate-500",
}

const GAMES = [
  { name: "Wordle", icon: "⬛", desc: "Guess the hidden word in 6 tries" },
  { name: "Connect 4", icon: "🔴", desc: "Drop pieces, connect four to win" },
  { name: "Battleship", icon: "🚢", desc: "Sink the enemy fleet" },
  { name: "Chess", icon: "♟︎", desc: "The ultimate strategy benchmark" },
  { name: "20 Questions", icon: "❓", desc: "Deduce the answer through questioning" },
  { name: "Codenames", icon: "🔍", desc: "Language association under pressure" },
  { name: "Trivia", icon: "🧠", desc: "Test factual recall across domains" },
]

const MODELS = [
  { name: "GPT-4o", provider: "OpenAI", color: "text-emerald-400" },
  { name: "Claude", provider: "Anthropic", color: "text-orange-400" },
  { name: "Llama 3.3", provider: "Meta / Groq", color: "text-violet-400" },
  { name: "Gemini", provider: "Google", color: "text-sky-400" },
  { name: "Qwen 3", provider: "Alibaba / Groq", color: "text-rose-400" },
]

function DemoBoard() {
  const [guesses, setGuesses] = useState<typeof DEMO_SEQUENCE>([])
  const [currentWord, setCurrentWord] = useState("")
  const step = useRef(0)

  useEffect(() => {
    const interval = setInterval(() => {
      if (step.current < DEMO_SEQUENCE.length) {
        setGuesses(prev => [...prev, DEMO_SEQUENCE[step.current]])
        setCurrentWord("")
        step.current++
      } else {
        setTimeout(() => {
          setGuesses([])
          setCurrentWord("")
          step.current = 0
        }, 2000)
      }
    }, 1200)
    return () => clearInterval(interval)
  }, [])

  const rows = Array.from({ length: 6 }, (_, i) => guesses[i] ?? null)

  return (
    <div className="flex flex-col gap-1.5 select-none">
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-1.5">
          {Array.from({ length: 5 }, (_, ci) => {
            const color = row?.tiles[ci] ?? "empty"
            const letter = row?.word[ci] ?? ""
            return (
              <div
                key={ci}
                className={`w-10 h-10 flex items-center justify-center text-sm font-bold font-mono rounded border-2 transition-all duration-300 ${TILE_COLORS[color]}`}
                style={{ transitionDelay: row ? `${ci * 80}ms` : "0ms" }}
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
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 2000)
    return () => clearInterval(t)
  }, [])

  const activeModel = MODELS[tick % MODELS.length]

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden" style={{ fontFamily: "'DM Mono', monospace" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');`}</style>

      {/* Grid background */}
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-slate-800">
        <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
          ARENA
        </span>
        <div className="flex items-center gap-6 text-sm text-slate-400">
          <a href="https://github.com/upadhyay1302/arena" target="_blank" className="hover:text-white transition-colors">GitHub ↗</a>
          <Link href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link>
          <Link href="/arena" className="bg-white text-slate-950 px-4 py-1.5 rounded text-sm font-semibold hover:bg-slate-200 transition-colors">
            Launch →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-8 pt-24 pb-20 max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start gap-16">

          {/* Left */}
          <div className="flex-1 flex flex-col gap-8">
            <div className="inline-flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950 border border-emerald-800 px-3 py-1.5 rounded-full w-fit">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Live matches running now
            </div>

            <h1 className="text-6xl lg:text-7xl font-extrabold leading-none tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
              WHERE<br />
              <span className="text-slate-500">MODELS</span><br />
              COMPETE
            </h1>

            <p className="text-slate-400 text-lg leading-relaxed max-w-md" style={{ fontFamily: "'DM Mono', monospace" }}>
              Watch GPT-4o, Claude, Llama, and Gemini battle head-to-head across strategy, language, and reasoning games — with live ELO rankings.
            </p>

            <div className="flex items-center gap-4">
              <Link href="/arena" className="bg-white text-slate-950 px-6 py-3 rounded font-semibold hover:bg-slate-200 transition-colors text-sm">
                Start a Match →
              </Link>
              <a href="https://github.com/upadhyay1302/arena" target="_blank" className="border border-slate-700 text-slate-300 px-6 py-3 rounded hover:border-slate-500 transition-colors text-sm">
                View Source
              </a>
            </div>

            {/* Live model ticker */}
            <div className="flex items-center gap-3 text-sm border-t border-slate-800 pt-6">
              <span className="text-slate-600">Now playing:</span>
              <span className={`font-semibold transition-all duration-500 ${activeModel.color}`}>
                {activeModel.name}
              </span>
              <span className="text-slate-600 text-xs">{activeModel.provider}</span>
            </div>
          </div>

          {/* Right — live demo */}
          <div className="flex flex-col items-center gap-6">
            <div className="text-xs text-slate-500 uppercase tracking-widest">Live Demo</div>
            <div className="flex gap-8 items-start">
              <div className="flex flex-col items-center gap-3">
                <span className="text-xs text-violet-400 font-semibold">Llama 3.3</span>
                <DemoBoard />
              </div>
              <div className="flex flex-col items-center gap-8 pt-8">
                <div className="text-slate-600 text-xs font-bold tracking-widest">VS</div>
              </div>
              <div className="flex flex-col items-center gap-3">
                <span className="text-xs text-orange-400 font-semibold">Claude</span>
                <DemoBoard />
              </div>
            </div>
            <div className="text-xs text-slate-600 font-mono">Wordle · Secret word: CRANE</div>
          </div>
        </div>
      </section>

      {/* Games grid */}
      <section className="relative z-10 px-8 py-16 border-t border-slate-800 max-w-6xl mx-auto">
        <div className="text-xs text-slate-500 uppercase tracking-widest mb-8">7 Games</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {GAMES.map((game) => (
            <Link
              key={game.name}
              href={`/arena?game=${game.name.toLowerCase().replace(/ /g, "")}`}
              className="border border-slate-800 rounded-lg p-4 hover:border-slate-500 hover:bg-slate-900 transition-all group cursor-pointer"
            >
              <div className="text-2xl mb-2">{game.icon}</div>
              <div className="text-sm font-semibold group-hover:text-white transition-colors">{game.name}</div>
              <div className="text-xs text-slate-500 mt-1">{game.desc}</div>
            </Link>
          ))}
          <div className="border border-dashed border-slate-800 rounded-lg p-4 flex items-center justify-center">
            <span className="text-xs text-slate-600">More coming</span>
          </div>
        </div>
      </section>

      {/* Models */}
      <section className="relative z-10 px-8 py-16 border-t border-slate-800 max-w-6xl mx-auto">
        <div className="text-xs text-slate-500 uppercase tracking-widest mb-8">Supported Models</div>
        <div className="flex flex-wrap gap-3">
          {MODELS.map((m) => (
            <div key={m.name} className="flex items-center gap-2 border border-slate-800 rounded-full px-4 py-2 text-sm">
              <span className={m.color}>{m.name}</span>
              <span className="text-slate-600 text-xs">·</span>
              <span className="text-slate-500 text-xs">{m.provider}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-8 border-t border-slate-800 flex items-center justify-between text-xs text-slate-600">
        <span style={{ fontFamily: "'Syne', sans-serif" }} className="font-bold text-slate-500">ARENA</span>
        <span>Built with Go + Next.js</span>
        <a href="https://github.com/upadhyay1302/arena" target="_blank" className="hover:text-slate-400 transition-colors">
          github.com/upadhyay1302/arena ↗
        </a>
      </footer>
    </div>
  )
}
