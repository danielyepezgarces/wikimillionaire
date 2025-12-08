<?php
/**
 * Leaderboard Page - WikiMillionaire
 * 
 * Displays rankings and scores for daily, weekly, monthly, and all-time leaderboards.
 * Players can compete for top positions and track their progress.
 */

// Set page title
$pageTitle = 'Leaderboard - WikiMillionaire';

// Set content template path
$contentTemplate = __DIR__ . '/templates/leaderboard.php';

// Render page using base layout
include __DIR__ . '/templates/layout.php';
