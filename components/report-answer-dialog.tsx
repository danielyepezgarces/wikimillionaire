"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircle, Flag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { ReportReason } from "@/types/report"

interface GameQuestion {
  question: string
  id?: string
  correctAnswer: string
  userAnswer: string
  wasCorrect: boolean
  level: number
}

interface ReportAnswerDialogProps {
  isOpen: boolean
  onClose: () => void
  questions: GameQuestion[]
  username: string
  userId?: string
  translations: any
}

export function ReportAnswerDialog({
  isOpen,
  onClose,
  questions,
  username,
  userId,
  translations: t,
}: ReportAnswerDialogProps) {
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0)
  const [reason, setReason] = useState<ReportReason>("incorrect_answer")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const selectedQuestion = questions[selectedQuestionIndex]

  const handleSubmit = async () => {
    if (!selectedQuestion) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: selectedQuestion.id,
          question: selectedQuestion.question,
          selectedAnswer: selectedQuestion.userAnswer,
          correctAnswer: selectedQuestion.correctAnswer,
          reason,
          description: description.trim() || undefined,
          username,
          userId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit report")
      }

      toast({
        title: t.report.success.title,
        description: t.report.success.description,
      })

      // Reset form and close dialog
      setDescription("")
      setReason("incorrect_answer")
      onClose()
    } catch (error) {
      console.error("Error submitting report:", error)
      toast({
        title: t.report.error.title,
        description: t.report.error.description,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            {t.report.title}
          </DialogTitle>
          <DialogDescription>{t.report.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Coming Soon Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t.report.comingSoon}</AlertTitle>
            <AlertDescription>{t.report.comingSoonDescription}</AlertDescription>
          </Alert>

          {/* Question Selection - Only show if multiple questions */}
          {questions.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="question-select">{t.report.form.selectQuestion || "Seleccionar pregunta"}</Label>
              <Select 
                value={selectedQuestionIndex.toString()} 
                onValueChange={(value) => setSelectedQuestionIndex(parseInt(value))}
              >
                <SelectTrigger id="question-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {questions.map((q, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {t.game?.level || "Nivel"} {q.level}: {q.question.substring(0, 50)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Question */}
          {selectedQuestion && (
            <>
              <div className="space-y-2">
                <Label>{t.report.form.question}</Label>
                <div className="rounded-md border p-3 bg-muted/50 text-sm">{selectedQuestion.question}</div>
              </div>

              {/* Selected Answer */}
              <div className="space-y-2">
                <Label>{t.report.form.selectedAnswer}</Label>
                <div className={`rounded-md border p-3 text-sm ${
                  selectedQuestion.wasCorrect ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'
                }`}>
                  {selectedQuestion.userAnswer}
                </div>
              </div>

              {/* Correct Answer */}
              <div className="space-y-2">
                <Label>{t.report.form.correctAnswer}</Label>
                <div className="rounded-md border p-3 bg-green-500/10 border-green-500 text-sm">
                  {selectedQuestion.correctAnswer}
                </div>
              </div>
            </>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">{t.report.form.reason}</Label>
            <Select value={reason} onValueChange={(value) => setReason(value as ReportReason)}>
              <SelectTrigger id="reason">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="incorrect_answer">{t.report.reasons.incorrect_answer}</SelectItem>
                <SelectItem value="outdated_data">{t.report.reasons.outdated_data}</SelectItem>
                <SelectItem value="ambiguous_question">{t.report.reasons.ambiguous_question}</SelectItem>
                <SelectItem value="other">{t.report.reasons.other}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t.report.form.description}</Label>
            <Textarea
              id="description"
              placeholder={t.report.form.descriptionPlaceholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t.report.form.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? t.general.loading : t.report.form.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
