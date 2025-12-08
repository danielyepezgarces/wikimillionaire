# WikiMillionaire PHP

A "Who Wants to Be a Millionaire?" style quiz game built with PHP and styled with Tailwind CSS, using real data from Wikidata.

## Features

- 🎨 Modern, responsive UI built with Tailwind CSS (via CDN)
- 📱 Mobile-friendly design
- 🎯 Modular template system for easy maintenance
- 🔄 Clean PHP architecture with reusable components
- 📊 Leaderboard system
- 🎮 Interactive gameplay
- 🌐 **NEW:** PHP backend integration with Wikidata API
- 🧠 **NEW:** Multiple question types (11 types) with varying difficulty
- 🎲 **NEW:** Smart fallback questions when API is unavailable
- 💡 **NEW:** Game lifelines (50:50 implemented)

## Project Structure

```
wikimillionairephp/
├── index.php              # Homepage entry point
├── play.php               # Game/play page entry point (registration)
├── game.php          # NEW: Active game page with PHP backend
├── api.php           # NEW: REST API endpoint for game actions
├── leaderboard.php        # Leaderboard page entry point
├── test-api.php           # NEW: Manual testing script for game logic
├── composer.json          # NEW: PHP autoloading configuration
├── src/                   # NEW: PHP backend source code
│   └── Game/
│       ├── Wikidata.php   # Wikidata API integration & question generation
│       └── GameService.php # Game workflow & session management
└── templates/
    ├── layout.php         # Base layout wrapper
    ├── index.php          # Homepage content template
    ├── play.php           # Play page content template
    ├── game.php      # NEW: Interactive game template with JS
    ├── play-game.php      # OLD: Static game template (kept for reference)
    ├── leaderboard.php    # Leaderboard content template
    └── partials/
        ├── header.php     # HTML head with Tailwind CDN
        └── footer.php     # Closing HTML tags
```

## Template System

### Architecture

The project uses a modular template system that separates concerns:

1. **Entry Points** (root directory): Handle routing and page initialization
2. **Layout Template** (`templates/layout.php`): Provides consistent structure
3. **Content Templates** (`templates/*.php`): Page-specific content
4. **Partials** (`templates/partials/*.php`): Reusable components

### How It Works

Each page follows this pattern:

```php
<?php
// 1. Set page title
$pageTitle = 'Your Page Title';

// 2. Set content template path
$contentTemplate = __DIR__ . '/templates/your-template.php';

// 3. Render page using base layout
include __DIR__ . '/templates/layout.php';
```

The layout template (`templates/layout.php`) then:
1. Includes the header partial (with Tailwind CDN)
2. Includes the specified content template
3. Includes the footer partial

### Adding a New Page

1. Create a content template in `templates/`:
```php
// templates/newpage.php
<div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold">New Page</h1>
    <!-- Your content here -->
</div>
```

2. Create an entry point in the root directory:
```php
// newpage.php
<?php
$pageTitle = 'New Page - WikiMillionaire';
$contentTemplate = __DIR__ . '/templates/newpage.php';
include __DIR__ . '/templates/layout.php';
```

## Styling with Tailwind CSS

The project uses Tailwind CSS via CDN (included in `templates/partials/header.php`). All Tailwind utility classes are available for use in your templates.

### Example:
```html
<button class="bg-yellow-500 text-black hover:bg-yellow-600 px-4 py-2 rounded">
    Click Me
</button>
```

## Running the Project

### Requirements
- PHP 7.4 or higher
- Composer (for autoloading)
- Web server (Apache, Nginx, or PHP built-in server)
- Internet connection (for Wikidata API, optional - has offline fallback)

### Installation

```bash
# Install dependencies
composer install

# Test the PHP backend
php test-api.php
```

### Development Server

```bash
# Start PHP built-in server
php -S localhost:8000

# Open in browser
# Navigate to http://localhost:8000/index.php
# Play game at http://localhost:8000/game.php
```

### Production Deployment

1. Upload all files to your web server
2. Run `composer install --no-dev` on the server
3. Ensure PHP is enabled
4. Configure your web server to serve the root directory
5. Set `index.php` as the default document
6. Ensure session directory is writable

## Navigation

- **Homepage** (`index.php`): Game introduction and features
- **Play** (`play.php`): Player registration and game start
- **Game Play** (`game.php`): Interactive game with PHP backend ⭐ NEW
- **Leaderboard** (`leaderboard.php`): Rankings and scores

All navigation links are functional and use relative paths.

## PHP Backend Architecture

### Game Workflow

The game now uses a server-side PHP backend for all game logic:

1. **Wikidata Integration** (`src/Game/Wikidata.php`)
   - Queries Wikidata SPARQL endpoint for real trivia questions
   - 11 different question types: capitals, elements, authors, flags, artworks, landmarks, mountains, inventions, population, area, birthdates
   - Automatic retry logic with exponential backoff
   - Fallback to backup questions if Wikidata is unavailable
   - Image support for visual questions (flags, artworks, landmarks)

