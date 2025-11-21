<?php
/**
 * Question API Controller
 */

declare(strict_types=1);

// Get level from request
$level = (int)input('level', 1);

// Validate level
if ($level < 1 || $level > 15) {
    json_response(['error' => 'Invalid level'], 400);
}

// Get question from Wikidata
try {
    $question = Wikidata::getRandomQuestion($level);
    
    // Store question in session for answer validation
    $_SESSION['current_question'] = $question;
    
    json_response([
        'question' => $question['question'],
        'options' => $question['options'],
        'level' => $level,
        'id' => $question['id'],
    ]);
} catch (Exception $e) {
    error_log("Error getting question: " . $e->getMessage());
    json_response(['error' => 'Failed to generate question'], 500);
}
