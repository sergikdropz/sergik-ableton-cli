/**
 * Library Tab Enhancements Initialization
 * 
 * Coordinates initialization of all library tab enhancement modules.
 */

export function initializeLibraryTabEnhancements() {
    console.log('[Library Tab Enhancements] Starting initialization...');
    
    const initStatus = {
        enhancedSearchParser: false,
        advancedFilters: false,
        enhancedMediaDisplay: false,
        favoritesCollections: false,
        libraryDragDrop: false,
        libraryKeyboardShortcuts: false
    };
    
    // Phase 1: Foundation
    try {
        if (typeof EnhancedSearchParser !== 'undefined') {
            window.enhancedSearchParser = new EnhancedSearchParser();
            // Use enhanced parser if available, fallback to regular
            if (window.searchParser && window.enhancedSearchParser) {
                // Enhance existing parser with fuzzy matching
                const originalGetSuggestions = window.searchParser.getSuggestions.bind(window.searchParser);
                window.searchParser.getEnhancedSuggestions = window.enhancedSearchParser.getEnhancedSuggestions.bind(window.enhancedSearchParser);
                window.searchParser.parseWithFuzzy = window.enhancedSearchParser.parseWithFuzzy.bind(window.enhancedSearchParser);
            }
            initStatus.enhancedSearchParser = true;
            console.log('[Library Tab Enhancements] Enhanced Search Parser initialized');
        }
    } catch (err) {
        console.warn('[Library Tab Enhancements] Enhanced Search Parser initialization failed:', err);
    }
    
    try {
        if (typeof AdvancedFilters !== 'undefined') {
            const filterBar = document.querySelector('.filter-bar') || document.getElementById('filter-bar');
            if (filterBar) {
                window.advancedFilters = new AdvancedFilters('filter-bar');
                initStatus.advancedFilters = true;
                console.log('[Library Tab Enhancements] Advanced Filters initialized');
            } else {
                console.warn('[Library Tab Enhancements] Filter bar not found, Advanced Filters skipped');
            }
        }
    } catch (err) {
        console.warn('[Library Tab Enhancements] Advanced Filters initialization failed:', err);
    }
    
    // Phase 2: Core Enhancements
    // NOTE: EnhancedMediaDisplay is initialized early in initializeLibraryTab()
    // before BrowserList is created, to ensure prototype override is in place
    // Check if it's already initialized, if not, initialize it here
    try {
        if (typeof EnhancedMediaDisplay !== 'undefined') {
            if (!window.enhancedMediaDisplay) {
                window.enhancedMediaDisplay = new EnhancedMediaDisplay();
                // Ensure BrowserList override is set up
                if (window.enhancedMediaDisplay.setupEnhancedRendering) {
                    window.enhancedMediaDisplay.setupEnhancedRendering();
                }
            }
            initStatus.enhancedMediaDisplay = true;
            console.log('[Library Tab Enhancements] Enhanced Media Display verified/initialized');
        }
    } catch (err) {
        console.warn('[Library Tab Enhancements] Enhanced Media Display initialization failed:', err);
    }
    
    try {
        if (typeof FavoritesCollections !== 'undefined') {
            window.favoritesCollections = new FavoritesCollections();
            // Update favorites UI for any existing items
            setTimeout(() => {
                if (window.favoritesCollections && window.favoritesCollections.updateAllFavoriteUI) {
                    window.favoritesCollections.updateAllFavoriteUI();
                }
            }, 200);
            initStatus.favoritesCollections = true;
            console.log('[Library Tab Enhancements] Favorites & Collections initialized');
        }
    } catch (err) {
        console.warn('[Library Tab Enhancements] Favorites & Collections initialization failed:', err);
    }
    
    // Phase 3: Advanced Features
    try {
        if (typeof LibraryDragDrop !== 'undefined') {
            window.libraryDragDrop = new LibraryDragDrop();
            
            // Ensure LibraryHandlers is accessible for drag-drop
            // Try to get from controllerHandlers if available
            if (window.controllerHandlers && window.controllerHandlers.handlers && window.controllerHandlers.handlers.library) {
                window.libraryHandlers = window.controllerHandlers.handlers.library;
            } else if (typeof LibraryHandlers !== 'undefined') {
                // Try to create instance if class is available
                const apiBaseUrl = window.API_BASE_URL || 'http://127.0.0.1:8000';
                try {
                    window.libraryHandlers = new LibraryHandlers(apiBaseUrl);
                } catch (e) {
                    console.warn('[Library Tab Enhancements] Could not create LibraryHandlers instance:', e);
                }
            }
            
            // Make existing items draggable
            setTimeout(() => {
                if (window.libraryDragDrop && window.libraryDragDrop.makeItemsDraggable) {
                    window.libraryDragDrop.makeItemsDraggable();
                }
            }, 500);
            initStatus.libraryDragDrop = true;
            console.log('[Library Tab Enhancements] Drag & Drop initialized');
        }
    } catch (err) {
        console.warn('[Library Tab Enhancements] Drag & Drop initialization failed:', err);
    }
    
    try {
        if (typeof LibraryKeyboardShortcuts !== 'undefined') {
            window.libraryKeyboardShortcuts = new LibraryKeyboardShortcuts();
            initStatus.libraryKeyboardShortcuts = true;
            console.log('[Library Tab Enhancements] Keyboard Shortcuts initialized');
        }
    } catch (err) {
        console.warn('[Library Tab Enhancements] Keyboard Shortcuts initialization failed:', err);
    }
    
    // Log initialization summary
    const successCount = Object.values(initStatus).filter(v => v).length;
    const totalCount = Object.keys(initStatus).length;
    
    console.log(`[Library Tab Enhancements] Initialization complete: ${successCount}/${totalCount} modules loaded`);
    
    // Dispatch initialization complete event
    document.dispatchEvent(new CustomEvent('libraryTabEnhancementsInitialized', {
        detail: { status: initStatus }
    }));
    
    return initStatus;
}

// Auto-initialize when Library tab becomes active
if (typeof document !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupAutoInit);
    } else {
        setupAutoInit();
    }
    
    function setupAutoInit() {
        const libraryTab = document.getElementById('tab-section-library');
        if (libraryTab) {
            // Check if already active
            if (libraryTab.classList.contains('active')) {
                setTimeout(() => {
                    if (typeof initializeLibraryTabEnhancements === 'function') {
                        initializeLibraryTabEnhancements();
                    }
                }, 100);
            }
            
            // Observe for tab activation
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        if (libraryTab.classList.contains('active')) {
                            // Delay to ensure other components are ready
                            setTimeout(() => {
                                if (typeof initializeLibraryTabEnhancements === 'function') {
                                    initializeLibraryTabEnhancements();
                                }
                            }, 100);
                        }
                    }
                });
            });
            observer.observe(libraryTab, { attributes: true });
        }
    }
}

// Export for use in other modules
if (typeof window !== "undefined") {
    window.initializeLibraryTabEnhancements = initializeLibraryTabEnhancements;
}

// For Node.js/CommonJS
if (typeof module !== "undefined" && module.exports) {
    module.exports = { initializeLibraryTabEnhancements };
}

