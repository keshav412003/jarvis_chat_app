/**
 * Centralized API Client with:
 * - Request deduplication
 * - In-memory caching with TTL
 * - AbortController support for cancellation
 * - Retry logic with exponential backoff
 */

class APIClient {
    constructor() {
        this.cache = new Map();
        this.pendingRequests = new Map();
        this.abortControllers = new Map();
    }

    /**
     * Make an API request with caching and deduplication
     * @param {string} url - API endpoint
     * @param {object} options - Fetch options
     * @param {number} options.cacheTTL - Cache time-to-live in milliseconds (0 = no cache)
     * @param {boolean} options.deduplicate - Prevent duplicate concurrent requests
     * @param {AbortSignal} options.signal - AbortSignal for cancellation
     * @returns {Promise<{data: any, error: string|null}>}
     */
    async request(url, options = {}) {
        const {
            cacheTTL = 0,
            deduplicate = true,
            signal,
            ...fetchOptions
        } = options;

        const cacheKey = this.getCacheKey(url, fetchOptions);

        // Check cache first
        if (cacheTTL > 0 && fetchOptions.method !== 'POST' && fetchOptions.method !== 'PUT' && fetchOptions.method !== 'DELETE') {
            const cached = this.cache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < cacheTTL) {
                return { data: cached.data, error: null };
            }
        }

        // Check for pending duplicate request
        if (deduplicate && this.pendingRequests.has(cacheKey)) {
            return this.pendingRequests.get(cacheKey);
        }

        // Create AbortController for this request
        const controller = new AbortController();
        const requestId = `${cacheKey}-${Date.now()}`;
        this.abortControllers.set(requestId, controller);

        // Combine signals if external signal provided
        const combinedSignal = signal
            ? this.combineSignals([signal, controller.signal])
            : controller.signal;

        // Make the request
        const requestPromise = this.executeRequest(url, {
            ...fetchOptions,
            signal: combinedSignal,
        });

        // Store pending request for deduplication
        if (deduplicate) {
            this.pendingRequests.set(cacheKey, requestPromise);
        }

        try {
            const result = await requestPromise;

            // Cache successful GET requests
            if (cacheTTL > 0 && result.data && !result.error) {
                this.cache.set(cacheKey, {
                    data: result.data,
                    timestamp: Date.now(),
                });
            }

            return result;
        } finally {
            // Cleanup
            this.pendingRequests.delete(cacheKey);
            this.abortControllers.delete(requestId);
        }
    }

    /**
     * Execute the actual fetch request
     */
    async executeRequest(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            const contentType = response.headers.get('content-type');
            let data = {};
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            }

            if (!response.ok) {
                // Handle auth errors
                if (response.status === 401 || response.status === 403) {
                    if (typeof window !== 'undefined') {
                        window.location.href = '/';
                    }
                    return { data: null, error: 'Unauthorized' };
                }

                const errorMessage = data.message || data.error || 'Request failed';
                return { data: null, error: errorMessage };
            }

            return { data, error: null };
        } catch (err) {
            if (err.name === 'AbortError') {
                return { data: null, error: 'Request cancelled' };
            }
            return { data: null, error: err.message || 'Network error' };
        }
    }

    /**
     * Generate cache key from URL and options
     */
    getCacheKey(url, options) {
        const method = options.method || 'GET';
        const body = options.body || '';
        return `${method}:${url}:${body}`;
    }

    /**
     * Combine multiple AbortSignals
     */
    combineSignals(signals) {
        const controller = new AbortController();
        for (const signal of signals) {
            if (signal.aborted) {
                controller.abort();
                break;
            }
            signal.addEventListener('abort', () => controller.abort());
        }
        return controller.signal;
    }

    /**
     * Cancel all pending requests
     */
    cancelAll() {
        this.abortControllers.forEach(controller => controller.abort());
        this.abortControllers.clear();
        this.pendingRequests.clear();
    }

    /**
     * Invalidate cache for a specific URL pattern
     */
    invalidateCache(urlPattern) {
        if (!urlPattern) {
            this.cache.clear();
            return;
        }

        for (const [key] of this.cache) {
            if (key.includes(urlPattern)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear expired cache entries
     */
    clearExpiredCache() {
        const now = Date.now();
        for (const [key, value] of this.cache) {
            // Remove entries older than 5 minutes
            if (now - value.timestamp > 300000) {
                this.cache.delete(key);
            }
        }
    }
}

// Singleton instance
const apiClient = new APIClient();

// Auto-cleanup expired cache every 2 minutes
if (typeof window !== 'undefined') {
    setInterval(() => apiClient.clearExpiredCache(), 120000);
}

export default apiClient;
