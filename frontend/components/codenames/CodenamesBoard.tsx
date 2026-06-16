"use client"

import { cn } from "@/lib/utils"

export interface Card {
  word: string
  type: "blue" | "red" | "neutral" | "assassin" | ""
  revealed: boolean
}

interface CodenamesBoardProps {
  cards: Card[]
  lastGuess?: string
}

const TYPE_STYLES: Record<string, string> = {
  blue: "bg-sky-950 border-sky-500 text-sky-300",
  red: "bg-red-950 border-red-500 text-red-300",
  neutral: "bg-slate-800 border-slate-600 text-slate-400",
  assassin: "bg-black border-slate-900 text-white",
  "": "bg-slate-900 border-slate-700 text-slate-300",
}

export function CodenamesBoard({ cards, lastGuess }: CodenamesBoardProps) {
  return (
    <div className="grid grid-cols-5 gap-2 max-w-2xl">
      {cards.map((card, i) => {
        const isLast = card.word === lastGuess
        return (
          <div
            key={i}
            className={cn(
              "relative flex items-center justify-center text-center px-2 py-4 rounded-lg border-2 text-xs font-bold uppercase tracking-wide transition-all duration-300",
              card.revealed ? TYPE_STYLES[card.type] : "bg-slate-900 border-slate-700 text-slate-200",
              card.revealed && "opacity-60",
              isLast && "ring-2 ring-white scale-105"
            )}
          >
            {card.word}
            {card.revealed && card.type === "assassin" && (
              <span className="absolute -top-1.5 -right-1.5 text-sm">💀</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
