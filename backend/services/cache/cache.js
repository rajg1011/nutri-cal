import { cacheClient } from "../../config/redis.js"

const getCache = async (key) => {
    try {
        return await cacheClient.get(key);
    } catch (e) {
        return null;
    }
}

const setCache = async (key, value, ttl) => {
    try {
        const options = ttl ? { ex: ttl } : {};
        await cacheClient.set(key, value, options);
        return true;
    } catch (e) {
        return false;
    }
}

const deleteCache = async (key) => {
    try {
        return await cacheClient.del(key)
    } catch (e) {
        return false
    }
}

export { getCache, setCache, deleteCache }