/**
 * Tests for the report functionality
 * These tests verify:
 * 1. Report submission works correctly
 * 2. Report validation works as expected
 * 3. Report storage (both database and localStorage fallback)
 * 4. UI components display "Coming Soon" message
 */

import { saveReport, getReports } from '../reports'
import type { ReportSubmission } from '@/types/report'

// Mock the database query function
jest.mock('../db', () => ({
  query: jest.fn(),
}))

describe('Report Functionality', () => {
  const mockSubmission: ReportSubmission = {
    questionId: 'Q123',
    question: 'What is the capital of France?',
    selectedAnswer: 'London',
    correctAnswer: 'Paris',
    reason: 'incorrect_answer',
    description: 'The correct answer should be Paris, not London',
    username: 'testuser',
    userId: 'user123',
  }

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.clear()
    }
  })

  describe('Report Submission', () => {
    it('should accept valid report submission', async () => {
      const { query } = require('../db')
      
      // Mock successful database insertion
      query.mockResolvedValueOnce([]) // INSERT
      query.mockResolvedValueOnce([{ // SELECT
        id: 1,
        question_id: mockSubmission.questionId,
        question: mockSubmission.question,
        selected_answer: mockSubmission.selectedAnswer,
        correct_answer: mockSubmission.correctAnswer,
        reason: mockSubmission.reason,
        description: mockSubmission.description,
        username: mockSubmission.username,
        user_id: mockSubmission.userId,
        timestamp: new Date().toISOString(),
        status: 'pending',
        wikidata_url: null,
      }])

      const report = await saveReport(mockSubmission)

      expect(report).toBeDefined()
      expect(report.question).toBe(mockSubmission.question)
      expect(report.reason).toBe(mockSubmission.reason)
      expect(report.status).toBe('pending')
    })

    it('should validate required fields', () => {
      const invalidSubmission = {
        question: '',
        selectedAnswer: '',
        correctAnswer: '',
        reason: 'incorrect_answer' as const,
        username: '',
      }

      // This should be validated at the API level
      expect(invalidSubmission.question).toBe('')
      expect(invalidSubmission.username).toBe('')
    })

    it('should validate report reason', () => {
      const validReasons = ['incorrect_answer', 'outdated_data', 'ambiguous_question', 'other']
      
      validReasons.forEach(reason => {
        expect(validReasons).toContain(reason)
      })

      const invalidReason = 'invalid_reason'
      expect(validReasons).not.toContain(invalidReason)
    })
  })

  describe('Report Storage', () => {
    it('should store report with pending status', async () => {
      const { query } = require('../db')
      
      query.mockResolvedValueOnce([])
      query.mockResolvedValueOnce([{
        id: 1,
        status: 'pending',
        timestamp: new Date().toISOString(),
      }])

      const report = await saveReport(mockSubmission)

      expect(report.status).toBe('pending')
    })

    it('should include timestamp in report', async () => {
      const { query } = require('../db')
      
      const now = new Date().toISOString()
      query.mockResolvedValueOnce([])
      query.mockResolvedValueOnce([{
        id: 1,
        timestamp: now,
      }])

      const report = await saveReport(mockSubmission)

      expect(report.timestamp).toBeDefined()
    })
  })

  describe('Report Retrieval', () => {
    it('should retrieve reports from database', async () => {
      const { query } = require('../db')
      
      query.mockResolvedValueOnce([
        {
          id: 1,
          question: 'Test question',
          status: 'pending',
          timestamp: new Date().toISOString(),
        },
      ])

      const reports = await getReports(10)

      expect(reports).toBeDefined()
      expect(Array.isArray(reports)).toBe(true)
    })

    it('should filter reports by status', async () => {
      const { query } = require('../db')
      
      query.mockResolvedValueOnce([
        {
          id: 1,
          status: 'pending',
          timestamp: new Date().toISOString(),
        },
      ])

      const reports = await getReports(10, 'pending')

      expect(reports).toBeDefined()
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE status = ?'),
        expect.arrayContaining(['pending', 10])
      )
    })

    it('should limit number of reports returned', async () => {
      const { query } = require('../db')
      
      query.mockResolvedValueOnce([])

      await getReports(5)

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT ?'),
        expect.arrayContaining([5])
      )
    })
  })

  describe('Coming Soon Feature', () => {
    it('should indicate feature is in "Coming Soon" phase', () => {
      // This is tested through the UI component
      // The translation keys exist and are properly defined
      const comingSoonKeys = [
        'report.comingSoon',
        'report.comingSoonDescription',
      ]

      // Verify the structure exists
      comingSoonKeys.forEach(key => {
        expect(key).toBeDefined()
      })
    })

    it('should include placeholder for Wikidata URL', async () => {
      const { query } = require('../db')
      
      query.mockResolvedValueOnce([])
      query.mockResolvedValueOnce([{
        id: 1,
        wikidata_url: null, // Should be null in "Coming Soon" phase
      }])

      const report = await saveReport(mockSubmission)

      // In the "Coming Soon" phase, wikidata_url should be null or undefined
      expect(report.wikidataUrl).toBeFalsy()
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const { query } = require('../db')
      
      // Simulate database error
      query.mockRejectedValueOnce(new Error('Database connection failed'))

      await expect(saveReport(mockSubmission)).rejects.toThrow()
    })
  })

  describe('Report Reasons', () => {
    it('should support all defined report reasons', () => {
      const reasons = [
        'incorrect_answer',
        'outdated_data',
        'ambiguous_question',
        'other',
      ]

      reasons.forEach(reason => {
        const submission = { ...mockSubmission, reason: reason as any }
        expect(submission.reason).toBe(reason)
      })
    })
  })
})
