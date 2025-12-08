<?php
/**
 * Base Layout Template
 * 
 * This is the main layout wrapper that includes the header and footer partials.
 * All page templates should be rendered within this layout for consistency.
 * 
 * Usage:
 *   - Set $pageTitle before including this file (optional)
 *   - Set $contentTemplate to the path of the content template to render
 * 
 * Example:
 *   $pageTitle = 'Home - WikiMillionaire';
 *   $contentTemplate = __DIR__ . '/index.php';
 *   include __DIR__ . '/templates/layout.php';
 */

// Ensure content template is specified
if (!isset($contentTemplate)) {
    die('Error: Content template not specified');
}

// Include header partial
include __DIR__ . '/partials/header.php';

// Include the content template
if (file_exists($contentTemplate)) {
    include $contentTemplate;
} else {
    // Generic error message without exposing file paths
    echo '<div class="p-4 text-red-500">Error: Page not found. Please try again.</div>';
}

// Include footer partial
include __DIR__ . '/partials/footer.php';
