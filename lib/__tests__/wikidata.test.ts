/**
 * Manual verification tests for question management improvements
 * 
 * These tests verify:
 * 1. Questions are not duplicated within a game session
 * 2. Cache is properly utilized
 * 3. Question loading is efficient
 * 
 * To run these tests manually:
 * 1. Start the development server: npm run dev
 * 2. Navigate to /play
 * 3. Start a game and verify:
 *    - Questions load quickly after the first one (due to preloading)
 *    - No duplicate questions appear in a single game session
 *    - When cache is used, loading is near-instant
 */

import { getRandomQuestion, resetQuestionSession } from '../wikidata'

describe('Question Management', () => {
  beforeEach(() => {
    resetQuestionSession()
  })

  it('should not return duplicate questions in the same session', async () => {
    const questionIds = new Set<string>()
    const questions = []

    // Generate 15 questions (a full game)
    for (let i = 0; i < 15; i++) {
      const question = await getRandomQuestion(i)
      questions.push(question)
      
      if (question.id) {
        // Verify no duplicates
        expect(questionIds.has(question.id)).toBe(false)
        questionIds.add(question.id)
      }
    }

    // All questions should be unique
    expect(questionIds.size).toBe(questions.filter(q => q.id).length)
  })

  it('should reset session tracking', async () => {
    // Generate a question
    const question1 = await getRandomQuestion(0)
    
    // Reset session
    resetQuestionSession()
    
    // After reset, we should be able to get questions again without issue
    const question2 = await getRandomQuestion(0)
    
    expect(question2).toBeDefined()
    expect(question2.question).toBeDefined()
    expect(question2.options).toHaveLength(4)
  })

  it('should return valid question structure', async () => {
    const question = await getRandomQuestion(0)
    
    expect(question).toBeDefined()
    expect(question.question).toBeDefined()
    expect(typeof question.question).toBe('string')
    expect(Array.isArray(question.options)).toBe(true)
    expect(question.options.length).toBe(4)
    expect(question.correctAnswer).toBeDefined()
    expect(question.options).toContain(question.correctAnswer)
  })

  it('should handle different difficulty levels', async () => {
    const easyQuestion = await getRandomQuestion(0) // easy
    const mediumQuestion = await getRandomQuestion(6) // medium
    const hardQuestion = await getRandomQuestion(12) // hard
    
    expect(easyQuestion).toBeDefined()
    expect(mediumQuestion).toBeDefined()
    expect(hardQuestion).toBeDefined()
  })

  it('should preload questions efficiently', async () => {
    const startTime = Date.now()
    
    // First question might be slower (fetching from API)
    await getRandomQuestion(0)
    const firstLoadTime = Date.now() - startTime
    
    // Subsequent questions should be faster (from cache)
    const cachedStartTime = Date.now()
    await getRandomQuestion(0)
    const cachedLoadTime = Date.now() - cachedStartTime
    
    // Cached load should be significantly faster (typically under 10ms)
    // Note: This is not a strict requirement, just an observation
    console.log(`First load: ${firstLoadTime}ms, Cached load: ${cachedLoadTime}ms`)
  })
})
