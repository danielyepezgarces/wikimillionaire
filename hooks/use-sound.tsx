"use client"

import { useEffect, useRef } from "react"

export function useSound() {
  const correctSoundRef = useRef<HTMLAudioElement | null>(null)
  const incorrectSoundRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      correctSoundRef.current = new Audio("/sounds/correct.mp3")
      incorrectSoundRef.current = new Audio("/sounds/incorrect.mp3")
    }
  }, [])

  const playCorrectSound = () => {
    if (correctSoundRef.current) {
      correctSoundRef.current.currentTime = 0
      correctSoundRef.current.play().catch((e) => console.error("Error playing sound:", e))
    }
  }

  const playIncorrectSound = () => {
    if (incorrectSoundRef.current) {
      incorrectSoundRef.current.currentTime = 0
      incorrectSoundRef.current.play().catch((e) => console.error("Error playing sound:", e))
    }
  }

  return {
    playCorrectSound,
    playIncorrectSound,
  }
}
