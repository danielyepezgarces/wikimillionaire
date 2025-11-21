<?php
/**
 * Login Controller - OAuth 1.0a Flow Start
 */

declare(strict_types=1);

// Get OAuth credentials
$consumerKey = getenv('OAUTH_CONSUMER_KEY');
$consumerSecret = getenv('OAUTH_CONSUMER_SECRET');
$callbackUrl = getenv('OAUTH_CALLBACK_URL') ?: url('api/auth/callback');

if (!$consumerKey || !$consumerSecret) {
    json_response(['error' => 'OAuth not configured'], 500);
}

try {
    // Step 1: Get request token
    $url = 'https://meta.wikimedia.org/w/index.php?title=Special:OAuth/initiate';
    
    $oauthParams = [
        'oauth_callback' => $callbackUrl,
        'oauth_consumer_key' => $consumerKey,
        'oauth_nonce' => Auth::generateNonce(),
        'oauth_signature_method' => 'HMAC-SHA1',
        'oauth_timestamp' => (string)time(),
        'oauth_version' => '1.0',
    ];

    $signature = Auth::generateOAuthSignature('POST', $url, $oauthParams, $consumerSecret);
    $oauthParams['oauth_signature'] = $signature;

    $authHeader = Auth::buildOAuthHeader($oauthParams);

    // Make request
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Authorization: $authHeader\r\n",
            'ignore_errors' => true,
        ],
    ]);

    $response = file_get_contents($url, false, $context);
    
    if ($response === false) {
        throw new RuntimeException('Failed to get request token');
    }

    parse_str($response, $tokens);

    if (!isset($tokens['oauth_token']) || !isset($tokens['oauth_token_secret'])) {
        throw new RuntimeException('Invalid OAuth response');
    }

    // Store token secret in session
    Auth::setOAuthData('oauth_token_secret', $tokens['oauth_token_secret']);

    // Step 2: Redirect to authorization page
    $authorizeUrl = 'https://meta.wikimedia.org/w/index.php?title=Special:OAuth/authorize&' .
                    'oauth_token=' . urlencode($tokens['oauth_token']) .
                    '&oauth_consumer_key=' . urlencode($consumerKey);

    redirect($authorizeUrl);

} catch (Exception $e) {
    error_log("OAuth login error: " . $e->getMessage());
    json_response(['error' => 'OAuth login failed'], 500);
}
