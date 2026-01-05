<?php
/**
 * Game API Endpoint
 * 
 * Handles AJAX requests for the game workflow
 */

require_once __DIR__ . '/vendor/autoload.php';

use WikiMillionaire\Game\GameService;
use WikiMillionaire\Game\Language;

// Set JSON response header
header('Content-Type: application/json');

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Initialize language service
$languageService = new Language();

// Initialize game service
$gameService = new GameService();

// Get action from request
$action = $_GET['action'] ?? $_POST['action'] ?? null;

try {
    switch ($action) {
        case 'setLanguage':
            // Set interface language
            $language = $_POST['language'] ?? $_GET['language'] ?? 'en';
            $success = $languageService->setLanguage($language);
            if ($success) {
                echo json_encode(['success' => true, 'language' => $language]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Invalid language']);
            }
            break;
            
        case 'getLanguage':
            // Get current language
            echo json_encode([
                'success' => true, 
                'language' => $languageService->getCurrentLanguage(),
                'supportedLanguages' => Language::getSupportedLanguages()
            ]);
            break;
            
        case 'start':
            // Start new game
            $playerName = $_POST['playerName'] ?? 'Anonymous';
            $result = $gameService->startGame($playerName);
            echo json_encode(['success' => true, 'data' => $result]);
            break;
            
        case 'getState':
            // Get current game state
            $result = $gameService->getGameState();
            echo json_encode(['success' => true, 'data' => $result]);
            break;
            
        case 'getQuestion':
            // Get next question
            $result = $gameService->getNextQuestion();
            echo json_encode(['success' => true, 'data' => $result]);
            break;
            
        case 'checkAnswer':
            // Check answer
            $answer = $_POST['answer'] ?? '';
            $result = $gameService->checkAnswer($answer);
            echo json_encode(['success' => true, 'data' => $result]);
            break;
            
        case 'useFiftyFifty':
            // Use fifty-fifty lifeline
            $result = $gameService->useFiftyFifty();
            echo json_encode(['success' => true, 'data' => $result]);
            break;
            
        case 'quit':
            // Quit game
            $result = $gameService->quitGame();
            echo json_encode(['success' => true, 'data' => $result]);
            break;
            
        case 'getLeaderboard':
            // Get leaderboard
            $result = $gameService->getLeaderboard();
            echo json_encode(['success' => true, 'data' => $result]);
            break;
            
        default:
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
            break;
    }
} catch (\Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
