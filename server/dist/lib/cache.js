"use strict";
/**
 * Simple in-memory cache with TTL support
 * Used for frequently accessed data like posts and communities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CACHE_TTL = exports.cache = void 0;
class MemoryCache {
    constructor(maxSize = 5000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        // Clean up expired entries every minute
        setInterval(() => this.cleanup(), 60000);
    }
    /**
     * Get cached data if it exists and hasn't expired
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }
        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    /**
     * Set cache data with TTL in milliseconds
     */
    set(key, data, ttl = 60000) {
        // If cache is full, remove oldest entry
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }
    /**
     * Delete specific cache entry
     */
    delete(key) {
        this.cache.delete(key);
    }
    /**
     * Clear all cache entries
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Delete entries matching a pattern
     */
    invalidatePattern(pattern) {
        const regex = new RegExp(pattern);
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key && regex.test(key)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => {
            if (key)
                this.cache.delete(key);
        });
    }
    /**
     * Remove expired entries
     */
    cleanup() {
        const now = Date.now();
        const keysToDelete = [];
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
    }
    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize
        };
    }
}
// Export singleton instance with increased cache size
exports.cache = new MemoryCache(10000); // Increased from 2000 to 10000 for better hit rate
// Cache TTL constants (in milliseconds)
// Increased TTLs for better performance
exports.CACHE_TTL = {
    POST_LIST: 60000, // 60 seconds for post lists (increased from 30s)
    POST_DETAIL: 120000, // 2 minutes for individual posts (increased from 60s)
    COMMUNITY: 180000, // 3 minutes for community data (increased from 2m)
    USER_PROFILE: 120000, // 2 minutes for user profiles (increased from 60s)
    COMMENTS: 60000, // 60 seconds for comments (increased from 30s)
    HOT_POSTS: 120000, // 2 minutes for hot posts feed (increased from 60s)
};
