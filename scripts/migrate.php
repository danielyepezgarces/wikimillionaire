<?php
/**
 * Database Migration Script
 * Run this to set up the database schema
 */

declare(strict_types=1);

// Load environment variables from .env file
if (file_exists(__DIR__ . '/../.env')) {
    $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (str_starts_with(trim($line), '#')) continue;
        putenv($line);
    }
}

$host = getenv('DB_HOST') ?: 'localhost';
$port = getenv('DB_PORT') ?: '3306';
$database = getenv('DB_NAME') ?: 'wikimillionaire';
$username = getenv('DB_USER') ?: 'root';
$password = getenv('DB_PASSWORD') ?: '';

try {
    $dsn = "mysql:host={$host};port={$port};charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

    echo "Connected to MySQL server...\n";

    // Create database if it doesn't exist
    echo "Creating database '{$database}' if not exists...\n";
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `{$database}`");

    echo "Database selected.\n";

    // Create users table
    echo "Creating users table...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(36) PRIMARY KEY,
            username VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            avatar_url VARCHAR(500),
            auth_id VARCHAR(255) UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_auth_id (auth_id),
            INDEX idx_username (username)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Create scores table
    echo "Creating scores table...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS scores (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            score INT NOT NULL,
            level_reached INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user_id (user_id),
            INDEX idx_score (score),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Create answer_reports table
    echo "Creating answer_reports table...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS answer_reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            question_id VARCHAR(255) NOT NULL,
            reported_by VARCHAR(36),
            reason TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_status (status),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    echo "\n✅ Migration completed successfully!\n";
    echo "\nDatabase setup:\n";
    echo "  Database: {$database}\n";
    echo "  Tables: users, scores, answer_reports\n";

} catch (PDOException $e) {
    echo "\n❌ Migration failed!\n";
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
