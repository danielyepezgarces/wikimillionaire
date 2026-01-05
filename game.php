<?php
/**
 * Game Play Page - WikiMillionaire
 * 
 * Interactive game page using PHP backend for questions and game logic.
 * Access control: Only accessible when navigated from play.php
 */

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Access control: Check if user came from play.php
// Verify game access token and that it was generated recently (within last hour)
$hasValidToken = isset($_SESSION['game_access_token']) && 
                  isset($_SESSION['game_access_time']) &&
                  (time() - $_SESSION['game_access_time']) < 3600;

$hasPlayerName = isset($_SESSION['playerName']);
$hasActiveGame = isset($_SESSION['game']);

// If no valid token and no active game, redirect to play.php
if (!$hasValidToken && !$hasActiveGame) {
    header('Location: play.php');
    exit();
}

// If player name is not set, redirect to play.php
if (!$hasPlayerName) {
    header('Location: play.php');
    exit();
}

// Set page title
$pageTitle = 'Play Game - WikiMillionaire';

// Set content template path
$contentTemplate = __DIR__ . '/templates/game.php';

// Render page using base layout
include __DIR__ . '/templates/layout.php';
