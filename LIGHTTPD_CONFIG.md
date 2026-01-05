# Lighttpd Configuration Guide

This document explains how to use the `.lighttpd.conf` file for URL rewriting in WikiMillionaire.

## Purpose

The `.lighttpd.conf` file enables friendly URLs by allowing users to access PHP pages without the `.php` extension.

### Examples:
- `http://example.com/index` → serves `index.php`
- `http://example.com/play` → serves `play.php`
- `http://example.com/game` → serves `game.php`
- `http://example.com/leaderboard` → serves `leaderboard.php`

## Installation

### Option 1: Include in Main Configuration

Add the following line to your main lighttpd configuration file (usually `/etc/lighttpd/lighttpd.conf`):

```
include "/path/to/wikimillionairephp/.lighttpd.conf"
```

### Option 2: Copy Rules to Main Configuration

Copy the contents of `.lighttpd.conf` directly into your main lighttpd configuration file.

### Option 3: Use as Server-Specific Configuration

If you have a dedicated configuration directory for your virtual host, place the `.lighttpd.conf` file there and ensure it's included.

## Testing

After updating the configuration:

1. Test the configuration syntax:
   ```bash
   lighttpd -t -f /etc/lighttpd/lighttpd.conf
   ```

2. Restart lighttpd:
   ```bash
   sudo systemctl restart lighttpd
   # or
   sudo service lighttpd restart
   ```

3. Test URL rewriting:
   ```bash
   curl http://localhost/index
   curl http://localhost/play
   curl http://localhost/game
   ```

## PHP Configuration

If you're using PHP-FPM or PHP-CGI, uncomment and adjust the FastCGI configuration section in `.lighttpd.conf` according to your setup.

## Troubleshooting

### 404 Not Found
- Ensure the `.php` files exist in the root directory
- Check file permissions (should be readable by the web server)
- Verify that mod_rewrite is loaded in your lighttpd configuration

### PHP Not Executing
- Uncomment and configure the FastCGI section in `.lighttpd.conf`
- Ensure PHP-FPM or PHP-CGI is installed and running
- Check lighttpd error logs: `tail -f /var/log/lighttpd/error.log`

### Module Not Found
If you get an error about mod_rewrite not being found, enable it in your main configuration:
```
server.modules += ( "mod_rewrite" )
```

## Notes

- The configuration only rewrites URLs if the corresponding `.php` file exists
- Existing files (like CSS, JS, images) are served directly without rewriting
- Query strings are preserved during rewriting
