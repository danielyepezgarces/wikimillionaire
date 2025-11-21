<?php
/**
 * Scores API Controller
 */

declare(strict_types=1);

$db = Database::getInstance();

// Handle POST - Submit score
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $score = (int)input('score', 0);
    $level = (int)input('level', 0);
    
    if (!Auth::check()) {
        json_response(['error' => 'Unauthorized'], 401);
    }
    
    $userId = Auth::id();
    
    try {
        // Insert score
        $db->insert('scores', [
            'user_id' => $userId,
            'score' => $score,
            'level_reached' => $level,
            'created_at' => now(),
        ]);
        
        json_response(['success' => true]);
    } catch (Exception $e) {
        error_log("Error saving score: " . $e->getMessage());
        json_response(['error' => 'Failed to save score'], 500);
    }
}

// Handle GET - Get scores
$limit = min((int)input('limit', 10), 100);
$userId = input('userId');

try {
    $sql = "SELECT s.*, u.username, u.avatar_url 
            FROM scores s 
            JOIN users u ON s.user_id = u.id ";
    
    if ($userId) {
        $sql .= "WHERE s.user_id = ? ";
        $params = [$userId];
    } else {
        $params = [];
    }
    
    $sql .= "ORDER BY s.score DESC, s.created_at DESC LIMIT ?";
    $params[] = $limit;
    
    $scores = $db->fetchAll($sql, $params);
    
    json_response(['scores' => $scores]);
} catch (Exception $e) {
    error_log("Error fetching scores: " . $e->getMessage());
    json_response(['error' => 'Failed to fetch scores'], 500);
}
