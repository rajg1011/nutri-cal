import { getCache, setCache } from "../services/cache/cache.js";
import { Keys, TTL } from "../utils/cacheKeys.js";
import isSubscriptionActive from "../utils/subscriptionActive.js"

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
        console.log(e);
        return res.status(500).json({ message: "Internal Server Error" })
    }
}

export { AISubscriberMiddleware }