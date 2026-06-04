"use client"

import { Tile, TileColor } from "./Tile"

export interface GuessRow {
  word: string
  tiles: { letter: string; color: TileColor }[]
}

interface WordleBoardProps {
  guesses: GuessRow[]
  maxGuesses?: number
}

export function WordleBoard({ guesses, maxGuesses = 6 }: WordleBoardProps) {
  const rows = Array.from({ length: maxGuesses }, (_, i) => guesses[i] ?? null)

  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className="flex gap-1.5">
          {Array.from({ length: 5 }, (_, colIdx) => {
            const tile = row?.tiles[colIdx]
            return (
              <Tile
                key={colIdx}
                letter={tile?.letter}
                color={tile?.color ?? "empty"}
                delay={colIdx * 100}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
