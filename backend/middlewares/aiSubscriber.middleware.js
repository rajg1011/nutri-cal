import { getCache, setCache } from "../services/cache/cache.js";
import { Keys, TTL } from "../utils/cacheKeys.js";
import isSubscriptionActive from "../utils/subscriptionActive.js"
import logger from "../utils/logger.js";

const AISubscriberMiddleware = async (req, res, next) => {
    try {
        const isUserSubscribeCache = await getCache(Keys.userSubscribe(req.user));

        if (isUserSubscribeCache) {
            if (!isUserSubscribeCache.isSubscriber) {
                return res.status(403).json({ message: "You are not subscribed" });
            }
            req.subscriptionType = isUserSubscribeCache.type;
            return next();
        }

        const { data, error } = await req.supabase.from('userSubscriptionDetails').select('*');

        if (error) {
            logger.error({ err: error, userId: req.user }, "Error fetching userSubscriptionDetails in AISubscriberMiddleware");
            throw new Error("Internal Server Error");
        }

        const isSubscriber = isSubscriptionActive(data);
        const subscriptionType = isSubscriber ? data[0].subscription_type?.toUpperCase() : null;

        await setCache(Keys.userSubscribe(req.user), { isSubscriber, type: subscriptionType }, TTL.USER_SUBSCRIBER);

        if (!isSubscriber) {
            return res.status(403).json({ message: "You are not subscribed" });
        }

        req.subscriptionType = subscriptionType;
        return next()
    } catch (e) {
        logger.error({ err: e, userId: req.user }, "Error in AISubscriberMiddleware");
        return res.status(500).json({ message: "Internal Server Error" })
    }
}

export { AISubscriberMiddleware }