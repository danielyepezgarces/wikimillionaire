<?php

namespace WikiMillionaire\Game;

/**
 * Game Service
 * 
 * Manages the game workflow including session state, scoring, and lifelines.
 */
class GameService
{
    private Wikidata $wikidata;
    private Language $language;
    
    private const PRIZE_LEVELS = [
        1 => 100,
        2 => 200,
        3 => 300,
        4 => 500,
        5 => 1000,
        6 => 2000,
        7 => 4000,
        8 => 8000,
        9 => 16000,
        10 => 32000,
        11 => 64000,
        12 => 125000,
        13 => 250000,
        14 => 500000,
        15 => 1000000
    ];
    
    private const SAFE_HAVENS = [5, 10]; // Guaranteed prize levels
    private const TIME_PER_QUESTION = 30; // seconds
    
    public function __construct()
    {
        // Ensure session is started
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Initialize language service
        $this->language = new Language();
        
        // Initialize Wikidata with current language
        $this->wikidata = new Wikidata($this->language->getCurrentLanguage());
    }
    
    /**
     * Start a new game
     * 
     * @param string $playerName Player's name
     * @return array Game state
     */
    public function startGame(string $playerName): array
    {
        $_SESSION['game'] = [
            'playerName' => $playerName,
            'level' => 1,
            'score' => 0,
            'lifelines' => [
                'fiftyFifty' => true,
                'phoneAFriend' => false, // Not implemented yet
                'askAudience' => false  // Not implemented yet
            ],
            'usedQuestions' => [],
            'startTime' => time()
        ];
        
        return $this->getGameState();
    }
    
    /**
     * Get current game state
     * 
     * @return array Game state
     */
    public function getGameState(): array
    {
        if (!isset($_SESSION['game'])) {
            return [
                'active' => false,
                'message' => 'No active game'
            ];
        }
        
        $game = $_SESSION['game'];
        
        return [
            'active' => true,
            'playerName' => $game['playerName'],
            'level' => $game['level'],
            'score' => $game['score'],
            'prize' => self::PRIZE_LEVELS[$game['level']] ?? 0,
            'lifelines' => $game['lifelines'],
            'maxLevel' => 15,
            'timePerQuestion' => self::TIME_PER_QUESTION
        ];
    }
    
    /**
     * Get next question
     * 
     * @return array Question data with metadata
     */
    public function getNextQuestion(): array
    {
        if (!isset($_SESSION['game'])) {
            throw new \Exception('No active game');
        }
        
        $level = $_SESSION['game']['level'];
        
        if ($level > 15) {
            throw new \Exception('Game completed');
        }
        
        // Get question from Wikidata
        $question = $this->wikidata->getRandomQuestion($level);
        
        // Store current question in session for answer validation
        $_SESSION['currentQuestion'] = [
            'question' => $question,
            'startTime' => time()
        ];
        
        // Track used question
        if (isset($question['id'])) {
            $_SESSION['game']['usedQuestions'][] = $question['id'];
        }
        
        return [
            'question' => $question['question'],
            'options' => $question['options'],
            'image' => $question['image'] ?? null,
            'level' => $level,
            'prize' => self::PRIZE_LEVELS[$level],
            'timeRemaining' => self::TIME_PER_QUESTION
        ];
    }
    
    /**
     * Check answer and update game state
     * 
     * @param string $answer Player's answer
     * @return array Result with correct/incorrect, new level, score, etc.
     */
    public function checkAnswer(string $answer): array
    {
        if (!isset($_SESSION['game'])) {
            throw new \Exception('No active game');
        }
        
        if (!isset($_SESSION['currentQuestion'])) {
            throw new \Exception('No current question');
        }
        
        $currentQuestion = $_SESSION['currentQuestion'];
        $correctAnswer = $currentQuestion['question']['correctAnswer'];
        $timeElapsed = time() - $currentQuestion['startTime'];
        
        // Check if time expired
        if ($timeElapsed > self::TIME_PER_QUESTION) {
            return $this->handleIncorrectAnswer('Time expired');
        }
        
        // Check if answer is correct
        $isCorrect = ($answer === $correctAnswer);
        
        if ($isCorrect) {
            return $this->handleCorrectAnswer();
        } else {
            return $this->handleIncorrectAnswer('Incorrect answer');
        }
    }
    
    /**
     * Handle correct answer
     */
    private function handleCorrectAnswer(): array
    {
        $currentLevel = $_SESSION['game']['level'];
        $currentPrize = self::PRIZE_LEVELS[$currentLevel];
        
        // Update score
        $_SESSION['game']['score'] = $currentPrize;
        
        // Check if game is won
        if ($currentLevel >= 15) {
            $result = [
                'correct' => true,
                'gameWon' => true,
                'finalScore' => $currentPrize,
                'level' => $currentLevel,
                'message' => $this->language->get('msg_congratulations')
            ];
            
            $this->endGame($currentPrize);
            return $result;
        }
        
        // Advance to next level
        $_SESSION['game']['level']++;
        
        // Clear current question
        unset($_SESSION['currentQuestion']);
        
        return [
            'correct' => true,
            'gameWon' => false,
            'level' => $_SESSION['game']['level'],
            'score' => $currentPrize,
            'nextPrize' => self::PRIZE_LEVELS[$_SESSION['game']['level']],
            'message' => $this->language->get('msg_correct')
        ];
    }
    
