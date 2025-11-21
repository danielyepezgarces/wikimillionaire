<?php
/**
 * Helper Functions - Pure PHP 8.4
 */

declare(strict_types=1);

/**
 * Escape HTML output
 */
function e(?string $value): string
{
    return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8');
}

/**
 * Generate URL
 */
function url(string $path = ''): string
{
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $basePath = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
    
    return $protocol . '://' . $host . $basePath . '/' . ltrim($path, '/');
}

/**
 * Redirect to URL
 */
function redirect(string $url): never
{
    header("Location: $url");
    exit;
}

/**
 * Return JSON response
 */
function json_response(mixed $data, int $statusCode = 200): never
{
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

/**
 * Get request input
 */
function input(string $key, mixed $default = null): mixed
{
    // Check POST first
    if (isset($_POST[$key])) {
        return $_POST[$key];
    }
    
    // Then GET
    if (isset($_GET[$key])) {
        return $_GET[$key];
    }
    
    // Try JSON body
    $json = json_decode(file_get_contents('php://input'), true);
    if (is_array($json) && isset($json[$key])) {
        return $json[$key];
    }
    
    return $default;
}

/**
 * Get all request input
 */
function all_input(): array
{
    $json = json_decode(file_get_contents('php://input'), true);
    return array_merge($_GET, $_POST, is_array($json) ? $json : []);
}

/**
 * Render view
 */
function view(string $name, array $data = []): void
{
    extract($data);
    $viewPath = SRC_PATH . '/Views/' . str_replace('.', '/', $name) . '.php';
    
    if (!file_exists($viewPath)) {
        throw new RuntimeException("View not found: $name");
    }
    
    require $viewPath;
}

/**
 * Generate CSRF token
 */
function csrf_token(): string
{
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Verify CSRF token
 */
function verify_csrf_token(string $token): bool
{
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Get current timestamp
 */
function now(): string
{
    return date('Y-m-d H:i:s');
}

/**
 * Format date
 */
function format_date(string $date, string $format = 'Y-m-d H:i'): string
{
    return date($format, strtotime($date));
}

/**
 * Sanitize string
 */
function sanitize(string $value): string
{
    return filter_var($value, FILTER_SANITIZE_FULL_SPECIAL_CHARS);
}

/**
 * Check if request is AJAX
 */
function is_ajax(): bool
{
    return isset($_SERVER['HTTP_X_REQUESTED_WITH']) &&
           strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
}

/**
 * Check if request is API
 */
function is_api(): bool
{
    return str_starts_with($_SERVER['REQUEST_URI'], '/api/');
}

/**
 * Generate gravatar URL
 */
function gravatar(string $email, int $size = 80): string
{
    $hash = md5(strtolower(trim($email)));
    return "https://www.gravatar.com/avatar/$hash?s=$size&d=mp";
}

/**
 * Debug dump and die
 */
function dd(mixed ...$vars): never
{
    echo '<pre>';
    foreach ($vars as $var) {
        var_dump($var);
    }
    echo '</pre>';
    die();
}
