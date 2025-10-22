import { NextResponse } from "next/server"
import { saveReport, getReports } from "@/lib/reports"

// POST /api/reports - Submit a new report
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { questionId, question, selectedAnswer, correctAnswer, reason, description, username, userId } = body

    // Validate required fields
    if (!question || !selectedAnswer || !correctAnswer || !reason || !username) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate reason
    const validReasons = ["incorrect_answer", "outdated_data", "ambiguous_question", "other"]
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: "Invalid report reason" },
        { status: 400 }
      )
    }

    const report = await saveReport({
      questionId,
      question,
      selectedAnswer,
      correctAnswer,
      reason,
      description,
      username,
      userId,
    })

    return NextResponse.json({
      success: true,
      data: report,
      message: "Report submitted successfully. Thank you for helping improve the game!",
    })
  } catch (error: any) {
    console.error("Error saving report:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// GET /api/reports - Get reports (for admin/future use)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const limit = Number.parseInt(url.searchParams.get("limit") || "50", 10)
    const status = url.searchParams.get("status") as "pending" | "reviewed" | "resolved" | "rejected" | null

    const reports = await getReports(limit, status)
    return NextResponse.json({ success: true, data: reports })
  } catch (error: any) {
    console.error("Error fetching reports:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
