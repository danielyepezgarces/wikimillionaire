"use client"

import { useState, useEffect } from "react"

export function useSound() {
  const [correctSound, setCorrectSound] = useState<HTMLAudioElement | null>(null)
  const [incorrectSound, setIncorrectSound] = useState<HTMLAudioElement | null>(null)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    // Cargar sonidos solo en el cliente
    if (typeof window !== "undefined") {
      const correct = new Audio("/sounds/correct.mp3")
      const incorrect = new Audio("/sounds/incorrect.mp3")

      setCorrectSound(correct)
      setIncorrectSound(incorrect)

      // Intentar cargar el estado de mute desde localStorage
      const savedMute = localStorage.getItem("wikimillionaire-muted")
      if (savedMute) {
        setIsMuted(savedMute === "true")
      }
    }
  }, [])

  const playCorrectSound = () => {
    if (correctSound && !isMuted) {
      correctSound.currentTime = 0
      correctSound.play().catch((err) => console.error("Error playing sound:", err))
    }
  }

  const playIncorrectSound = () => {
    if (incorrectSound && !isMuted) {
      incorrectSound.currentTime = 0
      incorrectSound.play().catch((err) => console.error("Error playing sound:", err))
    }
  }

  const toggleMute = () => {
    const newMuted = !isMuted
    setIsMuted(newMuted)
    localStorage.setItem("wikimillionaire-muted", newMuted.toString())
  }

  return {
    playCorrectSound,
    playIncorrectSound,
    isMuted,
    toggleMute,
  }
}
