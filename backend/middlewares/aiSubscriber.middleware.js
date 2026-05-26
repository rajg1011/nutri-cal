import isSubscriptionActive from "../utils/subscriptionActive"

const AISubscriberMiddleware = async (req, res, next) => {
    try {
        const { data, error } = await req.supabase.from('userSubscriptionDetails').select('*');
        if (error) {
            throw new Error("Internal Server Error");
        }

        const isSubscriber = isSubscriptionActive(data);

        if (!isSubscriber) {
            return res.status(403).json({ message: "You are not subscribed" });
        }

        return next()
    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: "Internal Server Error" })
    }
}

export { AISubscriberMiddleware }