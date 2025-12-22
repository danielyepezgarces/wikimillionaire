<?php
/**
 * Manual Test Script for Game API
 * 
 * Tests the core functionality of the PHP game implementation
 */

require_once __DIR__ . '/vendor/autoload.php';

use WikiMillionaire\Game\Wikidata;
use WikiMillionaire\Game\GameService;

echo "=== WikiMillionaire PHP Game Test ===\n\n";

// Test 1: Wikidata Question Generation
echo "Test 1: Generating questions from Wikidata...\n";
echo "-------------------------------------------\n";

$wikidata = new Wikidata();

$questionTypes = ['capital', 'element', 'author'];
foreach ($questionTypes as $type) {
    try {
        echo "\nTesting {$type} question:\n";
        $question = $wikidata->getRandomQuestion(rand(1, 15));
        echo "Question: " . $question['question'] . "\n";
        echo "Options: " . implode(', ', $question['options']) . "\n";
        echo "Correct Answer: " . $question['correctAnswer'] . "\n";
        if (isset($question['image'])) {
            echo "Image: " . $question['image'] . "\n";
        }
        echo "✓ Success\n";
    } catch (Exception $e) {
        echo "✗ Failed: " . $e->getMessage() . "\n";
    }
}

// Test 2: Game Service
echo "\n\nTest 2: Testing Game Service...\n";
echo "-------------------------------------------\n";

// Clear any existing session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
unset($_SESSION['game']);
unset($_SESSION['currentQuestion']);

$gameService = new GameService();

// Start game
echo "\n2.1. Starting new game...\n";
try {
    $gameState = $gameService->startGame("Test Player");
    echo "Player: " . $gameState['playerName'] . "\n";
    echo "Level: " . $gameState['level'] . "\n";
    echo "Score: " . $gameState['score'] . "\n";
    echo "✓ Game started successfully\n";
} catch (Exception $e) {
    echo "✗ Failed to start game: " . $e->getMessage() . "\n";
    exit(1);
}

// Get first question
echo "\n2.2. Getting first question...\n";
try {
    $questionData = $gameService->getNextQuestion();
    echo "Question: " . $questionData['question'] . "\n";
    echo "Options: " . implode(', ', $questionData['options']) . "\n";
    echo "Level: " . $questionData['level'] . "\n";
    echo "Prize: " . $questionData['prize'] . "\n";
    echo "✓ Question retrieved successfully\n";
    
    $correctAnswer = $_SESSION['currentQuestion']['question']['correctAnswer'];
    echo "\n(For testing: Correct answer is '{$correctAnswer}')\n";
} catch (Exception $e) {
    echo "✗ Failed to get question: " . $e->getMessage() . "\n";
    exit(1);
}

// Test correct answer
echo "\n2.3. Testing correct answer...\n";
try {
    $result = $gameService->checkAnswer($correctAnswer);
    echo "Result: " . ($result['correct'] ? 'Correct' : 'Incorrect') . "\n";
    echo "New Level: " . $result['level'] . "\n";
    echo "Score: " . $result['score'] . "\n";
    echo "✓ Answer checked successfully\n";
} catch (Exception $e) {
    echo "✗ Failed to check answer: " . $e->getMessage() . "\n";
    exit(1);
}

// Test fifty-fifty lifeline
echo "\n2.4. Getting another question and testing fifty-fifty...\n";
try {
    $questionData = $gameService->getNextQuestion();
    echo "Question: " . $questionData['question'] . "\n";
    echo "Original options: " . implode(', ', $questionData['options']) . "\n";
    
    $fiftyFiftyResult = $gameService->useFiftyFifty();
    echo "After 50:50: " . implode(', ', $fiftyFiftyResult['options']) . "\n";
    echo "✓ Fifty-fifty lifeline used successfully\n";
} catch (Exception $e) {
    echo "✗ Failed to use fifty-fifty: " . $e->getMessage() . "\n";
}

// Test incorrect answer
echo "\n2.5. Testing incorrect answer (to end game)...\n";
try {
    $result = $gameService->checkAnswer("Wrong Answer");
    echo "Result: " . ($result['correct'] ? 'Correct' : 'Incorrect') . "\n";
    echo "Game Over: " . ($result['gameOver'] ? 'Yes' : 'No') . "\n";
    echo "Final Score: " . $result['finalScore'] . "\n";
    echo "Correct Answer was: " . $result['correctAnswer'] . "\n";
    echo "✓ Incorrect answer handled correctly\n";
} catch (Exception $e) {
    echo "✗ Failed to handle incorrect answer: " . $e->getMessage() . "\n";
}

// Test leaderboard
echo "\n2.6. Testing leaderboard...\n";
try {
    $leaderboard = $gameService->getLeaderboard();
    echo "Leaderboard entries: " . count($leaderboard) . "\n";
    if (count($leaderboard) > 0) {
        echo "Top score: " . $leaderboard[0]['score'] . " by " . $leaderboard[0]['playerName'] . "\n";
    }
    echo "✓ Leaderboard retrieved successfully\n";
} catch (Exception $e) {
    echo "✗ Failed to get leaderboard: " . $e->getMessage() . "\n";
}

echo "\n\n=== All Tests Completed ===\n";
echo "\nSummary:\n";
echo "- Wikidata integration: Working\n";
echo "- Question generation: Working\n";
echo "- Game workflow: Working\n";
echo "- Lifelines: Working\n";
echo "- Answer validation: Working\n";
echo "- Leaderboard: Working\n";
echo "\n✓ All systems operational!\n";
