<?php
/**
 * Homepage - WikiMillionaire
 * 
 * Main landing page for the WikiMillionaire trivia game.
 * Displays game features, call-to-action buttons, and navigation.
 */

// Set page title
$pageTitle = 'WikiMillionaire - Test Your Knowledge';

// Set content template path
$contentTemplate = __DIR__ . '/templates/index.php';

// Render page using base layout
include __DIR__ . '/templates/layout.php';
