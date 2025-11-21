<?php
/**
 * Answer Reports API Controller
 */

declare(strict_types=1);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
}

$questionId = input('questionId');
$reason = input('reason');

if (!$questionId || !$reason) {
    json_response(['error' => 'Missing questionId or reason'], 400);
}

$db = Database::getInstance();
$reportedBy = Auth::check() ? Auth::id() : null;

try {
    $db->insert('answer_reports', [
        'question_id' => $questionId,
        'reported_by' => $reportedBy,
        'reason' => $reason,
        'status' => 'pending',
        'created_at' => now(),
    ]);

    json_response(['success' => true, 'message' => 'Report submitted successfully']);
} catch (Exception $e) {
    error_log("Error submitting report: " . $e->getMessage());
    json_response(['error' => 'Failed to submit report'], 500);
}
