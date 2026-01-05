<?php
/**
 * Homepage - WikiMillionaire
 * 
 * Main landing page for the WikiMillionaire trivia game.
 * Displays game features, call-to-action buttons, and navigation.
 */

// Load helpers for translation
require_once __DIR__ . '/templates/helpers.php';

// Set page title
$pageTitle = t('home_title');

// Set content template path
$contentTemplate = __DIR__ . '/templates/index.php';

// Render page using base layout
include __DIR__ . '/templates/layout.php';
