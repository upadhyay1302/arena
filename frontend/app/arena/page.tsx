"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { BACKEND_URL } from "@/lib/config"

const AVAILABLE_GAMES = [
  { id: "wordle", label: "Wordle", icon: "⬛" },
  { id: "connect4", label: "Connect 4", icon: "🔴" },
  { id: "codenames", label: "Codenames", icon: "🔍" },
]

const AVAILABLE_MODELS = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", provider: "Groq" },
  { id: "qwen/qwen3-32b", label: "Qwen 3 32B", provider: "Groq" },
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B", provider: "Groq" },
  { id: "gpt-4o", label: "GPT-4o", provider: "OpenAI" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI" },
  { id: "claude-sonnet-4-5", label: "Claude Sonnet", provider: "Anthropic" },
]

const WORDS = ["CRANE", "PLANT", "BRAIN", "CLOUD", "FLAME", "FROST", "GLOBE", "LIGHT", "MUSIC", "STONE"]

function ArenaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const gameParam = (searchParams.get("game") ?? "").replace(/-/g, "")
  const gamePreselected = !!gameParam

  const [selectedGame, setSelectedGame] = useState(gameParam || "wordle")
  const [model1, setModel1] = useState(AVAILABLE_MODELS[0].id)
  const [model2, setModel2] = useState(AVAILABLE_MODELS[1].id)
  const [word, setWord] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const randomWord = () => WORDS[Math.floor(Math.random() * WORDS.length)]

  const startMatch = async () => {
    const secretWord = selectedGame === "wordle"
      ? (word.trim().toUpperCase() || randomWord())
      : ""

    if (selectedGame === "wordle" && secretWord.length !== 5) {
      setError("Word must be 5 letters")
      return
    }

    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${BACKEND_URL}/api/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: selectedGame,
          models: [model1, model2],
          secret_word: secretWord,
        }),
      })
      const data = await res.json()
      router.push(`/match/${data.match_id}?game=${selectedGame}`)
    } catch (e) {
      setError("Failed to connect to backend")
      setLoading(false)
    }
  }

  const selectedGameInfo = AVAILABLE_GAMES.find(g => g.id === selectedGame)

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');`}</style>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <Link href="/" className="text-sm font-bold tracking-[0.15em] uppercase text-white hover:text-neutral-300 transition-colors">
          Arena
        </Link>
        <div className="flex items-center gap-5 text-xs text-neutral-500">
          <Link href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link>
          <a href="https://github.com/upadhyay1302/arena" target="_blank" className="hover:text-white transition-colors">GitHub</a>
        </div>
      </nav>

      {/* Content */}
      <div className="flex flex-col items-center justify-center px-4 py-20">
        <div className="w-full max-w-md flex flex-col gap-8">

          {/* Header */}
          <div>
            <div className="text-[10px] text-neutral-600 uppercase tracking-widest mb-3">New Match</div>
            {gamePreselected ? (
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedGameInfo?.icon}</span>
                <h1 className="text-2xl font-black text-white tracking-tight">{selectedGameInfo?.label}</h1>
              </div>
            ) : (
              <h1 className="text-2xl font-black text-white tracking-tight">Choose a game</h1>
            )}
          </div>

          {/* Card */}
          <div className="border border-neutral-800 bg-neutral-950 flex flex-col gap-6 p-6">

            {/* Game selector */}
            {!gamePreselected && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-neutral-600 uppercase tracking-widest">Game</label>
                <div className="grid grid-cols-3 gap-px bg-neutral-800">
                  {AVAILABLE_GAMES.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGame(g.id)}
                      className={`flex flex-col items-center gap-1 py-3 text-xs font-semibold transition-all ${
                        selectedGame === g.id
                          ? "bg-[#E8FF00] text-black"
                          : "bg-[#0D0D0D] text-neutral-500 hover:bg-neutral-900 hover:text-white"
                      }`}
                    >
                      <span className="text-base">{g.icon}</span>
                      <span>{g.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Model 1 */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-neutral-600 uppercase tracking-widest">Model 1</label>
              <select
                value={model1}
                onChange={e => setModel1(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-600 appearance-none"
              >
                {AVAILABLE_MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.label} — {m.provider}</option>
                ))}
              </select>
            </div>

            {/* VS */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-neutral-800" />
              <span className="text-[10px] text-neutral-700 font-bold tracking-widest">VS</span>
              <div className="flex-1 h-px bg-neutral-800" />
            </div>

            {/* Model 2 */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-neutral-600 uppercase tracking-widest">Model 2</label>
              <select
                value={model2}
                onChange={e => setModel2(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-600 appearance-none"
              >
                {AVAILABLE_MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.label} — {m.provider}</option>
                ))}
              </select>
            </div>

            {/* Secret word */}
            {selectedGame === "wordle" && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-neutral-600 uppercase tracking-widest">
                  Secret Word <span className="normal-case text-neutral-700">(blank = random)</span>
                </label>
                <input
                  value={word}
                  onChange={e => setWord(e.target.value.toUpperCase())}
                  maxLength={5}
                  placeholder="e.g. CRANE"
                  className="bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-sm text-white font-mono tracking-widest placeholder:text-neutral-700 focus:outline-none focus:border-neutral-600"
                />
              </div>
            )}

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              onClick={startMatch}
              disabled={loading}
              className="w-full bg-[#E8FF00] text-black py-3 text-sm font-bold tracking-wide hover:bg-yellow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Starting..." : "Start Match →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ArenaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0D0D0D]" />}>
      <ArenaContent />
    </Suspense>
  )
}
