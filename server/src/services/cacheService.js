import NodeCache from "node-cache";

class CacheService {
    constructor() {
        // TTL = 60 seconds (std), Check period = 120 seconds
        this.cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });
        console.log("[Cache] Local caching layer initialized (simulating Redis)");
    }

    get(key) {
        const value = this.cache.get(key);
        if (value) {
            console.log(`[Cache] HIT: ${key}`);
            return value;
        }
        console.log(`[Cache] MISS: ${key}`);
        return null;
    }

    set(key, value, ttl = 60) {
        this.cache.set(key, value, ttl);
        console.log(`[Cache] SET: ${key} (TTL: ${ttl}s)`);
    }

    del(key) {
        this.cache.del(key);
        console.log(`[Cache] DEL: ${key}`);
    }

    flush() {
        this.cache.flushAll();
        console.log("[Cache] FLUSHED ALL");
    }
}

export default new CacheService();