    /**
     * Handle incorrect answer
     */
    private function handleIncorrectAnswer(string $reason): array
    {
        $currentLevel = $_SESSION['game']['level'];
        
        // Determine final score based on safe havens
        $finalScore = 0;
        foreach (self::SAFE_HAVENS as $haven) {
            if ($currentLevel > $haven) {
                $finalScore = self::PRIZE_LEVELS[$haven];
            }
        }
        
        $correctAnswer = $_SESSION['currentQuestion']['question']['correctAnswer'];
        
        $result = [
            'correct' => false,
            'gameOver' => true,
            'finalScore' => $finalScore,
            'level' => $currentLevel,
            'correctAnswer' => $correctAnswer,
            'message' => $reason
        ];
        
        $this->endGame($finalScore);
        
        return $result;
    }
    
    /**
     * Use fifty-fifty lifeline
     * 
     * @return array Modified options with two incorrect answers removed
     */
    public function useFiftyFifty(): array
    {
        if (!isset($_SESSION['game'])) {
            throw new \Exception($this->language->get('error_no_active_game'));
        }
        
        if (!isset($_SESSION['currentQuestion'])) {
            throw new \Exception($this->language->get('error_no_current_question'));
        }
        
        if (!$_SESSION['game']['lifelines']['fiftyFifty']) {
            throw new \Exception($this->language->get('msg_fifty_fifty_already_used'));
        }
        
        // Mark lifeline as used
        $_SESSION['game']['lifelines']['fiftyFifty'] = false;
        
        $question = $_SESSION['currentQuestion']['question'];
        $correctAnswer = $question['correctAnswer'];
        $options = $question['options'];
        
        // Keep correct answer and one random incorrect answer
        $incorrectOptions = array_filter($options, fn($opt) => $opt !== $correctAnswer);
        $incorrectOptions = array_values($incorrectOptions);
        shuffle($incorrectOptions);
        
        $remainingOptions = [$correctAnswer, $incorrectOptions[0]];
        shuffle($remainingOptions);
        
        // Update current question with modified options
        $_SESSION['currentQuestion']['question']['options'] = $remainingOptions;
        
        return [
            'success' => true,
            'options' => $remainingOptions,
            'message' => $this->language->get('msg_fifty_fifty_used')
        ];
    }
    
    /**
     * Quit game with current winnings
     * 
     * @return array Final game result
     */
    public function quitGame(): array
    {
        if (!isset($_SESSION['game'])) {
            throw new \Exception('No active game');
        }
        
        $finalScore = $_SESSION['game']['score'];
        $level = $_SESSION['game']['level'];
        
        $result = [
            'quit' => true,
            'finalScore' => $finalScore,
            'level' => $level,
            'message' => 'You quit with ' . number_format($finalScore) . ' points!'
        ];
        
        $this->endGame($finalScore);
        
        return $result;
    }
    
    /**
     * End game and save score
     */
    private function endGame(int $finalScore): void
    {
        if (!isset($_SESSION['game'])) {
            return;
        }
        
        $playerName = $_SESSION['game']['playerName'];
        $level = $_SESSION['game']['level'];
        
        // Save to leaderboard (could be database in production)
        $this->saveToLeaderboard($playerName, $finalScore, $level);
        
        // Clear game session
        unset($_SESSION['game']);
        unset($_SESSION['currentQuestion']);
    }
    
    /**
     * Save score to leaderboard
     * 
     * Currently saves to session, but could be database in production
     */
    private function saveToLeaderboard(string $playerName, int $score, int $level): void
    {
        if (!isset($_SESSION['leaderboard'])) {
            $_SESSION['leaderboard'] = [];
        }
        
        $_SESSION['leaderboard'][] = [
            'playerName' => $playerName,
            'score' => $score,
            'level' => $level,
            'date' => date('Y-m-d H:i:s')
        ];
        
        // Sort by score descending
        usort($_SESSION['leaderboard'], function($a, $b) {
            return $b['score'] - $a['score'];
        });
        
        // Keep only top 10
        $_SESSION['leaderboard'] = array_slice($_SESSION['leaderboard'], 0, 10);
    }
    
    /**
     * Get leaderboard
     * 
     * @return array Top scores
     */
    public function getLeaderboard(): array
    {
        return $_SESSION['leaderboard'] ?? [];
    }
}
