/**
 * Simple in-memory cache with TTL and LRU eviction
 */

class Cache {
    constructor(options = {}) {
        this.maxSize = options.maxSize || 100;
        this.defaultTTL = options.defaultTTL || 60000; // 1 minute default
        this.cache = new Map();
    }

    /**
     * Set a cache entry
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in milliseconds
     */
    set(key, value, ttl = this.defaultTTL) {
        // Evict oldest entry if cache is full
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            value,
            expiresAt: Date.now() + ttl,
        });
    }

    /**
     * Get a cache entry
     * @param {string} key - Cache key
     * @returns {any|null} Cached value or null if expired/not found
     */
    get(key) {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        // Move to end (LRU)
        this.cache.delete(key);
        this.cache.set(key, entry);

        return entry.value;
    }

    /**
     * Check if key exists and is not expired
     */
    has(key) {
        return this.get(key) !== null;
    }

    /**
     * Delete a cache entry
     */
    delete(key) {
        return this.cache.delete(key);
    }

    /**
     * Clear all cache entries
     */
    clear() {
        this.cache.clear();
    }

    /**
     * Invalidate entries matching a pattern
     */
    invalidate(pattern) {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Get cache size
     */
    size() {
        return this.cache.size;
    }

    /**
     * Clean up expired entries
     */
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.cache) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }
}

// Export singleton instances for different cache types
export const chatCache = new Cache({ maxSize: 50, defaultTTL: 30000 }); // 30s TTL
export const statusCache = new Cache({ maxSize: 100, defaultTTL: 60000 }); // 60s TTL
export const userCache = new Cache({ maxSize: 200, defaultTTL: 300000 }); // 5min TTL

// Auto-cleanup every minute
if (typeof window !== 'undefined') {
    setInterval(() => {
        chatCache.cleanup();
        statusCache.cleanup();
        userCache.cleanup();
    }, 60000);
}

export default Cache;
