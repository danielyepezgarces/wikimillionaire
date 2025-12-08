# WikiMillionaire PHP

A "Who Wants to Be a Millionaire?" style quiz game built with PHP and styled with Tailwind CSS, using real data from Wikidata.

## Features

- 🎨 Modern, responsive UI built with Tailwind CSS (via CDN)
- 📱 Mobile-friendly design
- 🎯 Modular template system for easy maintenance
- 🔄 Clean PHP architecture with reusable components
- 📊 Leaderboard system
- 🎮 Interactive gameplay

## Project Structure

```
wikimillionairephp/
├── index.php              # Homepage entry point
├── play.php               # Game/play page entry point
├── leaderboard.php        # Leaderboard page entry point
└── templates/
    ├── layout.php         # Base layout wrapper
    ├── index.php          # Homepage content template
    ├── play.php           # Play page content template
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
- Web server (Apache, Nginx, or PHP built-in server)

### Development Server

```bash
# Start PHP built-in server
php -S localhost:8000

# Open in browser
# Navigate to http://localhost:8000/index.php
```

### Production Deployment

1. Upload all files to your web server
2. Ensure PHP is enabled
3. Configure your web server to serve the root directory
4. Set `index.php` as the default document

## Navigation

- **Homepage** (`index.php`): Game introduction and features
- **Play** (`play.php`): Player registration and game start
- **Leaderboard** (`leaderboard.php`): Rankings and scores

All navigation links are functional and use relative paths.

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