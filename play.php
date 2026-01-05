<?php
/**
 * Play Page - WikiMillionaire
 * 
 * User registration/login page before starting the game.
 * Collects player name and provides option to login with Wikidata.
 */

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Store a default player name in session so user can access game
// This will be updated when game actually starts
if (!isset($_SESSION['playerName'])) {
    $_SESSION['playerName'] = 'Guest';
}

// Generate a game access token to prevent direct access to game.php
$_SESSION['game_access_token'] = bin2hex(random_bytes(16));
$_SESSION['game_access_time'] = time();

// Set page title
$pageTitle = 'Play - WikiMillionaire';

// Set content template path
$contentTemplate = __DIR__ . '/templates/play.php';

// Render page using base layout
include __DIR__ . '/templates/layout.php';
