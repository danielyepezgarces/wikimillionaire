"use client"
import { useEffect, useState } from "react"

interface CountdownTimerProps {
  targetDate: Date
  onComplete?: () => void
  className?: string
}

export function CountdownTimer({ targetDate, onComplete, className = "" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime()

      if (difference <= 0) {
        setIsComplete(true)
        if (onComplete) onComplete()
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        }
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
    }

    // Calcular tiempo inicial
    setTimeLeft(calculateTimeLeft())

    // Actualizar cada segundo
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft()
      setTimeLeft(newTimeLeft)

      if (newTimeLeft.days === 0 && newTimeLeft.hours === 0 && newTimeLeft.minutes === 0 && newTimeLeft.seconds === 0) {
        clearInterval(timer)
        setIsComplete(true)
        if (onComplete) onComplete()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate, onComplete])

  // Formatear los números para que siempre tengan dos dígitos
  const formatNumber = (num: number): string => {
    return num.toString().padStart(2, "0")
  }

  // Si el tiempo restante es más de un día, mostrar días y horas
  if (timeLeft.days > 0) {
    return (
      <span className={className}>
        {timeLeft.days}d {formatNumber(timeLeft.hours)}h {formatNumber(timeLeft.minutes)}m
      </span>
    )
  }

  // Si el tiempo restante es menos de un día pero más de una hora, mostrar horas y minutos
  if (timeLeft.hours > 0) {
    return (
      <span className={className}>
        {formatNumber(timeLeft.hours)}h {formatNumber(timeLeft.minutes)}m {formatNumber(timeLeft.seconds)}s
      </span>
    )
  }

  // Si el tiempo restante es menos de una hora, mostrar minutos y segundos
  return (
    <span className={className}>
      {formatNumber(timeLeft.minutes)}m {formatNumber(timeLeft.seconds)}s
    </span>
  )
}
