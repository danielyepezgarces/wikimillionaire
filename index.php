<?php
/**
 * WikiMillionaire - PHP 8.4 Entry Point
 * No external libraries - Pure PHP implementation
 */

declare(strict_types=1);

// Start session
session_start();

// Define base paths
define('BASE_PATH', __DIR__);
define('PUBLIC_PATH', __DIR__);
define('CONFIG_PATH', BASE_PATH . '/config');
define('SRC_PATH', BASE_PATH . '/src');
define('LIB_PATH', BASE_PATH . '/lib');

// Auto-require files
require_once LIB_PATH . '/helpers.php';
require_once LIB_PATH . '/router.php';
require_once LIB_PATH . '/database.php';
require_once LIB_PATH . '/auth.php';

// Initialize database connection
$db = Database::getInstance();

// Get request URI and method
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Remove base path if the app is in a subdirectory
$basePath = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
if ($basePath && str_starts_with($requestUri, $basePath)) {
    $requestUri = substr($requestUri, strlen($basePath));
}

// Initialize router
$router = new Router();

// Define routes
// Home page
$router->get('/', fn() => require SRC_PATH . '/Controllers/HomeController.php');

// Game routes
$router->get('/play', fn() => require SRC_PATH . '/Controllers/PlayController.php');

// Leaderboard
$router->get('/leaderboard', fn() => require SRC_PATH . '/Controllers/LeaderboardController.php');

// Profile
$router->get('/profile', fn() => require SRC_PATH . '/Controllers/ProfileController.php');

// Multiplayer
$router->get('/multiplayer', fn() => require SRC_PATH . '/Controllers/MultiplayerController.php');

// API routes
$router->get('/api/question', fn() => require SRC_PATH . '/Controllers/Api/QuestionController.php');
$router->post('/api/answer', fn() => require SRC_PATH . '/Controllers/Api/AnswerController.php');
$router->get('/api/scores', fn() => require SRC_PATH . '/Controllers/Api/ScoresController.php');
$router->post('/api/scores', fn() => require SRC_PATH . '/Controllers/Api/ScoresController.php');
$router->get('/api/stats', fn() => require SRC_PATH . '/Controllers/Api/StatsController.php');

// Auth routes
$router->get('/api/auth/login', fn() => require SRC_PATH . '/Controllers/Api/Auth/LoginController.php');
$router->get('/api/auth/callback', fn() => require SRC_PATH . '/Controllers/Api/Auth/CallbackController.php');
$router->get('/api/auth/logout', fn() => require SRC_PATH . '/Controllers/Api/Auth/LogoutController.php');
$router->get('/api/auth/me', fn() => require SRC_PATH . '/Controllers/Api/Auth/UserController.php');

// Report routes
$router->post('/api/reports', fn() => require SRC_PATH . '/Controllers/Api/ReportsController.php');

// Dispatch the route
try {
    $router->dispatch($requestUri, $requestMethod);
} catch (Exception $e) {
    http_response_code(500);
    if (getenv('APP_DEBUG') === 'true') {
        echo json_encode(['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
    } else {
        echo json_encode(['error' => 'Internal Server Error']);
    }
}
