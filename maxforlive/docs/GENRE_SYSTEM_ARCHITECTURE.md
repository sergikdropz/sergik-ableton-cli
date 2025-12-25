# Genre System Architecture

## Overview

The Genre System is a modular, extensible architecture for managing genre and sub-genre selection in the SERGIK AI Controller Preview interface. It provides a clean separation of concerns with testable, maintainable code.

## System Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    GenreSystem (Coordinator)                │
│  - Initializes all components                               │
│  - Coordinates interactions                                 │
│  - Manages lifecycle                                        │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ GenreManager │   │UIController  │   │ GenreSearch  │
│              │   │              │   │              │
│ - Business   │   │ - DOM        │   │ - Filtering  │
│   Logic      │   │   Management │   │ - Search UI  │
│ - Data       │   │ - Events     │   │              │
│   Access     │   │ - State      │   │              │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │
        │                   │
        ▼                   ▼
┌──────────────┐   ┌──────────────┐
│    Config    │   │  DOM Elements│
│              │   │              │
│ - Genre Map  │   │ - genreSelect│
│ - Settings   │   │ - subGenreSel │
│              │   │ - subGenreLn │
└──────────────┘   └──────────────┘
```

### Module Dependencies

```
genre-system.js
├── genre-manager.js
│   └── config.js
├── ui-controller.js
├── genre-search.js
│   └── genre-manager.js
├── recent-selections.js
├── genre-tooltips.js
│   └── genre-info.js
└── genre-visuals.js
    └── genre-info.js
```

## Core Components

### 1. GenreManager

**Purpose:** Core business logic for genre/sub-genre operations

**Responsibilities:**
- Retrieve sub-genres for a given genre
- Validate genre values
- Normalize sub-genre values
- Provide genre metadata

**Key Methods:**
```javascript
getSubGenres(genre: string): string[]
hasSubGenres(genre: string): boolean
isValidGenre(genre: string): boolean
normalizeSubGenreValue(subGenre: string): string
```

**Dependencies:**
- `config.js` - Genre mappings and configuration

### 2. UIController

**Purpose:** DOM manipulation and UI state management

**Responsibilities:**
- Show/hide sub-genre dropdown
- Update dropdown options
- Get/set selections
- Manage UI state

**Key Methods:**
```javascript
showSubGenreDropdown(): void
hideSubGenreDropdown(): void
updateSubGenreDropdown(subGenres: string[], normalizeFn: Function): void
getSelectedGenre(): string
getSelectedSubGenre(): string
```

**Dependencies:**
- DOM elements (genreSelect, subGenreSelect, subGenreLine)

### 3. GenreSystem

**Purpose:** Main coordinator and entry point

**Responsibilities:**
- Initialize all components
- Coordinate component interactions
- Handle genre change events
- Provide public API

**Key Methods:**
```javascript
initialize(elements: Object): void
updateSubGenres(genre: string): void
getSelection(): Object
```

**Dependencies:**
- All other components

### 4. GenreSearch

**Purpose:** Search and filter functionality

**Responsibilities:**
- Filter genres based on query
- Maintain original options
- Provide search UI
- Handle keyboard shortcuts

**Key Methods:**
```javascript
filterGenres(query: string): void
clearSearch(): void
focus(): void
```

**Dependencies:**
- `GenreManager` - For genre data
- DOM elements

### 5. RecentSelections

**Purpose:** Track and display recent selections

**Responsibilities:**
- Store recent selections in localStorage
- Display recent selections UI
- Handle selection clicks
- Manage storage

**Key Methods:**
```javascript
addSelection(genre: string, subGenre: string): void
getSelections(): Array
clear(): void
createUI(container: HTMLElement, onSelect: Function): void
```

**Dependencies:**
- localStorage API

### 6. GenreTooltips

**Purpose:** Display genre information tooltips

**Responsibilities:**
- Show tooltips on hover/focus
- Display BPM ranges
- Show genre descriptions
- Position tooltips correctly

**Key Methods:**
```javascript
showTooltip(genre: string, target: HTMLElement): void
hideTooltip(): void
```

**Dependencies:**
- `genre-info.js` - Genre metadata

### 7. GenreVisuals

**Purpose:** Visual indicators and styling

**Responsibilities:**
- Apply category colors
- Display BPM badges
- Add category icons
- Update visual state

**Key Methods:**
```javascript
updateVisuals(): void
getColorForGenre(genre: string): string
getIconForGenre(genre: string): string
```

**Dependencies:**
- `genre-info.js` - For BPM data

## Data Flow

### Genre Selection Flow

```
User selects genre
    │
    ▼
GenreSystem.handleGenreChange()
    │
    ├──► GenreManager.getSubGenres()
    │         │
    │         └──► Returns sub-genre array
    │
    ├──► UIController.updateSubGenreDropdown()
    │         │
    │         ├──► Populates options
    │         └──► Shows/hides dropdown
    │
    ├──► GenreVisuals.updateVisuals()
    │         │
    │         ├──► Updates colors
    │         └──► Updates badges
    │
    └──► RecentSelections.addSelection()
            │
            └──► Saves to localStorage
```

### Search Flow

```
User types in search
    │
    ▼
