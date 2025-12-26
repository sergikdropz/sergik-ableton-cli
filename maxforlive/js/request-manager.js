/**
 * RequestManager Class
 * 
 * Manages HTTP requests with debouncing, cancellation, and queuing.
 */

export class RequestManager {
    constructor() {
        this.pendingRequests = new Map();
        this.requestQueue = [];
        this.isProcessingQueue = false;
        this.maxConcurrentRequests = 3;
        this.activeRequests = 0;
    }

    /**
     * Debounced request
     * @param {string} key - Request key (for debouncing)
     * @param {Function} requestFn - Function that returns a Promise
     * @param {number} delay - Debounce delay in ms
     * @returns {Promise} Request result
     */
    debounce(key, requestFn, delay = 300) {
        // Cancel previous request with same key
        if (this.pendingRequests.has(key)) {
            const { timeout, controller } = this.pendingRequests.get(key);
            clearTimeout(timeout);
            controller.abort();
            this.pendingRequests.delete(key);
        }

        // Create new abort controller
        const controller = new AbortController();

        // Create promise
        const promise = new Promise((resolve, reject) => {
            const timeout = setTimeout(async () => {
                try {
                    const result = await requestFn(controller.signal);
                    this.pendingRequests.delete(key);
                    resolve(result);
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        this.pendingRequests.delete(key);
                        reject(error);
                    }
                }
            }, delay);

            this.pendingRequests.set(key, { timeout, controller });
        });

        return promise;
    }

    /**
     * Cancel request by key
     * @param {string} key - Request key
     */
    cancel(key) {
        if (this.pendingRequests.has(key)) {
            const { timeout, controller } = this.pendingRequests.get(key);
            clearTimeout(timeout);
            controller.abort();
            this.pendingRequests.delete(key);
        }
    }

    /**
     * Cancel all pending requests
     */
    cancelAll() {
        for (const [key, { timeout, controller }] of this.pendingRequests.entries()) {
            clearTimeout(timeout);
            controller.abort();
        }
        this.pendingRequests.clear();
    }

    /**
     * Queue request for sequential processing
     * @param {Function} requestFn - Function that returns a Promise
     * @param {number} priority - Priority (higher = first)
     * @returns {Promise} Request result
     */
    queue(requestFn, priority = 0) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({
                fn: requestFn,
                priority: priority,
                resolve: resolve,
                reject: reject
            });

            // Sort by priority (higher first)
            this.requestQueue.sort((a, b) => b.priority - a.priority);

            // Process queue if not already processing
            if (!this.isProcessingQueue) {
                this.processQueue();
            }
        });
    }

    /**
     * Process request queue
     */
    async processQueue() {
        if (this.isProcessingQueue || this.requestQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;

        while (this.requestQueue.length > 0) {
            // Wait if at max concurrent requests
            while (this.activeRequests >= this.maxConcurrentRequests) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            const request = this.requestQueue.shift();
            this.activeRequests++;

            request.fn()
                .then(result => {
                    this.activeRequests--;
                    request.resolve(result);
                })
                .catch(error => {
                    this.activeRequests--;
                    request.reject(error);
                });
        }

        this.isProcessingQueue = false;
    }

    /**
     * Make HTTP request with automatic cancellation
     * @param {string} url - Request URL
     * @param {Object} options - Fetch options
     * @param {string} key - Request key (for cancellation)
     * @returns {Promise} Response
     */
    async fetch(url, options = {}, key = null) {
        const controller = new AbortController();
        const requestKey = key || url;

        // Cancel previous request with same key
        if (this.pendingRequests.has(requestKey)) {
            const prevController = this.pendingRequests.get(requestKey).controller;
            prevController.abort();
        }

        // Store controller
        this.pendingRequests.set(requestKey, { controller, timeout: null });

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });

            this.pendingRequests.delete(requestKey);
            return response;
        } catch (error) {
            this.pendingRequests.delete(requestKey);
            if (error.name === 'AbortError') {
                throw new Error('Request cancelled');
            }
            throw error;
        }
    }

    /**
     * Get active request count
     * @returns {number} Active request count
     */
    getActiveRequestCount() {
        return this.activeRequests;
    }

    /**
     * Get pending request count
     * @returns {number} Pending request count
     */
    getPendingRequestCount() {
        return this.pendingRequests.size;
    }

    /**
     * Get queue length
     * @returns {number} Queue length
     */
    getQueueLength() {
        return this.requestQueue.length;
    }
}

// Export for use in other modules
if (typeof window !== "undefined") {
    window.RequestManager = RequestManager;
    window.requestManager = new RequestManager();
}

// For Node.js/CommonJS
if (typeof module !== "undefined" && module.exports) {
    module.exports = RequestManager;
}

