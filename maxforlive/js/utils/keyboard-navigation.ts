/**
 * @fileoverview Keyboard navigation utilities for accessible dropdowns
 * @module utils/keyboard-navigation
 */

export interface KeyboardNavigationOptions {
    onSelect?: (index: number) => void;
    onEscape?: () => void;
    onEnter?: (index: number) => void;
    cycle?: boolean; // Whether to cycle through options
}

/**
 * Handle keyboard navigation for dropdown elements
 */
export class KeyboardNavigation {
    private selectElement: HTMLSelectElement;
    private options: HTMLOptionElement[] = [];
    private currentIndex: number = -1;
    private options_: KeyboardNavigationOptions;

    constructor(selectElement: HTMLSelectElement, options: KeyboardNavigationOptions = {}) {
        this.selectElement = selectElement;
        this.options_ = options;
        this.setup();
    }

    /**
     * Setup keyboard event listeners
     */
    private setup(): void {
        this.selectElement.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.selectElement.addEventListener('focus', () => this.handleFocus());
        this.selectElement.addEventListener('blur', () => this.handleBlur());
        
        // Update options list when select changes
        this.updateOptions();
    }

    /**
     * Update the list of available options
     */
    updateOptions(): void {
        this.options = Array.from(this.selectElement.options);
        // Reset current index to selected option
        this.currentIndex = this.selectElement.selectedIndex >= 0 ? this.selectElement.selectedIndex : 0;
    }

    /**
     * Handle keydown events
     */
    private handleKeyDown(e: KeyboardEvent): void {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.navigateDown();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.navigateUp();
                break;
            case 'Home':
                e.preventDefault();
                this.navigateToFirst();
                break;
            case 'End':
                e.preventDefault();
                this.navigateToLast();
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.selectCurrent();
                break;
            case 'Escape':
                e.preventDefault();
                if (this.options_.onEscape) {
                    this.options_.onEscape();
                }
                this.selectElement.blur();
                break;
            default:
                // Handle type-ahead search
                if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
                    this.handleTypeAhead(e.key);
                }
                break;
        }
    }

    /**
     * Navigate down
     */
    private navigateDown(): void {
        if (this.options.length === 0) return;

        this.currentIndex++;
        if (this.currentIndex >= this.options.length) {
            if (this.options_.cycle) {
                this.currentIndex = 0;
            } else {
                this.currentIndex = this.options.length - 1;
            }
        }
        this.highlightOption(this.currentIndex);
    }

    /**
     * Navigate up
     */
    private navigateUp(): void {
        if (this.options.length === 0) return;

        this.currentIndex--;
        if (this.currentIndex < 0) {
            if (this.options_.cycle) {
                this.currentIndex = this.options.length - 1;
            } else {
                this.currentIndex = 0;
            }
        }
        this.highlightOption(this.currentIndex);
    }

    /**
     * Navigate to first option
     */
    private navigateToFirst(): void {
        if (this.options.length === 0) return;
        this.currentIndex = 0;
        this.highlightOption(this.currentIndex);
    }

    /**
     * Navigate to last option
     */
    private navigateToLast(): void {
        if (this.options.length === 0) return;
        this.currentIndex = this.options.length - 1;
        this.highlightOption(this.currentIndex);
    }

    /**
     * Select current option
     */
    private selectCurrent(): void {
        if (this.currentIndex >= 0 && this.currentIndex < this.options.length) {
            this.selectElement.selectedIndex = this.currentIndex;
            this.selectElement.dispatchEvent(new Event('change', { bubbles: true }));
            
            if (this.options_.onSelect) {
                this.options_.onSelect(this.currentIndex);
            }
            if (this.options_.onEnter) {
                this.options_.onEnter(this.currentIndex);
            }
        }
    }

    /**
     * Highlight option (for visual feedback)
     */
    private highlightOption(index: number): void {
        if (index >= 0 && index < this.options.length) {
            // Scroll option into view
            this.options[index].scrollIntoView({ block: 'nearest' });
            // Update selected index for visual feedback
            this.selectElement.selectedIndex = index;
        }
    }

    /**
     * Handle type-ahead search
     */
    private handleTypeAhead(char: string): void {
        const searchChar = char.toLowerCase();
        const startIndex = (this.currentIndex + 1) % this.options.length;
        
        // Search from current position
        for (let i = 0; i < this.options.length; i++) {
            const index = (startIndex + i) % this.options.length;
            const option = this.options[index];
            const text = option.textContent?.toLowerCase() || '';
            
            if (text.startsWith(searchChar)) {
                this.currentIndex = index;
                this.highlightOption(index);
                break;
            }
        }
    }

    /**
     * Handle focus event
     */
    private handleFocus(): void {
        this.updateOptions();
        this.currentIndex = this.selectElement.selectedIndex >= 0 ? this.selectElement.selectedIndex : 0;
        // Set ARIA attributes
        this.selectElement.setAttribute('aria-expanded', 'true');
    }

    /**
     * Handle blur event
     */
    private handleBlur(): void {
        // Set ARIA attributes
        this.selectElement.setAttribute('aria-expanded', 'false');
    }

    /**
     * Cleanup
     */
    destroy(): void {
        // Event listeners will be cleaned up when element is removed
        this.options = [];
    }
}

