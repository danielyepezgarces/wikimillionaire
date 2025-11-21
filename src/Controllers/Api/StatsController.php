<?php
/**
 * Statistics API Controller
 */

declare(strict_types=1);

$db = Database::getInstance();

try {
    // Get overall statistics
    $totalUsers = $db->fetchOne("SELECT COUNT(*) as count FROM users")['count'] ?? 0;
    $totalGames = $db->fetchOne("SELECT COUNT(*) as count FROM scores")['count'] ?? 0;
    $highestScore = $db->fetchOne("SELECT MAX(score) as max FROM scores")['max'] ?? 0;
    $avgScore = $db->fetchOne("SELECT AVG(score) as avg FROM scores")['avg'] ?? 0;

    json_response([
        'stats' => [
            'totalUsers' => (int)$totalUsers,
            'totalGames' => (int)$totalGames,
            'highestScore' => (int)$highestScore,
            'averageScore' => (int)$avgScore,
        ],
    ]);
} catch (Exception $e) {
    error_log("Error fetching stats: " . $e->getMessage());
    json_response(['error' => 'Failed to fetch statistics'], 500);
}
