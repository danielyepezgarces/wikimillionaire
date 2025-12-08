# Migration Guide: TypeScript to PHP Backend

This guide helps you migrate from the template-based TypeScript implementation (`templates/lib/wikidata.ts`) to the new PHP backend implementation.

## Overview

The PHP backend provides the same functionality as the TypeScript implementation but with several advantages:
- Server-side game logic (prevents cheating)
- Session-based state management
- Built-in leaderboard
- Better error handling and retry logic
- Fallback to offline questions when API unavailable

## Quick Start

### For New Projects
Simply use the new game page:
```
http://your-domain/game-play.php
```

### For Existing Projects
1. Keep your existing pages as-is
2. Add the new game page alongside them
3. Update links to point to `game-play.php` instead of `play-game.php`

## File Structure Changes

### Old Structure (TypeScript)
```
templates/
└── lib/
    └── wikidata.ts         # Client-side TypeScript logic
└── play-game.php           # Static HTML template
```

### New Structure (PHP)
```
src/
└── Game/
    ├── Wikidata.php        # Server-side PHP logic
    └── GameService.php     # Game workflow management
game-api.php                # REST API endpoint
game-play.php               # Entry point
templates/
└── game-play.php           # Interactive template with JavaScript
```

## API Mapping

### TypeScript Functions → PHP Classes

| TypeScript (wikidata.ts) | PHP (Wikidata.php) | Notes |
|--------------------------|-------------------|-------|
| `getRandomQuestion(level)` | `getRandomQuestion($level)` | Same interface |
| `fetchFromWikidata(query)` | `fetchFromWikidata($sparqlQuery)` | Same logic, different HTTP client |
| `generateCapitalQuestion()` | `generateCapitalQuestion()` | Identical output |
| `generateElementQuestion()` | `generateElementQuestion()` | Identical output |
| `getBackupQuestion(difficulty)` | `getBackupQuestion($difficulty)` | Same fallback questions |
| All other question generators | All ported 1:1 | 11 question types total |

### Data Structure Compatibility

The PHP backend returns the same data structure as TypeScript:

```php
// PHP Response
[
    'question' => 'Question text',
    'options' => ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
    'correctAnswer' => 'Option 1',
    'id' => 'capital-Q123',
    'image' => 'https://...' // Optional
]
```

```typescript
// TypeScript Interface (for comparison)
interface WikidataQuestion {
    question: string;
    options: string[];
    correctAnswer: string;
    id?: string;
    image?: string;
}
```

## REST API Usage

### Starting a Game

**TypeScript (old):**
```typescript
// Client-side state management
let gameState = {
    level: 1,
    score: 0,
    // ...
};
```

**PHP (new):**
```javascript
// POST to API
const response = await fetch('/game-api.php?action=start', {
    method: 'POST',
    body: 'playerName=Player1'
});
const result = await response.json();
// Server manages state automatically
```

### Getting a Question

**TypeScript (old):**
```typescript
import { getRandomQuestion } from './lib/wikidata.ts';

const question = await getRandomQuestion(level);
```

**PHP (new):**
```javascript
// GET from API
const response = await fetch('/game-api.php?action=getQuestion');
const result = await response.json();
const question = result.data;
```

### Checking an Answer

**TypeScript (old):**
```typescript
// Client-side validation (insecure)
if (userAnswer === question.correctAnswer) {
    score += points;
}
```

**PHP (new):**
```javascript
// Server-side validation (secure)
const response = await fetch('/game-api.php?action=checkAnswer', {
    method: 'POST',
    body: `answer=${encodeURIComponent(userAnswer)}`
});
const result = await response.json();
if (result.data.correct) {
    // Update UI
}
```

## Configuration Changes

### Environment Variables

**Old:** Hardcoded in TypeScript
```typescript
const endpoint = "https://query.wikidata.org/sparql";
const timeout = 10000;
```

**New:** PHP class constants (customizable)
```php
// In src/Game/Wikidata.php
private const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql';
private const TIMEOUT_SECONDS = 10;
private const MAX_RETRIES = 2;
```

To customize, edit the class constants or extend the class.

## JavaScript Integration

### Old Approach (Templates)
```html
<!-- In template -->
<script type="module">
import { getRandomQuestion } from './lib/wikidata.ts';
// Client-side logic
</script>
```

