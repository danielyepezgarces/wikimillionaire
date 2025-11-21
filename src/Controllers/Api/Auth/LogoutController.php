<?php
/**
 * Logout Controller
 */

declare(strict_types=1);

Auth::logout();
redirect(url('/'));
