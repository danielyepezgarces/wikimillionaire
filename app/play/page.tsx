"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getRandomQuestion } from "@/lib/wikidata"
import { saveScore } from "@/lib/scores"
import { ArrowLeft, Award } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSound } from "@/hooks/use-sound"
import { useLocale } from "@/hooks/use-locale"
import { LanguageSelector } from "@/components/language-selector"
import { WikimediaLoginButton } from "@/components/wikimedia-login-button"
import { useAuth } from "@/contexts/auth-context"

const PRIZE_LEVELS = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000]

export default function PlayPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { playCorrectSound, playIncorrectSound } = useSound()
  const { locale, translations: t, changeLocale } = useLocale()
  const { user, loading: authLoading } = useAuth()

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

  useEffect(() => {
    let timer: NodeJS.Timeout

    if (gameState === "playing" && timeLeft > 0 && !selectedAnswer) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
    } else if (timeLeft === 0 && !selectedAnswer) {
      handleGameOver()
    }

    return () => clearTimeout(timer)
  }, [timeLeft, gameState, selectedAnswer])

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

    setGameState("playing")
    setLevel(0)
    setLifelines({
      fiftyFifty: true,
      audience: true,
      phone: true,
    })
    setLoadError(null)
    setRetryCount(0)
    loadNextQuestion()
  }

  const loadNextQuestion = async () => {
    setLoading(true)
    setSelectedAnswer(null)
    setCorrectAnswer(null)
    setTimeLeft(30)
    setEliminatedOptions([])
    setAnswerAnimation("none")
    setLoadError(null)

    try {
      const question = await getRandomQuestion(level)
      setCurrentQuestion(question)
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

      // Reproducir sonido y mostrar animación
      if (isCorrect) {
        playCorrectSound()
        setAnswerAnimation("correct")
      } else {
        playIncorrectSound()
        setAnswerAnimation("incorrect")
      }

      // Esperar más tiempo para que el usuario vea la respuesta correcta
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
      }, 3000) // Aumentado a 3 segundos para dar más tiempo para ver la respuesta
    }, 1000)
  }

  const handleGameOver = async () => {
    const finalScore = PRIZE_LEVELS[level > 0 ? level - 1 : 0]

    // Si el usuario está autenticado, guardar la puntuación en Supabase
    if (user) {
      try {
        await saveScore(user.id, finalScore)
      } catch (error) {
        console.error("Error saving score to Supabase:", error)
        // Fallback a localStorage si falla Supabase
        await saveScoreToLocalStorage(username, finalScore)
      }
    } else {
      // Si no está autenticado, guardar en localStorage
      await saveScoreToLocalStorage(username, finalScore)
    }

    setGameState("finished")
  }

  const handleGameWin = async () => {
    const finalScore = PRIZE_LEVELS[PRIZE_LEVELS.length - 1]

    // Si el usuario está autenticado, guardar la puntuación en Supabase
    if (user) {
      try {
        await saveScore(user.id, finalScore)
      } catch (error) {
        console.error("Error saving score to Supabase:", error)
        // Fallback a localStorage si falla Supabase
        await saveScoreToLocalStorage(username, finalScore)
      }
    } else {
      // Si no está autenticado, guardar en localStorage
      await saveScoreToLocalStorage(username, finalScore)
    }

    setGameState("finished")
  }

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

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-900 to-indigo-950 p-4">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <LanguageSelector currentLocale={locale} onLocaleChange={changeLocale} />
          <WikimediaLoginButton t={t} />
        </div>
        <Card className="w-full max-w-md border-purple-700 bg-purple-900/70 text-white">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              {finalScore === PRIZE_LEVELS[PRIZE_LEVELS.length - 1] ? t.game.congratulations : t.game.gameOver}
            </CardTitle>
            <CardDescription className="text-center text-gray-300">
              {finalScore === PRIZE_LEVELS[PRIZE_LEVELS.length - 1]
                ? "¡Has ganado el premio máximo!"
                : `${t.game.finalScore}: ${finalScore.toLocaleString()} ${t.leaderboard.points}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <div className="rounded-full bg-yellow-500 p-6">
              <Award className="h-12 w-12 text-black" />
            </div>
            <p className="text-center text-gray-200">
              {finalScore === PRIZE_LEVELS[PRIZE_LEVELS.length - 1]
                ? "¡Increíble! Has respondido correctamente todas las preguntas y te has convertido en millonario virtual."
                : "Gracias por jugar. Tu puntuación ha sido registrada en la tabla de clasificación."}
            </p>
            {!user && finalScore > 0 && (
              <div className="mt-2 rounded-md bg-purple-800/50 p-3 text-center text-sm">
                <p className="text-yellow-400">
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
              className="w-full bg-yellow-500 text-black hover:bg-yellow-600"
            >
              {t.game.playAgain}
            </Button>
            <Button
              variant="outline"
              asChild
              className="w-full border-purple-700 text-gray-300 hover:bg-purple-800/50 hover:text-white"
            >
              <Link href="/leaderboard">
                <Award className="mr-2 h-4 w-4" />
                {t.game.viewLeaderboard}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-purple-900 to-indigo-950 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="text-gray-300 hover:text-white">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">
              <span className="text-yellow-400">Wiki</span>Millionaire
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={!lifelines.fiftyFifty}
                onClick={useFiftyFifty}
                className={`h-8 w-8 rounded-full ${!lifelines.fiftyFifty ? "opacity-50" : "border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"}`}
                title={t.game.lifelines.fiftyFifty}
              >
                50
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={!lifelines.audience}
                onClick={useAudienceHelp}
                className={`h-8 w-8 rounded-full ${!lifelines.audience ? "opacity-50" : "border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"}`}
                title={t.game.lifelines.audience}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
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
              <Button
                variant="outline"
                size="icon"
                disabled={!lifelines.phone}
                onClick={usePhoneAFriend}
                className={`h-8 w-8 rounded-full ${!lifelines.phone ? "opacity-50" : "border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"}`}
                title={t.game.lifelines.phone}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
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
            </div>
            <LanguageSelector currentLocale={locale} onLocaleChange={changeLocale} />
            <WikimediaLoginButton t={t} />
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
    </div>
  )
}
