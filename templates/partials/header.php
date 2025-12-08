<?php
/**
 * Header Partial Template
 * 
 * Includes the HTML head section with Tailwind CSS CDN and opens the body tag.
 * This template ensures consistent styling across all pages.
 * 
 * @param string $pageTitle - The title of the page (optional, defaults to "WikiMillionaire")
 */

$pageTitle = $pageTitle ?? 'WikiMillionaire';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="WikiMillionaire - Test your knowledge with our Who Wants to Be a Millionaire style quiz game using real data from Wikidata">
    <title><?php echo htmlspecialchars($pageTitle); ?></title>
    
    <!-- Tailwind CSS CDN -->
    <!-- Note: For production use, consider using the Tailwind CLI to generate a local CSS file
         or add SRI (Subresource Integrity) hash for CDN security. The CDN approach is used 
         here for rapid development and ease of setup. -->
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="antialiased">
