/**
 * Types for the report feature
 * This allows users to report incorrect answers in the game
 */

export type ReportReason = 
  | "incorrect_answer"
  | "outdated_data"
  | "ambiguous_question"
  | "other"

export type ReportStatus = 
  | "pending"
  | "reviewed"
  | "resolved"
  | "rejected"

export interface AnswerReport {
  id?: string
  questionId?: string
  question: string
  selectedAnswer: string
  correctAnswer: string
  reason: ReportReason
  description?: string
  username: string
  userId?: string
  timestamp: string
  status: ReportStatus
  wikidataUrl?: string // URL to Wikidata report page (for future implementation)
}

export interface ReportSubmission {
  questionId?: string
  question: string
  selectedAnswer: string
  correctAnswer: string
  reason: ReportReason
  description?: string
  username: string
  userId?: string
}
