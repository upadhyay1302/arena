"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export type TileColor = "green" | "yellow" | "gray" | "empty"

interface TileProps {
  letter?: string
  color?: TileColor
  delay?: number
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
    <div className="w-12 h-12 [perspective:300px]">
      <div
        className={cn(
          "relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d]",
          flipped && "[transform:rotateX(180deg)]"
        )}
      >
        {/* Front */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center [backface-visibility:hidden]",
            "text-base font-bold font-mono tracking-widest text-white border",
            letter ? "border-neutral-600 bg-neutral-800" : "border-neutral-800 bg-neutral-950"
          )}
        >
          {letter}
        </div>

        {/* Back */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center [backface-visibility:hidden] [transform:rotateX(180deg)]",
            "text-base font-bold font-mono tracking-widest border",
            color === "green"  && "bg-emerald-500 border-emerald-500 text-black",
            color === "yellow" && "bg-[#E8FF00] border-[#E8FF00] text-black",
            color === "gray"   && "bg-neutral-700 border-neutral-700 text-white",
            color === "empty"  && "bg-neutral-950 border-neutral-800 text-white"
          )}
        >
          {letter}
        </div>
      </div>
    </div>
  )
}
