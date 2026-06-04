"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export type TileColor = "green" | "yellow" | "gray" | "empty"

interface TileProps {
  letter?: string
  color?: TileColor
  delay?: number // stagger delay in ms
}

export function Tile({ letter, color = "empty", delay = 0 }: TileProps) {
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    if (letter && color !== "empty") {
      const t = setTimeout(() => setFlipped(true), delay)
      return () => clearTimeout(t)
    } else {
      setFlipped(false)
    }
  }, [letter, color, delay])

  return (
    <div className="w-14 h-14 [perspective:300px]">
      <div
        className={cn(
          "relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d]",
          flipped && "[transform:rotateX(180deg)]"
        )}
      >
        {/* Front face */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-md border-2 [backface-visibility:hidden]",
            "text-xl font-bold font-mono tracking-widest text-white",
            letter ? "border-slate-500 bg-slate-800" : "border-slate-700 bg-slate-900"
          )}
        >
          {letter}
        </div>

        {/* Back face — revealed after flip */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-md [backface-visibility:hidden] [transform:rotateX(180deg)]",
            "text-xl font-bold font-mono tracking-widest text-white",
            color === "green" && "bg-emerald-600 border-2 border-emerald-600 shadow-lg shadow-emerald-500/30",
            color === "yellow" && "bg-amber-500 border-2 border-amber-500 shadow-lg shadow-amber-500/30",
            color === "gray" && "bg-slate-600 border-2 border-slate-600",
            color === "empty" && "bg-slate-900 border-2 border-slate-700"
          )}
        >
          {letter}
        </div>
      </div>
    </div>
  )
}
