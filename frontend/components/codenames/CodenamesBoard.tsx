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
  blue:     "bg-sky-950 border-sky-500 text-sky-300",
  red:      "bg-red-950 border-red-500 text-red-300",
  neutral:  "bg-neutral-800 border-neutral-700 text-neutral-500",
  assassin: "bg-black border-neutral-900 text-white",
  "":       "bg-neutral-950 border-neutral-800 text-neutral-400",
}

const UNREVEALED = "bg-neutral-900 border-neutral-700 text-neutral-200 hover:border-neutral-600"

export function CodenamesBoard({ cards, lastGuess }: CodenamesBoardProps) {
  return (
    <div className="grid grid-cols-5 gap-1.5 max-w-2xl">
      {cards.map((card, i) => {
        const isLast = card.word === lastGuess
        return (
          <div
            key={i}
            className={cn(
              "relative flex items-center justify-center text-center px-2 py-4 border text-[11px] font-bold uppercase tracking-wider transition-all duration-300",
              card.revealed ? TYPE_STYLES[card.type] : UNREVEALED,
              card.revealed && "opacity-50",
              isLast && "ring-1 ring-[#E8FF00] scale-105 opacity-100"
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
