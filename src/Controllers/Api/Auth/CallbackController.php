<?php
/**
 * OAuth Callback Controller
 */

declare(strict_types=1);

$oauthToken = input('oauth_token');
$oauthVerifier = input('oauth_verifier');

if (!$oauthToken || !$oauthVerifier) {
    redirect(url('/?error=oauth_failed'));
}

$consumerKey = getenv('OAUTH_CONSUMER_KEY');
$consumerSecret = getenv('OAUTH_CONSUMER_SECRET');

// Get token secret from session
$tokenSecret = Auth::getOAuthData('oauth_token_secret');

if (!$tokenSecret) {
    redirect(url('/?error=session_expired'));
}

try {
    // Step 3: Exchange for access token
    $url = 'https://meta.wikimedia.org/w/index.php?title=Special:OAuth/token';
    
    $oauthParams = [
        'oauth_consumer_key' => $consumerKey,
        'oauth_token' => $oauthToken,
        'oauth_verifier' => $oauthVerifier,
        'oauth_nonce' => Auth::generateNonce(),
        'oauth_signature_method' => 'HMAC-SHA1',
        'oauth_timestamp' => (string)time(),
        'oauth_version' => '1.0',
    ];

    $signature = Auth::generateOAuthSignature('POST', $url, $oauthParams, $consumerSecret, $tokenSecret);
    $oauthParams['oauth_signature'] = $signature;

    $authHeader = Auth::buildOAuthHeader($oauthParams);

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Authorization: $authHeader\r\n",
            'ignore_errors' => true,
        ],
    ]);

    $response = file_get_contents($url, false, $context);
    
    if ($response === false) {
        throw new RuntimeException('Failed to get access token');
    }

    parse_str($response, $tokens);

    if (!isset($tokens['oauth_token']) || !isset($tokens['oauth_token_secret'])) {
        throw new RuntimeException('Invalid access token response');
    }

    // Step 4: Get user info
    $userInfo = Auth::getWikimediaUserInfo($tokens['oauth_token'], $tokens['oauth_token_secret']);

    // Step 5: Create or update user in database
    $db = Database::getInstance();
    
    $userId = $userInfo['sub'] ?? uniqid('user_', true);
    $username = $userInfo['username'] ?? 'User';
    $email = $userInfo['email'] ?? null;
    
    // Check if user exists
    $existingUser = $db->fetchOne('SELECT * FROM users WHERE auth_id = ?', [$userId]);
    
    if ($existingUser) {
        // Update existing user
        $db->update('users', [
            'username' => $username,
            'email' => $email,
        ], ['id' => $existingUser['id']]);
        
        $user = $db->fetchOne('SELECT * FROM users WHERE id = ?', [$existingUser['id']]);
    } else {
        // Create new user
        $newUserId = uniqid('user_', true);
        $avatarUrl = gravatar($email ?? $username . '@example.com');
        
        $db->insert('users', [
            'id' => $newUserId,
            'username' => $username,
            'email' => $email,
            'avatar_url' => $avatarUrl,
            'auth_id' => $userId,
            'created_at' => now(),
        ]);
        
        $user = $db->fetchOne('SELECT * FROM users WHERE id = ?', [$newUserId]);
    }

    // Login user
    Auth::login($user);
    Auth::clearOAuthData();

    // Redirect to home
    redirect(url('/'));

} catch (Exception $e) {
    error_log("OAuth callback error: " . $e->getMessage());
    redirect(url('/?error=auth_failed'));
}
