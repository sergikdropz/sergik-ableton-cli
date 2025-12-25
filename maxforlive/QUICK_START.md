# Quick Start Guide

## Installation

```bash
cd maxforlive
npm install
```

## Development

Start the development server with hot module replacement:

```bash
npm run dev
```

This will:
- Start Vite dev server on http://localhost:8000
- Enable hot module replacement (HMR)
- Open browser automatically
- Watch for file changes

## Testing

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Building

Build for production:

```bash
npm run build
```

Output will be in `dist/` directory:
- `dist/SERGIK_AI_Controller_Preview.html` - Main HTML file
- `dist/js/main.js` - Bundled and minified JavaScript
- Source maps included for debugging

Preview production build:

```bash
npm run preview
```

## Type Checking

Check TypeScript types:

```bash
npm run type-check
```

## Usage Examples

### Basic Usage (Original System)

```javascript
import { initializeGenreSystem } from './js/genre-system.js';
initializeGenreSystem();
```

### Enhanced Usage (With State Management)

```typescript
import { initializeEnhancedGenreSystem } from './js/genre-system-enhanced.js';

const system = initializeEnhancedGenreSystem({
    enableSearch: true,
    enableRecentSelections: true,
    enableTooltips: true,
    enableVisuals: true
});

// Subscribe to state changes
system?.getStateManager().subscribe((state) => {
    console.log('Current selection:', state.selectedGenre, state.selectedSubGenre);
});
```

### With Virtual DOM

```typescript
const system = initializeEnhancedGenreSystem(
    { enableSearch: true },
    true  // Enable virtual DOM for better performance
);
```

### With Web Components

```html
<genre-selector id="my-selector"></genre-selector>

<script type="module">
    import './js/components/genre-selector.js';
    
    const selector = document.getElementById('my-selector');
    selector.addEventListener('genre-change', (e) => {
        console.log('Genre changed:', e.detail);
    });
</script>
```

## File Structure

```
maxforlive/
├── js/                          # JavaScript/TypeScript modules
│   ├── config.js               # Configuration
│   ├── genre-manager.js        # Core logic
│   ├── ui-controller.js        # UI management
│   ├── genre-system.js        # Main coordinator
│   ├── genre-system-enhanced.ts # Enhanced with state/Virtual DOM
│   ├── state-manager.ts        # State management
│   ├── virtual-dom.ts          # Virtual DOM
│   └── components/             # Web Components
├── tests/                       # Test files
├── dist/                        # Production build output
└── docs/                        # Documentation
```

## Troubleshooting

### CORS Errors
- Make sure you're using `npm run dev` (not opening file:// directly)
- Vite dev server handles CORS automatically

### Module Not Found
- Run `npm install` to install dependencies
- Check that all files in `js/` directory exist

### Tests Failing
- Make sure dependencies are installed: `npm install`
- Check that jsdom is working: tests use jsdom for DOM simulation

### Build Errors
- Check TypeScript errors: `npm run type-check`
- Ensure all imports are correct
- Check that all dependencies are installed

## Next Steps

1. **Start Development:**
   ```bash
   npm run dev
   ```

2. **Explore the Code:**
   - Check `js/genre-system.js` for main logic
   - See `js/genre-system-enhanced.ts` for advanced features
   - Review `tests/` for usage examples

3. **Customize:**
   - Add new genres in `js/config.js`
   - Modify styles in HTML file
   - Extend functionality in modules

## Support

For more information, see:
- `ARCHITECTURE_ENHANCEMENTS.md` - Architecture details
- `GENRE_DROPDOWN_ENHANCEMENT_REPORT.md` - Feature documentation
- `docs/GENRE_SYSTEM_ARCHITECTURE.md` - System architecture

