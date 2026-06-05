"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const AVAILABLE_MODELS = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", provider: "Groq" },
  { id: "qwen/qwen3-32b", label: "Qwen 3 32B", provider: "Groq" },
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B", provider: "Groq" },
  { id: "gpt-4o", label: "GPT-4o", provider: "OpenAI" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI" },
  { id: "claude-sonnet-4-5", label: "Claude Sonnet", provider: "Anthropic" },
]

const WORDS = ["CRANE", "PLANT", "BRAIN", "CLOUD", "FLAME", "FROST", "GLOBE", "LIGHT", "MUSIC", "STONE"]

import { Suspense } from "react"

function ArenaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const gameParam = searchParams.get("game") ?? "wordle"
  const [model1, setModel1] = useState(AVAILABLE_MODELS[0].id)
  const [model2, setModel2] = useState(AVAILABLE_MODELS[1].id)
  const [word, setWord] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const randomWord = () => WORDS[Math.floor(Math.random() * WORDS.length)]

  const startMatch = async () => {
    const secretWord = word.trim().toUpperCase() || randomWord()
    if (secretWord.length !== 5) {
      setError("Word must be 5 letters")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("http://localhost:8080/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: "wordle",
          models: [model1, model2],
          secret_word: secretWord,
        }),
      })
      const data = await res.json()
      router.push(`/match/${data.match_id}`)
    } catch (e) {
      setError("Failed to connect to backend")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Arena</h1>
          <p className="text-slate-400 text-sm">Watch LLMs compete head to head</p>
        </div>

        <Card className="bg-slate-900 border-slate-800 p-6 flex flex-col gap-6">
          {/* Model 1 */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 uppercase tracking-widest">Model 1</label>
            <select
              value={model1}
              onChange={e => setModel1(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              {AVAILABLE_MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.label} — {m.provider}</option>
              ))}
            </select>
          </div>

          {/* VS divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-500 font-bold tracking-widest">VS</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Model 2 */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 uppercase tracking-widest">Model 2</label>
            <select
              value={model2}
              onChange={e => setModel2(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              {AVAILABLE_MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.label} — {m.provider}</option>
              ))}
            </select>
          </div>

          {/* Secret word */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 uppercase tracking-widest">
              Secret Word <span className="normal-case text-slate-600">(leave blank for random)</span>
            </label>
            <input
              value={word}
              onChange={e => setWord(e.target.value.toUpperCase())}
              maxLength={5}
              placeholder="e.g. CRANE"
              className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-white font-mono tracking-widest placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <Button
            onClick={startMatch}
            disabled={loading}
            className="w-full bg-white text-slate-950 hover:bg-slate-200 font-semibold"
          >
            {loading ? "Starting..." : "Start Match →"}
          </Button>
        </Card>
      </div>
    </div>
  )
}

export default function ArenaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <ArenaContent />
    </Suspense>
  )
}