### New Approach (API Calls)
```html
<!-- In template -->
<script>
// No imports needed
async function loadQuestion() {
    const response = await fetch('/game-api.php?action=getQuestion');
    const result = await response.json();
    displayQuestion(result.data);
}
</script>
```

## Session Management

### Old Approach
```typescript
// localStorage for persistence
localStorage.setItem('game-state', JSON.stringify(state));
```

### New Approach
```php
// PHP sessions (server-side, more secure)
$_SESSION['game'] = [
    'level' => 1,
    'score' => 0,
    // ...
];
```

**Advantages:**
- Tamper-proof (server-side)
- Automatic garbage collection
- No client storage limits

## Error Handling

### Old Approach
```typescript
try {
    const question = await getRandomQuestion(level);
} catch (error) {
    console.error('Error:', error);
    // Use backup question
}
```

### New Approach
```javascript
const response = await fetch('/game-api.php?action=getQuestion');
const result = await response.json();

if (!result.success) {
    console.error('Error:', result.error);
    // Server automatically uses backup questions
}
```

## Testing

### Old Approach
Manual testing in browser console:
```typescript
import { getRandomQuestion } from './lib/wikidata.ts';
console.log(await getRandomQuestion(1));
```

### New Approach
Automated test script:
```bash
php test-api.php
```

Output validates all functionality automatically.

## Performance Considerations

### TypeScript (Client-Side)
- ✅ No server load
- ❌ Exposes game logic
- ❌ Slower on weak clients
- ❌ Limited retry capabilities

### PHP (Server-Side)
- ✅ Centralized logic
- ✅ Better error handling
- ✅ State persistence
- ✅ Prevents cheating
- ⚠️ Requires server resources (minimal)

## Backwards Compatibility

The old template (`templates/play-game.php`) is kept for reference and backwards compatibility. You can:

1. **Keep both implementations** during transition
2. **Gradually migrate** users to the new system
3. **A/B test** both versions

No breaking changes to existing functionality.

## Common Migration Issues

### Issue 1: Session Not Persisting
**Problem:** Game state resets between requests  
**Solution:** Ensure cookies are enabled and same-origin policy is respected

### Issue 2: CORS Errors
**Problem:** API calls blocked by CORS  
**Solution:** Both frontend and API must be on same domain, or configure CORS headers

### Issue 3: Network Errors
**Problem:** Wikidata API unreachable  
**Solution:** Automatic fallback to backup questions (already implemented)

### Issue 4: Questions Repeat
**Problem:** Same questions appearing  
**Solution:** Session tracks used questions (cleared on game restart)

## Step-by-Step Migration

### Step 1: Test the New Backend
```bash
# Install dependencies
composer install

# Test the API
php test-api.php

# Start dev server
php -S localhost:8000

# Visit http://localhost:8000/game-play.php
```

### Step 2: Update Your Templates
Replace TypeScript imports with API calls:

**Before:**
```html
<script type="module">
import { getRandomQuestion } from './templates/lib/wikidata.ts';
</script>
```

**After:**
```html
<script>
async function getQuestion() {
    const res = await fetch('/game-api.php?action=getQuestion');
    return (await res.json()).data;
}
</script>
```

### Step 3: Update Navigation Links
Change links from:
```html
<a href="/play-game.php">Play</a>
```

To:
```html
<a href="/game-play.php">Play</a>
```

### Step 4: Deploy
```bash
# On production server
composer install --no-dev
# Ensure session directory is writable
chmod 777 /tmp  # or your session save path
```

## Rollback Plan

If you need to rollback:

1. **Immediate:** Point links back to `play-game.php`
2. **No data loss:** Old and new systems are separate
3. **Quick:** No database changes to revert

## Support

For issues or questions:
1. Check `README.md` for configuration
2. Check `SECURITY.md` for production hardening
3. Run `php test-api.php` to verify setup
4. Review browser console for JavaScript errors

## Next Steps

After migration:
1. Review `SECURITY.md` for production hardening
2. Implement CSRF protection
3. Add XSS sanitization
4. Enable HTTPS
5. Configure rate limiting
6. Monitor Wikidata API usage

## Summary

✅ **Backwards Compatible:** Old templates still work  
✅ **Same Functionality:** All features ported  
✅ **Better Security:** Server-side validation  
✅ **Easy Testing:** Automated test script  
✅ **Clear Documentation:** README, SECURITY, and this guide  

The migration is straightforward and low-risk. Start with testing in development, then gradually roll out to production.