GenreSearch.filterGenres()
    │
    ├──► Filters originalOptions
    │
    ├──► Groups by optgroup
    │
    └──► Updates genreSelect.innerHTML
```

## Configuration

### Configuration Object

```javascript
{
    // Core settings
    defaultGenre: 'house',
    subGenreMap: { ... },
    
    // Feature flags
    enableSearch: true,
    enableRecentSelections: true,
    enableTooltips: true,
    enableVisuals: true,
    
    // Debugging
    enableLogging: true,
    enableErrorHandling: true
}
```

### Feature Flags

All features can be enabled/disabled via configuration:

```javascript
const config = {
    enableSearch: false,           // Disable search
    enableRecentSelections: true,  // Enable recent selections
    enableTooltips: true,          // Enable tooltips
    enableVisuals: false          // Disable visuals
};

const system = new GenreSystem(config);
```

## Event Flow

### Initialization Sequence

```
1. DOMContentLoaded
    │
    ▼
2. initializeGenreSystem()
    │
    ├──► Create GenreSystem instance
    │
    ├──► Get DOM elements
    │
    ├──► system.initialize()
    │     │
    │     ├──► Create UIController
    │     │
    │     ├──► Create GenreSearch (if enabled)
    │     │
    │     ├──► Create RecentSelections (if enabled)
    │     │
    │     ├──► Create GenreTooltips (if enabled)
    │     │
    │     ├──► Create GenreVisuals (if enabled)
    │     │
    │     └──► Set up event listeners
    │
    └──► Update sub-genres for default genre
```

### Genre Change Event

```
User changes genre selection
    │
    ▼
genreSelect 'change' event
    │
    ▼
GenreSystem.handleGenreChange()
    │
    ├──► Validate genre
    │
    ├──► Update sub-genres
    │
    ├──► Update visuals
    │
    └──► Track in recent selections
```

## Error Handling Strategy

### Input Validation

All user inputs are validated:

```javascript
// GenreManager
getSubGenres(genre) {
    if (!genre || typeof genre !== 'string') {
        return [];  // Safe fallback
    }
    // ... process
}
```

### DOM Safety

All DOM operations check for element existence:

```javascript
// UIController
updateSubGenreDropdown(subGenres) {
    if (!this.subGenreSelect) {
        console.error('Element not found');
        return;  // Early return
    }
    // ... process
}
```

### Try-Catch Blocks

Critical operations wrapped in try-catch:

```javascript
// GenreSystem
updateSubGenres(genre) {
    try {
        // ... operations
    } catch (error) {
        console.error('Error updating sub-genres', error);
        this.uiController.hideSubGenreDropdown();  // Safe fallback
    }
}
```

## Testing Architecture

### Test Structure

```
tests/
├── genre-manager.test.js    # Unit tests
├── ui-controller.test.js    # Unit tests
└── integration.test.js      # Integration tests
```

### Test Coverage

- **Unit Tests:** Test individual classes in isolation
- **Integration Tests:** Test component interactions
- **Coverage Target:** 90%+ for core classes

## Performance Considerations

### Optimizations

1. **Lazy Initialization:** Features only initialize if enabled
2. **Cached DOM Queries:** Elements cached after first access
3. **Event Debouncing:** Search input uses native debouncing
4. **Efficient Updates:** Batch DOM operations

### Memory Management

- Event listeners properly cleaned up
- No memory leaks from closures
- Weak references where appropriate

## Extension Points

### Adding New Features

1. Create new module in `js/` directory
2. Export class/function
3. Import in `genre-system.js`
4. Initialize in `GenreSystem.initialize()`
5. Add configuration flag
6. Write tests

### Adding New Genres

1. Update `config.js` - Add to `subGenreMap`
2. Update HTML - Add option to appropriate optgroup
3. (Optional) Update `genre-info.js` - Add metadata
4. (Optional) Update `genre-visuals.js` - Add category mapping

## Browser Compatibility

### Supported Browsers

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

### ES6 Features Used

- ES6 Modules (`import`/`export`)
- Classes
- Arrow functions
- Template literals
- Destructuring
- `const`/`let`

### Polyfills

No polyfills required for modern browsers. For older browser support, consider:
- Babel for transpilation
- Polyfill for ES6 modules (if needed)

## Security Considerations

### Input Sanitization

- All user inputs validated
- No direct innerHTML with user data
- XSS prevention through proper escaping

### LocalStorage

- Data stored in localStorage is validated
- No sensitive information stored
- Error handling for quota exceeded

## Future Architecture Considerations

### Potential Improvements

1. **State Management:** Consider Redux/Vuex for complex state
2. **Virtual DOM:** For better performance with many options
3. **Web Components:** For better encapsulation
4. **TypeScript:** For type safety
5. **Build System:** For bundling and optimization

## Conclusion

The Genre System architecture provides:

- ✅ **Modularity:** Clear separation of concerns
- ✅ **Testability:** Easy to unit test components
- ✅ **Extensibility:** Simple to add new features
- ✅ **Maintainability:** Well-documented and organized
- ✅ **Performance:** Optimized for efficiency
- ✅ **Reliability:** Comprehensive error handling

