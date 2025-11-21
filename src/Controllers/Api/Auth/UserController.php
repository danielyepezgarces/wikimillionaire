<?php
/**
 * Get Current User Controller
 */

declare(strict_types=1);

if (!Auth::check()) {
    json_response(['user' => null]);
}

$user = Auth::user();

json_response([
    'user' => [
        'id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'] ?? null,
        'avatar_url' => $user['avatar_url'] ?? null,
    ],
]);
