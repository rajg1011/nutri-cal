import { cacheClient } from "../../config/redis.js"
import logger from "../../utils/logger.js"

const logCacheError = (operation, key, e) => {
    if (!cacheClient) return;
    logger.warn({ err: e, key, operation }, "Redis cache operation failed");
}

const getCache = async (key) => {
    try {
        return await cacheClient.get(key);
    } catch (e) {
        logCacheError("get", key, e);
        return null;
    }
}

const setCache = async (key, value, ttl) => {
    try {
        const options = ttl ? { ex: ttl } : {};
        await cacheClient.set(key, value, options);
        return true;
    } catch (e) {
        logCacheError("set", key, e);
        return false;
    }
}

const deleteCache = async (key) => {
    try {
        return await cacheClient.del(key)
    } catch (e) {
        logCacheError("delete", key, e);
        return false
    }
}

export { getCache, setCache, deleteCache }
