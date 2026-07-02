"use client"

import { use, useState, Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { modelLabel, modelColor, modelDot } from "@/lib/models"
import { useMatchSocket } from "@/hooks/useMatchSocket"
import { WordleBoard } from "@/components/wordle/WordleBoard"
import { Connect4Board, C4Cell } from "@/components/connect4/Connect4Board"
import { CodenamesBoard, Card } from "@/components/codenames/CodenamesBoard"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { BACKEND_URL } from "@/lib/config"







const EMPTY_BOARD: C4Cell[][] = Array.from({ length: 6 }, () => Array(7).fill(0) as C4Cell[])

function MatchPageInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const [models, setModels] = useState<string[]>([])
  const [game, setGame] = useState<string>(searchParams.get("game") ?? "wordle")
  const [board, setBoard] = useState<C4Cell[][]>(EMPTY_BOARD)
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | undefined>()
  const [currentTurn, setCurrentTurn] = useState<string>("")
  const [cnCards, setCnCards] = useState<Card[]>([])
  const [cnPhase, setCnPhase] = useState<string>("")
  const [currentClue, setCurrentClue] = useState<{ word: string; number: number } | undefined>()
  const [lastGuessWord, setLastGuessWord] = useState<string | undefined>()
  const [coldStart, setColdStart] = useState(false)

  const router = useRouter()
  const [rematching, setRematching] = useState(false)

  const rematch = async () => {
    setRematching(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game,
          models: playerList,
          secret_word: "",
        }),
      })
      const data = await res.json()
      router.push(`/match/${data.match_id}?game=${game}`)
    } catch {
      setRematching(false)
    }
  }

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
      if (event.type === "state" && "cards" in event.payload) {
        const s = event.payload as any
        setCnCards(s.cards ?? [])
        setCurrentTurn(s.current_turn ?? "")
        setCnPhase(s.phase ?? "")
        setCurrentClue(s.current_clue)
      }
      if (event.type === "clue") {
        setCurrentClue({ word: (event.payload as any).word, number: (event.payload as any).number })
      }
      if (event.type === "guess" && "card_type" in event.payload) {
        setLastGuessWord((event.payload as any).word)
      }
    },
  })

  useEffect(() => {
    if (connected) return
    const t = setTimeout(() => setColdStart(true), 8000)
    return () => clearTimeout(t)
  }, [connected])

  const playerList = models.length > 0 ? models : Object.keys(state.players)

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');`}</style>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-bold tracking-[0.15em] uppercase text-white hover:text-neutral-300 transition-colors">
            Arena
          </Link>
          <span className="text-neutral-700">·</span>
          <span className="text-[10px] text-neutral-600 uppercase tracking-widest capitalize">{game}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("w-1.5 h-1.5 rounded-full", connected ? "bg-[#E8FF00]" : "bg-neutral-700")} />
          <span className="text-[10px] text-neutral-600">{connected ? "live" : "disconnected"}</span>
        </div>
      </nav>

      {coldStart && !connected && (
        <div className="px-6 py-3 border-b border-neutral-800 bg-neutral-950 text-xs text-neutral-500 text-center">
          <span className="text-[#E8FF00]">⏳</span> Backend is waking up (Render free tier). Usually takes 20–30s — the match will start automatically.
        </div>
      )}

      {/* Winner banner */}
      {state.game_over && (
        <div className={cn(
          "px-6 py-3 text-center border-b text-sm font-semibold",
          state.winner
            ? "bg-[#E8FF00] text-black border-[#E8FF00]"
            : "bg-neutral-900 text-neutral-400 border-neutral-800"
        )}>
          {state.winner ? (
            <div className="flex items-center justify-center gap-6">
              <span>🏆 {modelLabel(state.winner)} wins{state.secret_word && <span className="font-normal ml-2 opacity-70">— the word was <span className="font-bold">{state.secret_word}</span></span>}</span>
              <button onClick={rematch} disabled={rematching} className="bg-black text-[#E8FF00] border border-black px-4 py-1 text-xs font-bold hover:bg-neutral-900 transition-colors disabled:opacity-50">
                {rematching ? "Starting..." : "Rematch →"}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-6">
              <span>Draw — neither model won</span>
              <button onClick={rematch} disabled={rematching} className="bg-neutral-800 text-white border border-neutral-700 px-4 py-1 text-xs font-bold hover:bg-neutral-700 transition-colors disabled:opacity-50">
                {rematching ? "Starting..." : "Rematch →"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Wordle */}
      {game === "wordle" && (
        <div className="flex flex-col items-center px-6 py-12 gap-12">
          {playerList.length === 0 ? (
            <div className="flex flex-col items-center gap-3 text-neutral-600 mt-20">
              <div className="w-5 h-5 border border-neutral-700 border-t-neutral-400 rounded-full animate-spin" />
              <span className="text-xs">Waiting for match to start...</span>
            </div>
          ) : (
            <div className="flex items-start gap-16">
              {playerList.map((model) => {
                const player = state.players[model] ?? { guesses: [], won: false, done: false }
                const isWinner = state.winner === model
                const isTurn = !state.game_over && !player.done

                return (
                  <div key={model} className="flex flex-col items-center gap-5">
                    {/* Model header */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className={cn("w-1.5 h-1.5 rounded-full", modelDot(model))} />
                        <span className={cn("text-sm font-bold", modelColor(model))}>
                          {modelLabel(model)}
                        </span>
                        {isTurn && (
                          <span className="text-[10px] text-[#E8FF00] animate-pulse">thinking</span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-700 font-mono">{model}</span>

                      {/* Status badges */}
                      {isWinner && (
                        <span className="text-[10px] bg-[#E8FF00] text-black px-2 py-0.5 font-bold">
                          WINNER
                        </span>
                      )}
                      {player.won && !isWinner && (
                        <span className="text-[10px] bg-emerald-500 text-black px-2 py-0.5 font-bold">
                          SOLVED
                        </span>
                      )}
                      {player.done && !player.won && (
                        <span className="text-[10px] bg-neutral-800 text-neutral-500 px-2 py-0.5 font-bold">
                          FAILED
                        </span>
                      )}
                    </div>

                    <WordleBoard guesses={player.guesses} />

                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {Array.from({ length: 6 }, (_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "w-4 h-1 transition-all duration-500",
                              i < player.guesses.length
                                ? player.won && i === player.guesses.length - 1
                                  ? "bg-[#E8FF00]"
                                  : "bg-neutral-500"
                                : "bg-neutral-800"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-neutral-600 tabular-nums">
                        {player.guesses.length}/6
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Connect 4 */}
      {game === "connect4" && (
        <div className="flex flex-col items-center gap-8 px-6 py-12">
          <div className="flex items-center gap-6">
            {playerList.map((model, i) => (
              <div key={model} className={cn(
                "flex items-center gap-2 px-4 py-2 border transition-all",
                currentTurn === model
                  ? "border-[#E8FF00] bg-neutral-900"
                  : "border-neutral-800 opacity-40"
              )}>
                <div className={cn("w-2.5 h-2.5 rounded-full", i === 0 ? "bg-neutral-200" : "bg-red-500")} />
                <span className={cn("text-sm font-semibold", modelColor(model))}>{modelLabel(model)}</span>
                {currentTurn === model && !state.game_over && (
                  <span className="text-[10px] text-[#E8FF00] animate-pulse">thinking</span>
                )}
              </div>
            ))}
          </div>

          <Connect4Board board={board} lastMove={lastMove} />

          <div className="flex gap-6 text-[11px] text-neutral-600">
            {playerList.map((model, i) => {
              const p = state.players[model]
              return (
                <div key={model} className="flex items-center gap-2">
                  <div className={cn("w-1.5 h-1.5 rounded-full", i === 0 ? "bg-neutral-400" : "bg-red-500")} />
                  <span>{modelLabel(model)}</span>
                  <span className="text-neutral-700">({p?.moves?.length ?? 0} moves)</span>
                  {state.winner === model && (
                    <span className="bg-[#E8FF00] text-black text-[10px] px-1.5 py-0.5 font-bold">WINNER</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Codenames */}
      {game === "codenames" && (
        <div className="flex flex-col items-center gap-6 px-6 py-12">
          <div className="flex items-center gap-6">
            {playerList.map((model, i) => (
              <div key={model} className={cn(
                "flex items-center gap-2 px-4 py-2 border transition-all",
                currentTurn === model ? "border-[#E8FF00] bg-neutral-900" : "border-neutral-800 opacity-40"
              )}>
                <div className={cn("w-2.5 h-2.5 rounded-full", i === 0 ? "bg-sky-500" : "bg-red-500")} />
                <span className={cn("text-sm font-semibold", modelColor(model))}>{modelLabel(model)}</span>
                {currentTurn === model && !state.game_over && (
                  <span className="text-[10px] text-[#E8FF00] animate-pulse">
                    {cnPhase === "clue" ? "giving clue" : "guessing"}
                  </span>
                )}
              </div>
            ))}
          </div>

          {currentClue && !state.game_over && (
            <div className="border border-neutral-800 bg-neutral-950 px-8 py-4 text-center">
              <div className="text-[10px] text-neutral-600 uppercase tracking-widest mb-2">Current Clue</div>
              <div className="text-2xl font-black text-white">
                {currentClue.word}
                <span className="text-[#E8FF00] ml-3">{currentClue.number}</span>
              </div>
            </div>
          )}

          <CodenamesBoard cards={cnCards} lastGuess={lastGuessWord} />

          <div className="flex gap-6 text-[11px] text-neutral-600">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              <span>Blue: {playerList[0] && modelLabel(playerList[0])}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span>Red: {playerList[1] && modelLabel(playerList[1])}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0D0D0D]" />}>
      <MatchPageInner params={params} />
    </Suspense>
  )
}
