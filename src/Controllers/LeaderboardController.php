<?php
/**
 * Leaderboard Controller
 */

declare(strict_types=1);

$pageTitle = 'Tabla de Líderes - WikiMillionaire';
$user = Auth::user();
$db = Database::getInstance();

// Get top scores
try {
    $scores = $db->fetchAll(
        "SELECT s.*, u.username, u.avatar_url 
         FROM scores s 
         JOIN users u ON s.user_id = u.id 
         ORDER BY s.score DESC, s.created_at ASC 
         LIMIT 100"
    );
} catch (Exception $e) {
    $scores = [];
    error_log("Error fetching leaderboard: " . $e->getMessage());
}

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
    <div class="leaderboard-container">
        <header class="header">
            <div class="container">
                <a href="<?= url('/') ?>" class="logo-link">
                    <span class="logo-wiki">Wiki</span><span class="logo-millionaire">Millionaire</span>
                </a>
            </div>
        </header>

        <main class="main-content">
            <div class="container">
                <h1 class="page-title">Tabla de Líderes</h1>

                <div class="leaderboard-table">
                    <?php if (empty($scores)): ?>
                        <p class="empty-message">No hay puntuaciones todavía. ¡Sé el primero en jugar!</p>
                    <?php else: ?>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Posición</th>
                                    <th>Jugador</th>
                                    <th>Puntuación</th>
                                    <th>Nivel alcanzado</th>
                                    <th>Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($scores as $index => $score): ?>
                                    <tr class="<?= $score['user_id'] === Auth::id() ? 'highlight' : '' ?>">
                                        <td class="rank">
                                            <?php if ($index < 3): ?>
                                                <span class="medal medal-<?= $index + 1 ?>">
                                                    <?= ['🥇', '🥈', '🥉'][$index] ?>
                                                </span>
                                            <?php else: ?>
                                                <?= $index + 1 ?>
                                            <?php endif; ?>
                                        </td>
                                        <td class="player">
                                            <?php if ($score['avatar_url']): ?>
                                                <img src="<?= e($score['avatar_url']) ?>" alt="Avatar" class="avatar">
                                            <?php endif; ?>
                                            <span><?= e($score['username']) ?></span>
                                        </td>
                                        <td class="score"><?= number_format($score['score']) ?></td>
                                        <td class="level"><?= e($score['level_reached']) ?></td>
                                        <td class="date"><?= format_date($score['created_at']) ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    <?php endif; ?>
                </div>

                <div class="actions">
                    <a href="<?= url('play') ?>" class="btn btn-primary">Jugar ahora</a>
                    <a href="<?= url('/') ?>" class="btn btn-outline">Volver al inicio</a>
                </div>
            </div>
        </main>
    </div>
</body>
</html>
