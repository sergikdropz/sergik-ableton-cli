/**
 * TestUtils Class
 * 
 * Testing utilities and integration test helpers.
 */

class TestUtils {
    constructor() {
        this.mockResponses = new Map();
        this.testData = null;
    }

    /**
     * Mock API response
     * @param {string} url - URL pattern
     * @param {Object} response - Mock response
     */
    mockResponse(url, response) {
        this.mockResponses.set(url, response);
    }

    /**
     * Clear all mocks
     */
    clearMocks() {
        this.mockResponses.clear();
    }

    /**
     * Generate test media items
     * @param {number} count - Number of items
     * @returns {Array} Test media items
     */
    generateTestMediaItems(count = 10) {
        const items = [];
        const types = ['audio', 'midi'];
        const keys = ['C', 'D', 'E', 'F', 'G', 'A', 'B', '10B', '7A', '11B'];
        const genres = ['house', 'techno', 'trap', 'hiphop', 'funk'];

        for (let i = 0; i < count; i++) {
            items.push({
                id: `test-media-${i}`,
                name: `Test Sample ${i + 1}.wav`,
                path: `/test/samples/sample_${i + 1}.wav`,
                type: types[i % types.length],
                bpm: 120 + (i % 40),
                key: keys[i % keys.length],
                duration: 4 + (i % 8),
                sample_rate: 44100,
                genre: genres[i % genres.length]
            });
        }

        return items;
    }

    /**
     * Create test DOM structure
     * @param {number} itemCount - Number of items
     */
    createTestDOM(itemCount = 10) {
        // Create media list container if it doesn't exist
        let mediaList = document.getElementById('media-list');
        if (!mediaList) {
            mediaList = document.createElement('div');
            mediaList.id = 'media-list';
            document.body.appendChild(mediaList);
        }

        // Clear existing items
        mediaList.innerHTML = '';

        // Create test items
        const items = this.generateTestMediaItems(itemCount);
        items.forEach(item => {
            const element = document.createElement('div');
            element.className = 'browser-item';
            element.setAttribute('data-media-id', item.id);
            element.setAttribute('data-media-type', item.type);
            element.setAttribute('data-media-path', item.path);
            element.setAttribute('data-bpm', item.bpm);
            element.setAttribute('data-key', item.key);
            element.setAttribute('data-duration', item.duration);
            
            element.innerHTML = `
                <span class="item-icon">🎵</span>
                <span class="item-name">${item.name}</span>
                <span class="item-type">${item.type}</span>
                <span class="item-time">${item.duration}s</span>
            `;
            
            mediaList.appendChild(element);
        });

        return items;
    }

    /**
     * Simulate search
     * @param {string} query - Search query
     * @returns {Promise} Search results
     */
    async simulateSearch(query) {
        // Use mock if available
        if (this.mockResponses.has(query)) {
            return this.mockResponses.get(query);
        }

        // Generate test results
        const items = this.generateTestMediaItems(5);
        return {
            status: 'ok',
            query: query,
            items: items,
            count: items.length
        };
    }

    /**
     * Simulate media load
     * @param {string} mediaId - Media ID
     * @returns {Promise} Load result
     */
    async simulateLoad(mediaId) {
        return {
            status: 'ok',
            mediaId: mediaId,
            loaded: true
        };
    }

    /**
     * Wait for condition
     * @param {Function} condition - Condition function
     * @param {number} timeout - Timeout in ms
     * @param {number} interval - Check interval in ms
     * @returns {Promise} Resolves when condition is true
     */
    async waitFor(condition, timeout = 5000, interval = 100) {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            if (condition()) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }

        throw new Error('Timeout waiting for condition');
    }

    /**
     * Measure performance
     * @param {Function} fn - Function to measure
     * @returns {Promise<number>} Duration in ms
     */
    async measurePerformance(fn) {
        const start = performance.now();
        await fn();
        const duration = performance.now() - start;
        return duration;
    }

    /**
     * Run integration test
     * @param {string} name - Test name
     * @param {Function} testFn - Test function
     * @returns {Promise<Object>} Test result
     */
    async runTest(name, testFn) {
        const start = performance.now();
        let passed = false;
        let error = null;

        try {
            await testFn();
            passed = true;
        } catch (e) {
            error = e;
        }

        const duration = performance.now() - start;

        return {
            name: name,
            passed: passed,
            duration: duration,
            error: error
        };
    }

    /**
     * Run test suite
     * @param {Array} tests - Array of {name, fn} test objects
     * @returns {Promise<Array>} Test results
     */
    async runTestSuite(tests) {
        const results = [];

        for (const test of tests) {
            const result = await this.runTest(test.name, test.fn);
            results.push(result);
        }

        return results;
    }
}

// Export for use in other modules
if (typeof window !== "undefined") {
    window.TestUtils = TestUtils;
    window.testUtils = new TestUtils();
}

// For Node.js/CommonJS
if (typeof module !== "undefined" && module.exports) {
    module.exports = TestUtils;
}

