# SERGIK AI Controller Preview - Setup Guide

## Running the Preview

The SERGIK AI Controller Preview uses ES6 modules, which require files to be served over HTTP/HTTPS (not `file://` protocol).

### Option 1: Python HTTP Server

```bash
cd maxforlive
python3 -m http.server 8000
```

Then open: `http://localhost:8000/SERGIK_AI_Controller_Preview.html`

### Option 2: Node.js HTTP Server

```bash
cd maxforlive
npx http-server -p 8000
```

Then open: `http://localhost:8000/SERGIK_AI_Controller_Preview.html`

### Option 3: VS Code Live Server

If using VS Code:
1. Install "Live Server" extension
2. Right-click on `SERGIK_AI_Controller_Preview.html`
3. Select "Open with Live Server"

## Testing

To run tests:

```bash
cd maxforlive
npm install  # First time only
npm test
```

For test coverage:

```bash
npm run test:coverage
```

## Development

The genre system is modular and located in `js/` directory:

- `config.js` - Configuration and genre mappings
- `genre-manager.js` - Core business logic
- `ui-controller.js` - DOM management
- `genre-system.js` - Main coordinator
- `genre-search.js` - Search functionality
- `recent-selections.js` - Recent selections
- `genre-tooltips.js` - Tooltips
- `genre-info.js` - Genre metadata
- `genre-visuals.js` - Visual indicators

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

**CORS Errors:**
- Make sure you're using a web server (not opening file:// directly)

**Module Not Found:**
- Check that all files in `js/` directory exist
- Verify import paths are correct

**Tests Not Running:**
- Run `npm install` to install dependencies
- Check that `vitest` is installed

