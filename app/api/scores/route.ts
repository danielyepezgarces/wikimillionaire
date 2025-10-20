import { NextResponse } from "next/server"
import { saveScore, getLeaderboard } from "@/lib/scores"

// POST /api/scores - Save a score
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, score } = body

    if (!username || score === undefined) {
      return NextResponse.json(
        { error: "Username and score are required" },
        { status: 400 }
      )
    }

    const result = await saveScore(username, score)
    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error("Error saving score:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// GET /api/scores - Get leaderboard
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const period = (url.searchParams.get("period") as "daily" | "weekly" | "monthly" | "all") || "all"
    const limit = Number.parseInt(url.searchParams.get("limit") || "10", 10)

    const leaderboard = await getLeaderboard(period, limit)
    return NextResponse.json({ success: true, data: leaderboard })
  } catch (error: any) {
    console.error("Error fetching leaderboard:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