2. **Game Service** (`src/Game/GameService.php`)
   - Session-based game state management
   - Score tracking and level progression (15 levels)
   - Safe haven checkpoints (levels 5 and 10)
   - Lifeline management (50:50 implemented)
   - Leaderboard functionality
   - Timer validation (30 seconds per question)

3. **REST API** (`api.php`)
   - `POST /api.php?action=start` - Start new game
   - `GET /api.php?action=getState` - Get current game state
   - `GET /api.php?action=getQuestion` - Get next question
   - `POST /api.php?action=checkAnswer` - Submit answer
   - `POST /api.php?action=useFiftyFifty` - Use 50:50 lifeline
   - `POST /api.php?action=quit` - Quit and save score
   - `GET /api.php?action=getLeaderboard` - Get top scores

### Question Types by Difficulty

**Easy (Levels 1-4):**
- Capital cities
- Book authors
- Chemical elements
- Country flags (with images)
- Famous artworks (with images)

**Medium (Levels 5-9):**
- Country areas
- Mountain heights/locations
- Famous inventions
- Birth years of famous people
- Famous landmarks (with images)

**Hard (Levels 10-15):**
- Country populations
- Advanced inventions
- Challenging mountain facts
- Complex element questions

### Environment Variables

The Wikidata module supports configuration through constants:

- `WIKIDATA_ENDPOINT`: SPARQL endpoint URL (default: https://query.wikidata.org/sparql)
- `USER_AGENT`: User agent for API requests
- `TIMEOUT_SECONDS`: HTTP request timeout (default: 10)
- `MAX_RETRIES`: Number of retry attempts (default: 2)

### Migration from TypeScript

The PHP backend is a complete port of `templates/lib/wikidata.ts`:

| TypeScript Function | PHP Equivalent | Status |
|---------------------|----------------|--------|
| `getRandomQuestion()` | `Wikidata::getRandomQuestion()` | ✅ Ported |
| `fetchFromWikidata()` | `Wikidata::fetchFromWikidata()` | ✅ Ported |
| `generateCapitalQuestion()` | `Wikidata::generateCapitalQuestion()` | ✅ Ported |
| `generateBirthdateQuestion()` | `Wikidata::generateBirthdateQuestion()` | ✅ Ported |
| `generatePopulationQuestion()` | `Wikidata::generatePopulationQuestion()` | ✅ Ported |
| `generateAreaQuestion()` | `Wikidata::generateAreaQuestion()` | ✅ Ported |
| `generateInventionQuestion()` | `Wikidata::generateInventionQuestion()` | ✅ Ported |
| `generateElementQuestion()` | `Wikidata::generateElementQuestion()` | ✅ Ported |
| `generateAuthorQuestion()` | `Wikidata::generateAuthorQuestion()` | ✅ Ported |
| `generateMountainQuestion()` | `Wikidata::generateMountainQuestion()` | ✅ Ported |
| `generateFlagQuestion()` | `Wikidata::generateFlagQuestion()` | ✅ Ported |
| `generateArtworkQuestion()` | `Wikidata::generateArtworkQuestion()` | ✅ Ported |
| `generateLandmarkQuestion()` | `Wikidata::generateLandmarkQuestion()` | ✅ Ported |
| `getBackupQuestion()` | `Wikidata::getBackupQuestion()` | ✅ Ported |
| `formatPopulation()` | `Wikidata::formatPopulation()` | ✅ Ported |
| `getCommonsImageUrl()` | `Wikidata::getCommonsImageUrl()` | ✅ Ported |

**Key Differences:**
- PHP uses `file_get_contents()` with stream contexts instead of `fetch()`
- Error handling uses exceptions instead of try-catch with async/await
- Session management is built-in to PHP (no localStorage needed)
- Number formatting uses `number_format()` instead of `toLocaleString()`

### Testing

Run the test suite to validate the implementation:

```bash
php test-api.php
```

This will test:
- ✅ Wikidata question generation (with fallback)
- ✅ Game service initialization
- ✅ Question retrieval
- ✅ Answer validation (correct/incorrect)
- ✅ Lifeline functionality (50:50)
- ✅ Leaderboard storage

## Customization

### Changing Styles

All pages use Tailwind CSS classes. To modify styles:
1. Locate the template file in `templates/`
2. Update the Tailwind utility classes
3. Refer to [Tailwind CSS documentation](https://tailwindcss.com/docs) for available classes

### Modifying Layout

To change the global layout:
- Edit `templates/layout.php` for overall structure
- Edit `templates/partials/header.php` for head section/CDN
- Edit `templates/partials/footer.php` for closing elements

## Contributing

1. Follow the existing template structure
2. Add documentation comments to all PHP files
3. Use consistent naming conventions
4. Test all navigation links

## License

© 2025 WikiMillionaire. Game created by Daniel Yepez Garces