"use client"
import { cn } from "@/lib/utils"

export type C4Cell = 0 | 1 | 2 // 0=empty, 1=player1, 2=player2

interface Connect4BoardProps {
  board: C4Cell[][]
  lastMove?: { row: number; col: number }
}

export function Connect4Board({ board, lastMove }: Connect4BoardProps) {
  return (
    <div className="flex flex-col gap-1.5 bg-neutral-900 border border-neutral-800 p-4">
      {board.map((row, rowIdx) => (
        <div key={rowIdx} className="flex gap-1.5">
          {row.map((cell, colIdx) => {
            const isLast = lastMove?.row === rowIdx && lastMove?.col === colIdx
            return (
              <div
                key={colIdx}
                className={cn(
                  "w-10 h-10 rounded-full border transition-all duration-300",
                  cell === 0 && "bg-neutral-950 border-neutral-800",
                  cell === 1 && "bg-[#E8FF00] border-[#E8FF00] shadow-[0_0_8px_rgba(232,255,0,0.4)]",
                  cell === 2 && "bg-red-500 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]",
                  isLast && "ring-2 ring-white ring-offset-1 ring-offset-neutral-900"
                )}
              />
            )
          })}
        </div>
      ))}
      <div className="flex gap-1.5 mt-1">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="w-10 text-center text-[10px] text-neutral-700">{i}</div>
        ))}
      </div>
    </div>
  )
}
