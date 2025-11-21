<?php
/**
 * Play Game Controller
 */

declare(strict_types=1);

$pageTitle = 'Jugar - WikiMillionaire';
$user = Auth::user();

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= e($pageTitle) ?></title>
    <link rel="stylesheet" href="<?= url('css/style.css') ?>">
</head>
<body>
    <div class="game-container">
        <header class="game-header">
            <div class="container">
                <a href="<?= url('/') ?>" class="logo-link">
                    <span class="logo-wiki">Wiki</span><span class="logo-millionaire">Millionaire</span>
                </a>
                <div class="game-info">
                    <div class="score-display">Puntuación: <span id="score">0</span></div>
                    <div class="level-display">Nivel: <span id="level">1</span>/15</div>
                </div>
            </div>
        </header>

        <main class="game-main">
            <div class="container">
                <div class="question-card">
                    <div class="question-text" id="question">
                        Cargando pregunta...
                    </div>
                    
                    <div class="options-grid" id="options">
                        <!-- Options will be loaded here -->
                    </div>

                    <div class="game-controls">
                        <button id="next-btn" class="btn btn-primary" style="display: none;">
                            Siguiente pregunta
                        </button>
                    </div>
                </div>

                <div class="lifelines">
                    <button class="lifeline-btn" id="fifty-fifty" title="50:50">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 8v8"></path>
                        </svg>
                        50:50
                    </button>
                </div>
            </div>
        </main>
    </div>

    <script src="<?= url('js/game.js') ?>"></script>
</body>
</html>
