<?php
/**
 * Home Controller
 */

declare(strict_types=1);

$pageTitle = 'WikiMillionaire';
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
    <div class="home-container">
        <!-- Header -->
        <header class="header">
            <div class="container">
                <div class="header-content">
                    <div class="logo">
                        <span class="logo-wiki">Wiki</span><span class="logo-millionaire">Millionaire</span>
                    </div>
                    <div class="header-actions">
                        <?php if ($user): ?>
                            <a href="<?= url('profile') ?>" class="btn btn-secondary">
                                <?= e($user['username']) ?>
                            </a>
                            <a href="<?= url('api/auth/logout') ?>" class="btn btn-outline">Cerrar sesión</a>
                        <?php else: ?>
                            <a href="<?= url('api/auth/login') ?>" class="btn btn-primary">Iniciar sesión con Wikimedia</a>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </header>

        <!-- Hero Section -->
        <main class="hero">
            <div class="container">
                <h1 class="hero-title">
                    <span class="text-yellow">Wiki</span>Millionaire
                </h1>
                <p class="hero-subtitle">
                    Pon a prueba tus conocimientos con preguntas basadas en datos reales de Wikidata
                </p>

                <div class="hero-actions">
                    <a href="<?= url('play') ?>" class="btn btn-lg btn-yellow">
                        Jugar
                        <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </a>
                    <a href="<?= url('leaderboard') ?>" class="btn btn-lg btn-outline">
                        <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                            <path d="M4 22h16"></path>
                            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                        </svg>
                        Tabla de posiciones
                    </a>
                </div>

                <!-- Features -->
                <div class="features">
                    <div class="feature-card">
                        <div class="feature-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z"></path>
                                <path d="M12 6v6l4 2"></path>
                            </svg>
                        </div>
                        <h3 class="feature-title">Datos de Wikidata</h3>
                        <p class="feature-description">
                            Preguntas generadas dinámicamente desde la base de conocimiento de Wikidata
                        </p>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                        </div>
                        <h3 class="feature-title">Desafíos Diarios</h3>
                        <p class="feature-description">
                            Nuevas preguntas cada día para mejorar tus conocimientos
                        </p>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        </div>
                        <h3 class="feature-title">Tabla de Líderes</h3>
                        <p class="feature-description">
                            Compite con otros jugadores y alcanza la cima
                        </p>
                    </div>
                </div>
            </div>
        </main>

        <!-- Footer -->
        <footer class="footer">
            <div class="container">
                <div class="footer-content">
                    <p class="footer-text">© 2025 WikiMillionaire. Datos de Wikidata.</p>
                    <div class="footer-links">
                        <a href="#" class="footer-link">Acerca de</a>
                        <a href="#" class="footer-link">Privacidad</a>
                        <a href="#" class="footer-link">Términos</a>
                    </div>
                </div>
            </div>
        </footer>
    </div>

    <script src="<?= url('js/app.js') ?>"></script>
</body>
</html>
