<?php
/**
 * Simple Router - Pure PHP 8.4
 * No external libraries
 */

declare(strict_types=1);

class Router
{
    private array $routes = [];

    /**
     * Register a GET route
     */
    public function get(string $path, callable $handler): void
    {
        $this->addRoute('GET', $path, $handler);
    }

    /**
     * Register a POST route
     */
    public function post(string $path, callable $handler): void
    {
        $this->addRoute('POST', $path, $handler);
    }

    /**
     * Register a PUT route
     */
    public function put(string $path, callable $handler): void
    {
        $this->addRoute('PUT', $path, $handler);
    }

    /**
     * Register a DELETE route
     */
    public function delete(string $path, callable $handler): void
    {
        $this->addRoute('DELETE', $path, $handler);
    }

    /**
     * Add a route to the router
     */
    private function addRoute(string $method, string $path, callable $handler): void
    {
        $this->routes[] = [
            'method' => $method,
            'path' => $path,
            'handler' => $handler,
            'pattern' => $this->convertPathToRegex($path),
        ];
    }

    /**
     * Convert route path to regex pattern
     */
    private function convertPathToRegex(string $path): string
    {
        // Convert :param to named capture groups
        $pattern = preg_replace('/\/:([^\/]+)/', '/(?<$1>[^/]+)', $path);
        return '#^' . $pattern . '$#';
    }

    /**
     * Dispatch the request to the appropriate handler
     */
    public function dispatch(string $uri, string $method): void
    {
        // Remove query string from URI
        $uri = parse_url($uri, PHP_URL_PATH);

        foreach ($this->routes as $route) {
            if ($route['method'] === $method && preg_match($route['pattern'], $uri, $matches)) {
                // Extract named parameters
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                
                // Call the handler
                call_user_func($route['handler'], $params);
                return;
            }
        }

        // No route found
        http_response_code(404);
        if (str_starts_with($uri, '/api/')) {
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Not Found']);
        } else {
            echo '<h1>404 - Page Not Found</h1>';
        }
    }
}
