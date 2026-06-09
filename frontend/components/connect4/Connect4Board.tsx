"use client"

import { cn } from "@/lib/utils"

export type C4Cell = 0 | 1 | 2 // 0=empty, 1=black, 2=red

interface Connect4BoardProps {
  board: C4Cell[][]
  lastMove?: { row: number; col: number }
}

export function Connect4Board({ board, lastMove }: Connect4BoardProps) {
  return (
    <div className="flex flex-col gap-1 bg-slate-800 p-3 rounded-xl border border-slate-700">
      {board.map((row, rowIdx) => (
        <div key={rowIdx} className="flex gap-1">
          {row.map((cell, colIdx) => {
            const isLast = lastMove?.row === rowIdx && lastMove?.col === colIdx
            return (
              <div
                key={colIdx}
                className={cn(
                  "w-10 h-10 rounded-full border-2 transition-all duration-300",
                  cell === 0 && "bg-slate-900 border-slate-700",
                  cell === 1 && "bg-slate-100 border-slate-300",
                  cell === 2 && "bg-red-500 border-red-400",
                  isLast && "ring-2 ring-white ring-offset-1 ring-offset-slate-800"
                )}
              />
            )
          })}
        </div>
      ))}
      {/* Column numbers */}
      <div className="flex gap-1 mt-1">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="w-10 text-center text-xs text-slate-600">{i}</div>
        ))}
      </div>
    </div>
  )
}
