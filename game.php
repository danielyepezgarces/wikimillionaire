<?php
/**
 * Game Play Page - WikiMillionaire
 * 
 * Interactive game page using PHP backend for questions and game logic.
 */

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check if player has come from play.php
// If no player name in session and no recent game, redirect to play.php
if (!isset($_SESSION['playerName']) && !isset($_SESSION['game'])) {
    header('Location: play.php');
    exit();
}

// Set page title
$pageTitle = 'Play Game - WikiMillionaire';

// Set content template path
$contentTemplate = __DIR__ . '/templates/game.php';

// Render page using base layout
include __DIR__ . '/templates/layout.php';
