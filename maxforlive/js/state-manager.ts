/**
 * @fileoverview State Manager - Lightweight state management for genre system
 * @module state-manager
 */

/**
 * State interface for genre system
 */
export interface GenreState {
    selectedGenre: string;
    selectedSubGenre: string;
    recentSelections: Array<{ genre: string; subGenre: string; timestamp: number }>;
    searchQuery: string;
    isSearchActive: boolean;
    uiState: {
        subGenreVisible: boolean;
        tooltipVisible: boolean;
    };
}

/**
 * State change listener type
 */
export type StateListener = (state: GenreState) => void;

/**
 * Lightweight state manager for genre system
 * Similar to Redux but simpler and tailored for this use case
 */
export class StateManager {
    private state: GenreState;
    private listeners: Set<StateListener> = new Set();

    constructor(initialState: Partial<GenreState> = {}) {
        this.state = {
            selectedGenre: initialState.selectedGenre || '',
            selectedSubGenre: initialState.selectedSubGenre || '',
            recentSelections: initialState.recentSelections || [],
            searchQuery: initialState.searchQuery || '',
            isSearchActive: initialState.isSearchActive || false,
            uiState: {
                subGenreVisible: initialState.uiState?.subGenreVisible || false,
                tooltipVisible: initialState.uiState?.tooltipVisible || false,
                ...initialState.uiState
            }
        };
    }

    /**
     * Get current state
     */
    getState(): Readonly<GenreState> {
        return { ...this.state };
    }

    /**
     * Update state (immutable update)
     */
    setState(updates: Partial<GenreState>): void {
        this.state = {
            ...this.state,
            ...updates,
            uiState: {
                ...this.state.uiState,
                ...(updates.uiState || {})
            }
        };
        this.notifyListeners();
    }

    /**
     * Update state with a function (for complex updates)
     */
    updateState(updater: (state: GenreState) => Partial<GenreState>): void {
        const updates = updater(this.getState());
        this.setState(updates);
    }

    /**
     * Subscribe to state changes
     */
    subscribe(listener: StateListener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Notify all listeners of state change
     */
    private notifyListeners(): void {
        this.listeners.forEach(listener => {
            try {
                listener(this.getState());
            } catch (error) {
                logger.error('Error in listener', error);
            }
        });
    }

    /**
     * Select genre
     */
    selectGenre(genre: string): void {
        this.setState({
            selectedGenre: genre,
            selectedSubGenre: '' // Reset sub-genre when genre changes
        });
    }

    /**
     * Select sub-genre
     */
    selectSubGenre(subGenre: string): void {
        this.setState({
            selectedSubGenre: subGenre
        });
    }

    /**
     * Set search query
     */
    setSearchQuery(query: string): void {
        this.setState({
            searchQuery: query,
            isSearchActive: query.length > 0
        });
    }

    /**
     * Clear search
     */
    clearSearch(): void {
        this.setState({
            searchQuery: '',
            isSearchActive: false
        });
    }

    /**
     * Add recent selection
     */
    addRecentSelection(genre: string, subGenre: string): void {
        const newSelection = {
            genre,
            subGenre,
            timestamp: Date.now()
        };

        // Remove existing entry if present
        const filtered = this.state.recentSelections.filter(
            item => !(item.genre === genre && item.subGenre === subGenre)
        );

        // Add to beginning and limit to 5
        const updated = [newSelection, ...filtered].slice(0, 5);

        this.setState({
            recentSelections: updated
        });
    }

    /**
     * Clear recent selections
     */
    clearRecentSelections(): void {
        this.setState({
            recentSelections: []
        });
    }

    /**
     * Set UI state
     */
    setUIState(uiState: Partial<GenreState['uiState']>): void {
        this.setState({
            uiState: {
                ...this.state.uiState,
                ...uiState
            }
        });
    }
}

