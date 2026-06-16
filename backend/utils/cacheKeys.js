
export const Keys = {
    userAuth: (token) => `user:${token}:auth`,
    userSubscribe: (userId) => `user:${userId}:aiSubs`,
    userProfileDetails: (userId) => `user:${userId}:profileDetails`,
    userGoal: (userId) => `user:${userId}:goal`,
    foodSearch: (query) => `food:search:${query.toLowerCase().trim()}`,
    userPreference: (userId) => `user:${userId}:preferences`,
};

export const TTL = {
    USER_SUBSCRIBER: 60 * 5,       // 5 min (Cache for 5 min if user is subscribed or not)
    USER_PROFILE: 60 * 60 * 6,     // 6 hours (defensive bound, profile has no backend write/invalidation path)
    USER_GOAL: 60 * 30,            // 30 min (defensive bound, frontend writes goal directly to Supabase without invalidating this cache)
    FOOD_SEARCH: 60 * 60 * 24,     // 24 hours (foodDescription is static reference data)
    USER_PREFERENCE: 60 * 60 * 24, // 24 hours (no write path exists for userPreference)
};
