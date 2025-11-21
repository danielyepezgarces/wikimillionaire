<?php
/**
 * Profile Controller
 */

declare(strict_types=1);

// Require authentication
if (!Auth::check()) {
    redirect(url('api/auth/login'));
}

$user = Auth::user();
$db = Database::getInstance();

// Get user's scores
$scores = $db->fetchAll(
    "SELECT * FROM scores WHERE user_id = ? ORDER BY created_at DESC LIMIT 10",
    [$user['id']]
);

$totalGames = count($scores);
$bestScore = $scores ? max(array_column($scores, 'score')) : 0;
$avgScore = $scores ? array_sum(array_column($scores, 'score')) / $totalGames : 0;

$pageTitle = 'Mi Perfil - WikiMillionaire';

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
    <div class="profile-container">
        <header class="header">
            <div class="container">
                <a href="<?= url('/') ?>" class="logo-link">
                    <span class="logo-wiki">Wiki</span><span class="logo-millionaire">Millionaire</span>
                </a>
            </div>
        </header>

        <main class="main-content">
            <div class="container">
                <h1 class="page-title">Mi Perfil</h1>

                <div class="profile-card">
                    <div class="profile-header">
                        <?php if ($user['avatar_url']): ?>
                            <img src="<?= e($user['avatar_url']) ?>" alt="Avatar" class="profile-avatar">
                        <?php else: ?>
                            <img src="<?= gravatar($user['email'] ?? '', 128) ?>" alt="Avatar" class="profile-avatar">
                        <?php endif; ?>
                        <h2><?= e($user['username']) ?></h2>
                    </div>

                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value"><?= $totalGames ?></div>
                            <div class="stat-label">Partidas jugadas</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value"><?= number_format($bestScore) ?></div>
                            <div class="stat-label">Mejor puntuación</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value"><?= number_format((int)$avgScore) ?></div>
                            <div class="stat-label">Promedio</div>
                        </div>
                    </div>

                    <h3 class="section-title">Historial de partidas</h3>
                    <?php if (empty($scores)): ?>
                        <p class="empty-message">Aún no has jugado ninguna partida.</p>
                    <?php else: ?>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Puntuación</th>
                                    <th>Nivel alcanzado</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($scores as $score): ?>
                                    <tr>
                                        <td><?= format_date($score['created_at']) ?></td>
                                        <td class="score"><?= number_format($score['score']) ?></td>
                                        <td><?= e($score['level_reached']) ?>/15</td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    <?php endif; ?>
                </div>

                <div class="actions">
                    <a href="<?= url('play') ?>" class="btn btn-primary">Jugar ahora</a>
                    <a href="<?= url('leaderboard') ?>" class="btn btn-outline">Ver tabla de líderes</a>
                </div>
            </div>
        </main>
    </div>
</body>
</html>
