"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getRandomQuestion, resetQuestionSession } from "@/lib/wikidata"
import { ArrowLeft, Award, Flag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSound } from "@/hooks/use-sound"
import { useLocale } from "@/hooks/use-locale"
import { LanguageSelector } from "@/components/language-selector"
import { WikimediaLoginButton } from "@/components/wikimedia-login-button"
import { useAuth } from "@/contexts/auth-context"
import { ReportAnswerDialog } from "@/components/report-answer-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useIsMobile } from "@/hooks/use-mobile"

const PRIZE_LEVELS = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000]

export default function PlayPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { playCorrectSound, playIncorrectSound } = useSound()
  const { locale, translations: t, changeLocale } = useLocale()
  const { user, loading: authLoading } = useAuth()
  const isMobile = useIsMobile()

  const [username, setUsername] = useState("")
  const [gameState, setGameState] = useState<"start" | "playing" | "finished">("start")
  const [currentQuestion, setCurrentQuestion] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null)
  const [level, setLevel] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [lifelines, setLifelines] = useState({
    fiftyFifty: true,
    audience: true,
    phone: true,
  })
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([])
  const [answerAnimation, setAnswerAnimation] = useState<"none" | "correct" | "incorrect">("none")
  const [loadError, setLoadError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [timerPaused, setTimerPaused] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [gameQuestions, setGameQuestions] = useState<any[]>([]) // Track all questions in the game

  useEffect(() => {
    // Si el usuario está autenticado, usar su nombre de usuario
    if (user) {
      setUsername(user.username)
    } else {
      // Si no, cargar nombre de usuario del almacenamiento local si existe
      const storedUsername = localStorage.getItem("wikimillionaire-username")
      if (storedUsername) {
        setUsername(storedUsername)
      }
    }
  }, [user])

  const startGame = async () => {
    if (!username.trim()) {
      toast({
        title: t.game.nameRequired.title,
        description: t.game.nameRequired.description,
        variant: "destructive",
      })
      return
    }

    // Si no está autenticado, guardar el nombre en localStorage
    if (!user) {
      localStorage.setItem("wikimillionaire-username", username)
    }

    // Reiniciar la sesión de preguntas para evitar duplicados
    resetQuestionSession()

    setGameState("playing")
    setLevel(0)
    setLifelines({
      fiftyFifty: true,
      audience: true,
      phone: true,
    })
    setLoadError(null)
    setRetryCount(0)
    setGameQuestions([]) // Reset questions list
    loadNextQuestion()
  }

  const loadNextQuestion = async () => {
    setLoading(true)
    setSelectedAnswer(null)
    setCorrectAnswer(null)
    setTimeLeft(30)
    setTimerPaused(true) // Pause timer until content is ready
    setEliminatedOptions([])
    setAnswerAnimation("none")
    setLoadError(null)

    try {
      const question = await getRandomQuestion(level)
      setCurrentQuestion(question)
      
      // If question has an image, wait for it to load before starting timer
      if (question.image) {
        const img = new Image()
        img.onload = () => {
          setTimerPaused(false) // Start timer once image is loaded
        }
        img.onerror = () => {
          // If image fails to load, start timer anyway
          setTimerPaused(false)
        }
        img.src = question.image
      } else {
        // No image, start timer immediately
        setTimerPaused(false)
      }
      
      // Preload next question in background (fire and forget)
      const nextLevel = level + 1
      if (nextLevel < PRIZE_LEVELS.length) {
        const nextDifficulty = nextLevel < 5 ? "easy" : nextLevel < 10 ? "medium" : "hard"
        // Trigger preload without waiting
        getRandomQuestion(nextLevel).catch(() => {
          // Ignore preload errors
        })
      }
    } catch (error) {
      console.error("Error loading question:", error)

      // Si hay un error, intentar cargar otra pregunta (máximo 3 intentos)
      if (retryCount < 2) {
        setRetryCount(retryCount + 1)
        toast({
          title: "Reintentando...",
          description: "Hubo un problema al cargar la pregunta. Intentando de nuevo.",
          variant: "default",
        })
        setTimeout(() => loadNextQuestion(), 1000)
        return
      }

      setLoadError("No se pudieron cargar las preguntas. Por favor, inténtalo más tarde.")
      toast({
        title: "Error",
        description: t.general.error,
        variant: "destructive",
      })
      setTimerPaused(false) // Unpause timer even on error
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer || eliminatedOptions.includes(answer)) return

    setSelectedAnswer(answer)

    // Verificar respuesta después de un breve retraso
    setTimeout(() => {
      const isCorrect = answer === currentQuestion.correctAnswer
      setCorrectAnswer(currentQuestion.correctAnswer)

      // Save question data for reporting
      setGameQuestions(prev => [...prev, {
        ...currentQuestion,
        userAnswer: answer,
        wasCorrect: isCorrect,
        level: level + 1
      }])

      // Reproducir sonido y mostrar animación
      if (isCorrect) {
        playCorrectSound()
        setAnswerAnimation("correct")
      } else {
        playIncorrectSound()
        setAnswerAnimation("incorrect")
      }

      // Esperar tiempo optimizado para que el usuario vea la respuesta correcta
      setTimeout(() => {
        if (isCorrect) {
          if (level === PRIZE_LEVELS.length - 1) {
            handleGameWin()
          } else {
            setLevel(level + 1)
            setRetryCount(0) // Reiniciar contador de reintentos
            loadNextQuestion()
          }
        } else {
          handleGameOver()
        }
      }, 800) // Reducido a 800ms para transición más rápida (total: 1.3s)
    }, 500) // Reducido a 500ms para respuesta más rápida
  }

  // Function to save score via API
  const saveScoreToAPI = async (username: string, score: number) => {
    try {
      const response = await fetch("/api/scores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, score }),
      })

      if (!response.ok) {
        throw new Error("Failed to save score")
      }

      return await response.json()
    } catch (error) {
      console.error("Error saving score via API:", error)
      throw error
    }
  }

  const handleGameOver = useCallback(async () => {
    const finalScore = PRIZE_LEVELS[level > 0 ? level - 1 : 0]

    // Save score to database via API
    try {
      await saveScoreToAPI(username, finalScore)
    } catch (error) {
      console.error("Error saving score to database:", error)
      // Fallback to localStorage if database save fails
      await saveScoreToLocalStorage(username, finalScore)
    }

    setGameState("finished")
  }, [level, username])

  const handleGameWin = useCallback(async () => {
    const finalScore = PRIZE_LEVELS[PRIZE_LEVELS.length - 1]

    // Save score to database via API
    try {
      await saveScoreToAPI(username, finalScore)
    } catch (error) {
      console.error("Error saving score to database:", error)
      // Fallback to localStorage if database save fails
      await saveScoreToLocalStorage(username, finalScore)
    }

    setGameState("finished")
  }, [username])

  // Timer useEffect - must be after handleGameOver definition
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (gameState === "playing" && timeLeft > 0 && !selectedAnswer && !timerPaused) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
    } else if (timeLeft === 0 && !selectedAnswer && !timerPaused) {
      handleGameOver()
    }

    return () => clearTimeout(timer)
  }, [timeLeft, gameState, selectedAnswer, timerPaused, handleGameOver])

  // Función para guardar puntuación en localStorage (fallback)
  const saveScoreToLocalStorage = async (username: string, score: number) => {
    try {
      const scoresJson = localStorage.getItem("wikimillionaire-scores")
      const scores = scoresJson ? JSON.parse(scoresJson) : []

      scores.push({
        username,
        score,
        date: new Date().toISOString(),
      })

      localStorage.setItem("wikimillionaire-scores", JSON.stringify(scores))
    } catch (error) {
      console.error("Error saving score to localStorage:", error)
    }
  }

  const useFiftyFifty = () => {
    if (!lifelines.fiftyFifty || selectedAnswer) return

    const options = currentQuestion.options.filter((opt: string) => opt !== currentQuestion.correctAnswer)
    const toEliminate = options.sort(() => 0.5 - Math.random()).slice(0, 2)

    setEliminatedOptions(toEliminate)
    setLifelines({ ...lifelines, fiftyFifty: false })
  }

  const useAudienceHelp = () => {
    if (!lifelines.audience || selectedAnswer) return

    // Simular ayuda del público
    toast({
      title: t.game.audienceHelp.title,
      description: `${t.game.audienceHelp.description} ${currentQuestion.correctAnswer}`,
    })

    setLifelines({ ...lifelines, audience: false })
  }

  const usePhoneAFriend = () => {
    if (!lifelines.phone || selectedAnswer) return

    // Simular llamada a un amigo
    const randomConfidence = Math.random()
    let message = `${t.game.phoneAFriend.description} `

    if (randomConfidence > 0.3) {
      message +=
        randomConfidence > 0.7
          ? `${t.game.phoneAFriend.veryConfident}: ${currentQuestion.correctAnswer}`
          : `${t.game.phoneAFriend.quiteConfident}: ${currentQuestion.correctAnswer}`
    } else {
      message += `${t.game.phoneAFriend.notSure}: ${currentQuestion.options[Math.floor(Math.random() * currentQuestion.options.length)]}`
    }

    toast({
      title: t.game.phoneAFriend.title,
      description: message,
    })

    setLifelines({ ...lifelines, phone: false })
  }

  if (gameState === "start") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-900 to-indigo-950 p-4">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <LanguageSelector currentLocale={locale} onLocaleChange={changeLocale} />
          <WikimediaLoginButton t={t} />
        </div>
        <Card className="w-full max-w-md border-purple-700 bg-purple-900/70 text-white">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              <span className="text-yellow-400">Wiki</span>Millionaire
            </CardTitle>
            <CardDescription className="text-center text-gray-300">
              ¿Quién quiere ser millonario? Versión Wikidata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user ? (
                <div className="text-center">
                  <p className="text-lg font-medium text-yellow-400">¡Bienvenido, {user.username}!</p>
                  <p className="text-sm text-gray-300">Jugarás como {user.username}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium text-gray-200">
                    {t.game.enterName}
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-md border border-purple-700 bg-purple-800/50 px-3 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                    placeholder={t.game.enterName}
                  />
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button onClick={startGame} className="w-full bg-yellow-500 text-black hover:bg-yellow-600">
              {t.game.startGame}
            </Button>
            {!user && (
              <div className="text-center text-sm text-gray-300">
                <p>
                  Inicia sesión con Wikimedia para guardar tus puntuaciones y aparecer en la tabla de clasificación
                  global.
                </p>
              </div>
            )}
            <Button
              variant="outline"
              asChild
              className="w-full border-purple-700 text-gray-300 hover:bg-purple-800/50 hover:text-white"
            >
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t.game.backToHome}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (gameState === "finished") {
    const finalScore = level > 0 ? PRIZE_LEVELS[level - 1] : 0
    const isWinner = finalScore === PRIZE_LEVELS[PRIZE_LEVELS.length - 1]

    return (
      <div className={`flex min-h-screen flex-col items-center justify-center p-4 ${
        isWinner 
          ? "bg-gradient-to-b from-yellow-600 via-amber-700 to-orange-800 animate-in fade-in duration-1000" 
          : "bg-gradient-to-b from-purple-900 to-indigo-950"
      }`}>
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <LanguageSelector currentLocale={locale} onLocaleChange={changeLocale} />
          <WikimediaLoginButton t={t} />
        </div>
        
        {/* Confetti effect for winner */}
        {isWinner && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="animate-confetti">
              {[...Array(50)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full opacity-70"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `-20px`,
                    animation: `fall ${2 + Math.random() * 3}s linear ${Math.random() * 2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
        
        <Card className={`w-full max-w-md text-white shadow-2xl ${
          isWinner 
            ? "border-yellow-400 bg-gradient-to-br from-yellow-500/20 to-orange-600/20 backdrop-blur-sm animate-pulse-slow" 
            : "border-purple-700 bg-purple-900/70"
        }`}>
          <CardHeader>
            <CardTitle className={`text-center ${isWinner ? "text-3xl font-bold text-yellow-200" : "text-2xl"}`}>
              {isWinner ? (
                <span className="flex items-center justify-center gap-2">
                  🎉 {t.game.congratulations} 🎉
                </span>
              ) : (
                t.game.gameOver
              )}
            </CardTitle>
            <CardDescription className={`text-center text-lg ${
              isWinner ? "text-yellow-100 font-semibold" : "text-gray-300"
            }`}>
              {isWinner
                ? "¡Has ganado el premio máximo!"
                : `${t.game.finalScore}: ${finalScore.toLocaleString()} ${t.leaderboard.points}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <div className={`rounded-full p-8 ${
              isWinner 
                ? "bg-gradient-to-br from-yellow-400 to-orange-500 animate-bounce-slow shadow-2xl" 
                : finalScore > 0
                  ? "bg-blue-500"
                  : "bg-gray-500"
            }`}>
              <Award className={`${isWinner ? "h-16 w-16" : "h-12 w-12"} text-white`} />
            </div>
            
            {isWinner ? (
              <div className="space-y-3 text-center">
                <p className="text-xl font-bold text-yellow-100">
                  ¡INCREÍBLE!
                </p>
                <p className="text-lg text-yellow-200">
                  Has respondido correctamente todas las {PRIZE_LEVELS.length} preguntas
                </p>
                <p className="text-2xl font-bold text-yellow-300 animate-pulse">
                  💰 {PRIZE_LEVELS[PRIZE_LEVELS.length - 1].toLocaleString()} {t.leaderboard.points} 💰
                </p>
                <p className="text-sm text-yellow-100/80">
                  ¡Te has convertido en un WikiMillonario virtual!
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                {finalScore > 0 ? (
                  <>
                    <p className="text-lg text-gray-200">
                      ¡Buen intento! Llegaste al nivel {level + 1} de {PRIZE_LEVELS.length}
                    </p>
                    <p className="text-gray-300">
                      Gracias por jugar. Tu puntuación ha sido registrada en la tabla de clasificación.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg text-gray-200">
                      No alcanzaste ningún nivel esta vez
                    </p>
                    <p className="text-gray-300">
                      ¡No te desanimes! Cada intento te hace más sabio. ¡Inténtalo de nuevo!
                    </p>
                  </>
                )}
              </div>
            )}
            
            {!user && finalScore > 0 && (
              <div className={`mt-2 rounded-md p-3 text-center text-sm ${
                isWinner 
                  ? "bg-yellow-400/20 border border-yellow-400" 
                  : "bg-purple-800/50"
              }`}>
                <p className={isWinner ? "text-yellow-100 font-semibold" : "text-yellow-400"}>
                  ¡Inicia sesión para guardar tu puntuación en la tabla de clasificación global!
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              onClick={() => {
                setGameState("start")
                setLevel(0)
              }}
              className={`w-full ${
                isWinner 
                  ? "bg-yellow-400 text-black hover:bg-yellow-500 font-bold" 
                  : "bg-yellow-500 text-black hover:bg-yellow-600"
              }`}
            >
              {t.game.playAgain}
            </Button>
            <Button
              variant="outline"
              asChild
              className={`w-full ${
                isWinner 
                  ? "border-yellow-400 text-yellow-200 hover:bg-yellow-400/10" 
                  : "border-purple-700 text-gray-300 hover:bg-purple-800/50 hover:text-white"
              }`}
            >
              <Link href="/leaderboard">
                <Award className="mr-2 h-4 w-4" />
                {t.game.viewLeaderboard}
              </Link>
            </Button>
            
            {/* Report Button - Show if there are questions to report */}
            {gameQuestions.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowReportDialog(true)}
                className={`w-full ${
                  isWinner 
                    ? "border-yellow-400 text-yellow-200 hover:bg-yellow-400/10" 
                    : "border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                }`}
              >
                <Flag className="mr-2 h-4 w-4" />
                {t.report.button}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-purple-900 to-indigo-950 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header with improved mobile responsiveness */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between sm:w-auto">
            <Link href="/" className="text-gray-300 hover:text-white">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div className="mx-4 text-center sm:mx-0">
              <h1 className="text-xl font-bold text-white sm:text-2xl">
                <span className="text-yellow-400">Wiki</span>Millionaire
              </h1>
            </div>
            {isMobile && (
              <div className="flex items-center gap-2">
                <LanguageSelector currentLocale={locale} onLocaleChange={changeLocale} />
                <WikimediaLoginButton t={t} />
              </div>
            )}
          </div>
          
          {/* Lifelines section - improved mobile layout */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
            <TooltipProvider>
              {/* 50/50 - Active */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size={isMobile ? "sm" : "icon"}
                    disabled={!lifelines.fiftyFifty}
                    onClick={useFiftyFifty}
                    className={`${isMobile ? 'h-9 px-3' : 'h-10 w-10'} rounded-full ${!lifelines.fiftyFifty ? "opacity-50" : "border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"}`}
                  >
                    <span className="font-bold">50</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t.game.lifelines.fiftyFifty}</p>
                </TooltipContent>
              </Tooltip>

              {/* Audience - Coming Soon */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size={isMobile ? "sm" : "icon"}
                    disabled={true}
                    className={`${isMobile ? 'h-9 px-3' : 'h-10 w-10'} rounded-full opacity-50 cursor-not-allowed border-gray-500 text-gray-400`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={isMobile ? "14" : "16"}
                      height={isMobile ? "14" : "16"}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-semibold">{t.game.lifelines.comingSoon}</p>
                  <p className="text-sm">{t.game.lifelines.comingSoonDescription}</p>
                </TooltipContent>
              </Tooltip>

              {/* Phone a Friend - Coming Soon (AI) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size={isMobile ? "sm" : "icon"}
                    disabled={true}
                    className={`${isMobile ? 'h-9 px-3' : 'h-10 w-10'} rounded-full opacity-50 cursor-not-allowed border-gray-500 text-gray-400`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={isMobile ? "14" : "16"}
                      height={isMobile ? "14" : "16"}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-semibold">{t.game.lifelines.comingSoon}</p>
                  <p className="text-sm">{t.game.lifelines.aiCallComingSoon}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {!isMobile && (
              <div className="flex items-center gap-2">
                <LanguageSelector currentLocale={locale} onLocaleChange={changeLocale} />
                <WikimediaLoginButton t={t} />
              </div>
            )}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="text-lg font-semibold text-white">
            {t.game.level}: {level + 1} / {PRIZE_LEVELS.length}
          </div>
          <div className="text-lg font-semibold text-yellow-400">
            {t.game.prize}: {PRIZE_LEVELS[level].toLocaleString()} {t.leaderboard.points}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-300">
            <span>
              {t.game.timeRemaining}: {timeLeft}s
            </span>
          </div>
          <Progress value={(timeLeft / 30) * 100} className="h-2" />
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent"></div>
          </div>
        ) : loadError ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4">
            <p className="text-center text-red-300">{loadError}</p>
            <Button
              onClick={() => {
                setRetryCount(0)
                loadNextQuestion()
              }}
              className="bg-yellow-500 text-black hover:bg-yellow-600"
            >
              Intentar de nuevo
            </Button>
          </div>
        ) : currentQuestion ? (
          <div className="space-y-6">
            <Card className="border-purple-700 bg-purple-900/70 text-white">
              <CardHeader>
                <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
              </CardHeader>
              {currentQuestion.image && (
                <CardContent className="flex justify-center">
                  <img
                    src={currentQuestion.image}
                    alt="Pregunta visual"
                    className="max-h-64 w-auto rounded-lg border-2 border-purple-700 object-contain"
                  />
                </CardContent>
              )}
            </Card>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {currentQuestion.options.map((option: string, index: number) => (
                <Button
                  key={index}
                  variant="outline"
                  className={`h-auto justify-start p-4 text-left transition-all duration-500 ${
                    eliminatedOptions.includes(option)
                      ? "opacity-30 cursor-not-allowed"
                      : selectedAnswer
                        ? option === correctAnswer
                          ? answerAnimation === "correct"
                            ? "bg-green-500/20 border-green-500 text-white animate-pulse"
                            : "bg-green-500/20 border-green-500 text-white"
                          : option === selectedAnswer && answerAnimation === "incorrect"
                            ? "bg-red-500/20 border-red-500 text-white animate-pulse"
                            : option === selectedAnswer
                              ? "bg-red-500/20 border-red-500 text-white"
                              : "border-purple-700 text-gray-300"
                        : "border-purple-700 text-white hover:bg-purple-800/50"
                  }`}
                  disabled={eliminatedOptions.includes(option) || !!selectedAnswer}
                  onClick={() => handleAnswerSelect(option)}
                >
                  <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full border border-current text-sm">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span>{option}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center">
            <p className="text-white">{t.general.error}</p>
          </div>
        )}

        <div className="mt-8">
          <h3 className="mb-2 text-lg font-semibold text-white">{t.game.prizeLevel}</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {PRIZE_LEVELS.slice()
              .reverse()
              .map((prize, index) => {
                const actualLevel = PRIZE_LEVELS.length - 1 - index
                return (
                  <div
                    key={index}
                    className={`rounded border p-2 text-center ${
                      actualLevel === level
                        ? "border-yellow-500 bg-yellow-500/20 text-yellow-400"
                        : actualLevel < level
                          ? "border-green-500 bg-green-500/10 text-green-400"
                          : "border-purple-700 bg-purple-800/30 text-gray-300"
                    }`}
                  >
                    {prize.toLocaleString()}
                  </div>
                )
              })}
          </div>
        </div>
      </div>
      <footer className="mt-auto border-t border-purple-700 bg-purple-900/50 py-4">
        <div className="container mx-auto">
          <p className="text-center text-sm text-gray-300">© 2025 WikiMillionaire. {t.general.credits}</p>
        </div>
      </footer>

      {/* Report Answer Dialog - Only render when game is finished */}
      {gameState === "finished" && gameQuestions.length > 0 && (
        <ReportAnswerDialog
          isOpen={showReportDialog}
          onClose={() => setShowReportDialog(false)}
          questions={gameQuestions}
          username={username}
          userId={user?.id}
          translations={t}
        />
      )}
    </div>
  )
}
