<?php
/**
 * Play Page - WikiMillionaire
 * 
 * User registration/login page before starting the game.
 * Collects player name and provides option to login with Wikidata.
 */

// Set page title
$pageTitle = 'Play - WikiMillionaire';

// Set content template path
$contentTemplate = __DIR__ . '/templates/play.php';

// Render page using base layout
include __DIR__ . '/templates/layout.php';
