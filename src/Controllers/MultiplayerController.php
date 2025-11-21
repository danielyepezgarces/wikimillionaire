<?php
/**
 * Multiplayer Controller
 */

declare(strict_types=1);

$pageTitle = 'Multijugador - WikiMillionaire';

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
    <div class="multiplayer-container">
        <header class="header">
            <div class="container">
                <a href="<?= url('/') ?>" class="logo-link">
                    <span class="logo-wiki">Wiki</span><span class="logo-millionaire">Millionaire</span>
                </a>
            </div>
        </header>

        <main class="main-content">
            <div class="container">
                <h1 class="page-title">Modo Multijugador</h1>

                <div class="coming-soon-card">
                    <div class="coming-soon-icon">🚀</div>
                    <h2>Próximamente</h2>
                    <p>El modo multijugador estará disponible pronto. Podrás competir en tiempo real con otros jugadores.</p>
                    
                    <div class="features-list">
                        <h3>Funcionalidades planeadas:</h3>
                        <ul>
                            <li>✓ Partidas en tiempo real</li>
                            <li>✓ Salas privadas con amigos</li>
                            <li>✓ Torneos competitivos</li>
                            <li>✓ Chat en vivo</li>
                        </ul>
                    </div>

                    <div class="actions">
                        <a href="<?= url('play') ?>" class="btn btn-primary">Jugar modo individual</a>
                        <a href="<?= url('/') ?>" class="btn btn-outline">Volver al inicio</a>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <style>
        .coming-soon-card {
            background: rgba(88, 28, 135, 0.5);
            border: 1px solid rgba(147, 51, 234, 0.3);
            border-radius: 0.5rem;
            padding: 3rem;
            text-align: center;
            max-width: 600px;
            margin: 0 auto;
        }

        .coming-soon-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }

        .coming-soon-card h2 {
            font-size: 2rem;
            color: #fbbf24;
            margin-bottom: 1rem;
        }

        .coming-soon-card p {
            font-size: 1.1rem;
            color: #cbd5e1;
            margin-bottom: 2rem;
        }

        .features-list {
            text-align: left;
            margin-bottom: 2rem;
        }

        .features-list h3 {
            color: #fff;
            margin-bottom: 1rem;
        }

        .features-list ul {
            list-style: none;
            padding: 0;
        }

        .features-list li {
            padding: 0.5rem 0;
            color: #cbd5e1;
        }
    </style>
</body>
</html>
