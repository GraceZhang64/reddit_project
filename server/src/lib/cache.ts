/**
 * Simple in-memory cache with TTL support
 * Used for frequently accessed data like posts and communities
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;

  constructor(maxSize: number = 5000) { // Increased from 1000 to 5000
    this.cache = new Map();
    this.maxSize = maxSize;
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Get cached data if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Set cache data with TTL in milliseconds
   */
  set<T>(key: string, data: T, ttl: number = 60000): void {
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
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Delete entries matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key && regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      if (key) this.cache.delete(key);
    });
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
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
export const cache = new MemoryCache(10000); // Increased from 2000 to 10000 for better hit rate

// Cache TTL constants (in milliseconds)
// Increased TTLs for better performance
export const CACHE_TTL = {
  POST_LIST: 60000,      // 60 seconds for post lists (increased from 30s)
  POST_DETAIL: 120000,   // 2 minutes for individual posts (increased from 60s)
  COMMUNITY: 180000,     // 3 minutes for community data (increased from 2m)
  USER_PROFILE: 120000,  // 2 minutes for user profiles (increased from 60s)
  COMMENTS: 60000,       // 60 seconds for comments (increased from 30s)
  HOT_POSTS: 120000,     // 2 minutes for hot posts feed (increased from 60s)
};

