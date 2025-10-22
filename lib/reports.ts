import { query } from "@/lib/db"
import type { AnswerReport, ReportSubmission } from "@/types/report"

/**
 * Save a report to the database
 * This function handles the storage of user-reported incorrect answers
 * In the future, this will integrate with Wikidata to create actual reports
 */
export async function saveReport(submission: ReportSubmission): Promise<AnswerReport> {
  try {
    const timestamp = new Date().toISOString()
    
    // Insert the report into the database
    await query(
      `INSERT INTO answer_reports 
       (question_id, question, selected_answer, correct_answer, reason, description, username, user_id, timestamp, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        submission.questionId || null,
        submission.question,
        submission.selectedAnswer,
        submission.correctAnswer,
        submission.reason,
        submission.description || null,
        submission.username,
        submission.userId || null,
        timestamp,
        "pending",
      ]
    )

    // Get the inserted report
    const result = await query(
      `SELECT * FROM answer_reports WHERE username = ? AND timestamp = ? ORDER BY id DESC LIMIT 1`,
      [submission.username, timestamp]
    )

    const report = result[0] as any

    return {
      id: report.id?.toString(),
      questionId: report.question_id,
      question: report.question,
      selectedAnswer: report.selected_answer,
      correctAnswer: report.correct_answer,
      reason: report.reason,
      description: report.description,
      username: report.username,
      userId: report.user_id,
      timestamp: report.timestamp,
      status: report.status,
      wikidataUrl: report.wikidata_url,
    }
  } catch (error) {
    console.error("Error saving report:", error)
    // Fallback to localStorage if database fails
    if (typeof window !== "undefined") {
      saveReportToLocalStorage(submission)
    }
    throw error
  }
}

/**
 * Get reports from the database
 * @param limit Number of reports to retrieve
 * @param status Filter by status (optional)
 */
export async function getReports(
  limit = 50,
  status: "pending" | "reviewed" | "resolved" | "rejected" | null = null
): Promise<AnswerReport[]> {
  try {
    let queryText = `SELECT * FROM answer_reports`
    const params: any[] = []

    if (status) {
      queryText += ` WHERE status = ?`
      params.push(status)
    }

    queryText += ` ORDER BY timestamp DESC LIMIT ?`
    params.push(limit)

    const results = await query(queryText, params)

    return results.map((row: any) => ({
      id: row.id?.toString(),
      questionId: row.question_id,
      question: row.question,
      selectedAnswer: row.selected_answer,
      correctAnswer: row.correct_answer,
      reason: row.reason,
      description: row.description,
      username: row.username,
      userId: row.user_id,
      timestamp: row.timestamp,
      status: row.status,
      wikidataUrl: row.wikidata_url,
    }))
  } catch (error) {
    console.error("Error fetching reports:", error)
    // Fallback to localStorage if database fails
    if (typeof window !== "undefined") {
      return getReportsFromLocalStorage(limit)
    }
    throw error
  }
}

/**
 * Save report to localStorage as fallback
 * This ensures reports are not lost even if the database is unavailable
 */
function saveReportToLocalStorage(submission: ReportSubmission): void {
  try {
    const reportsJson = localStorage.getItem("wikimillionaire-reports")
    const reports = reportsJson ? JSON.parse(reportsJson) : []

    const report: AnswerReport = {
      ...submission,
      timestamp: new Date().toISOString(),
      status: "pending",
    }

    reports.push(report)
    localStorage.setItem("wikimillionaire-reports", JSON.stringify(reports))
  } catch (error) {
    console.error("Error saving report to localStorage:", error)
  }
}

/**
 * Get reports from localStorage
 */
function getReportsFromLocalStorage(limit = 50): AnswerReport[] {
  try {
    const reportsJson = localStorage.getItem("wikimillionaire-reports")
    if (!reportsJson) return []

    const reports = JSON.parse(reportsJson) as AnswerReport[]
    return reports.slice(0, limit)
  } catch (error) {
    console.error("Error getting reports from localStorage:", error)
    return []
  }
}

/**
 * Generate Wikidata report URL
 * This is a placeholder for future Wikidata integration
 * When implemented, this will create an actual report on Wikidata
 */
export function generateWikidataReportUrl(report: AnswerReport): string {
  // TODO: Implement actual Wikidata report creation
  // This would involve creating a report on Wikidata's feedback system
  // For now, return a placeholder URL to the Wikidata project page
  const params = new URLSearchParams({
    title: "Wikidata:Project_chat",
    section: "new",
    preload: "Template:Dispute",
    summary: `Report: Incorrect answer in WikiMillionaire game`,
  })
  
  return `https://www.wikidata.org/w/index.php?${params.toString()}`
}
