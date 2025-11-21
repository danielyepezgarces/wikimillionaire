<?php
/**
 * Answer API Controller
 */

declare(strict_types=1);

// Verify request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
}

// Get input
$answer = input('answer');
$questionId = input('questionId');

if (!$answer || !$questionId) {
    json_response(['error' => 'Missing answer or questionId'], 400);
}

// Get current question from session
$currentQuestion = $_SESSION['current_question'] ?? null;

if (!$currentQuestion) {
    json_response(['error' => 'No active question'], 400);
}

// Verify question ID matches
if ($currentQuestion['id'] !== $questionId) {
    json_response(['error' => 'Question mismatch'], 400);
}

// Check if answer is correct
$isCorrect = $answer === $currentQuestion['correctAnswer'];

// Clear current question from session
unset($_SESSION['current_question']);

json_response([
    'correct' => $isCorrect,
    'correctAnswer' => $currentQuestion['correctAnswer'],
]);
