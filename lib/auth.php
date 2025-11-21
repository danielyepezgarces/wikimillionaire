<?php
/**
 * Authentication System - Pure PHP 8.4
 * OAuth 1.0a implementation for Wikimedia
 * No external libraries
 */

declare(strict_types=1);

class Auth
{
    private const SESSION_KEY = 'wikimillionaire_user';
    private const OAUTH_SESSION_KEY = 'wikimillionaire_oauth';

    /**
     * Check if user is authenticated
     */
    public static function check(): bool
    {
        return isset($_SESSION[self::SESSION_KEY]);
    }

    /**
     * Get current authenticated user
     */
    public static function user(): ?array
    {
        return $_SESSION[self::SESSION_KEY] ?? null;
    }

    /**
     * Get user ID
     */
    public static function id(): ?string
    {
        return self::user()['id'] ?? null;
    }

    /**
     * Login user
     */
    public static function login(array $user): void
    {
        $_SESSION[self::SESSION_KEY] = $user;
        session_regenerate_id(true);
    }

    /**
     * Logout user
     */
    public static function logout(): void
    {
        unset($_SESSION[self::SESSION_KEY]);
        unset($_SESSION[self::OAUTH_SESSION_KEY]);
        session_regenerate_id(true);
    }

    /**
     * Store OAuth temporary data
     */
    public static function setOAuthData(string $key, mixed $value): void
    {
        $_SESSION[self::OAUTH_SESSION_KEY][$key] = $value;
    }

    /**
     * Get OAuth temporary data
     */
    public static function getOAuthData(string $key): mixed
    {
        return $_SESSION[self::OAUTH_SESSION_KEY][$key] ?? null;
    }

    /**
     * Clear OAuth temporary data
     */
    public static function clearOAuthData(): void
    {
        unset($_SESSION[self::OAUTH_SESSION_KEY]);
    }

    /**
     * Generate OAuth 1.0a signature
     */
    public static function generateOAuthSignature(
        string $method,
        string $url,
        array $params,
        string $consumerSecret,
        string $tokenSecret = ''
    ): string {
        // Sort parameters
        ksort($params);

        // Build parameter string
        $paramString = http_build_query($params, '', '&', PHP_QUERY_RFC3986);

        // Build signature base string
        $baseString = strtoupper($method) . '&' .
                     rawurlencode($url) . '&' .
                     rawurlencode($paramString);

        // Build signing key
        $signingKey = rawurlencode($consumerSecret) . '&' . rawurlencode($tokenSecret);

        // Generate signature
        $signature = base64_encode(hash_hmac('sha1', $baseString, $signingKey, true));

        return $signature;
    }

    /**
     * Generate random string for nonce
     */
    public static function generateNonce(int $length = 32): string
    {
        return bin2hex(random_bytes($length / 2));
    }

    /**
     * Build OAuth authorization header
     */
    public static function buildOAuthHeader(array $params): string
    {
        $header = 'OAuth ';
        $values = [];
        
        foreach ($params as $key => $value) {
            $values[] = rawurlencode($key) . '="' . rawurlencode($value) . '"';
        }
        
        $header .= implode(', ', $values);
        return $header;
    }

    /**
     * Make OAuth request
     */
    public static function makeOAuthRequest(
        string $method,
        string $url,
        array $params,
        array $oauthParams
    ): array {
        // Combine all parameters for signature
        $allParams = array_merge($params, $oauthParams);
        
        // Generate signature
        $consumerSecret = getenv('OAUTH_CONSUMER_SECRET') ?: '';
        $tokenSecret = $oauthParams['oauth_token_secret'] ?? '';
        
        $signature = self::generateOAuthSignature(
            $method,
            $url,
            $allParams,
            $consumerSecret,
            $tokenSecret
        );
        
        $oauthParams['oauth_signature'] = $signature;
        
        // Build authorization header
        $authHeader = self::buildOAuthHeader($oauthParams);
        
        // Make request
        $context = stream_context_create([
            'http' => [
                'method' => $method,
                'header' => "Authorization: $authHeader\r\n" .
                           "Content-Type: application/x-www-form-urlencoded\r\n",
                'content' => $method === 'POST' ? http_build_query($params) : null,
                'ignore_errors' => true,
            ],
        ]);
        
        $fullUrl = $url;
        if ($method === 'GET' && !empty($params)) {
            $fullUrl .= '?' . http_build_query($params);
        }
        
        $response = file_get_contents($fullUrl, false, $context);
        
        if ($response === false) {
            throw new RuntimeException('OAuth request failed');
        }
        
        // Parse response
        parse_str($response, $result);
        return $result;
    }

    /**
     * Get Wikimedia user info
     */
    public static function getWikimediaUserInfo(string $accessToken, string $accessTokenSecret): array
    {
        $url = 'https://meta.wikimedia.org/w/index.php';
        $params = [
            'title' => 'Special:OAuth/identify',
        ];
        
        $oauthParams = [
            'oauth_consumer_key' => getenv('OAUTH_CONSUMER_KEY'),
            'oauth_token' => $accessToken,
            'oauth_token_secret' => $accessTokenSecret,
            'oauth_signature_method' => 'HMAC-SHA1',
            'oauth_timestamp' => (string)time(),
            'oauth_nonce' => self::generateNonce(),
            'oauth_version' => '1.0',
        ];
        
        $result = self::makeOAuthRequest('GET', $url, $params, $oauthParams);
        
        // Decode JWT-like response (simplified)
        if (isset($result['identify'])) {
            return json_decode(base64_decode($result['identify']), true);
        }
        
        throw new RuntimeException('Failed to get user info');
    }
}
