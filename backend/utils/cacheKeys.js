
export const Keys = {
    userAuth: (token) => `user:${token}:auth`,
    userSubscribe: (userId) => `user:${userId}:aiSubs`,
    userProfileDetails: (userId) => `user:${userId}:profileDetails`,
    userGoal: (userId) => `user:${userId}:goal`,
    foodSearch: (query) => `food:search:${query.toLowerCase().trim()}`,
    userPreference: (userId) => `user:${userId}:preferences`,
    chatHistory: (userId) => `user:${userId}:chatHistory`,
    chatHistoryRecent: (userId) => `user:${userId}:chatHistoryRecent`,
    userMemoryFacts: (userId) => `user:${userId}:memoryFacts`,
};

// frontend may directly change in DB so we are defensive here and add a time limit on redis cache. (supabase prblm)
// for scaling we switch to API.
// We can use supabase webhook but that will be usefull when multiple service or third party can change ur DB, here best is to make APIs.

export const TTL = {
    USER_SUBSCRIBER: 60 * 5,       // 5 min (Cache for 5 min if user is subscribed or not)
    USER_PROFILE: 60 * 60 * 6,     // 6 hours (defensive bound, profile has no backend write/invalidation path)
    USER_GOAL: 60 * 30,            // 30 min (defensive bound, frontend writes goal directly to Supabase without invalidating this cache)
    FOOD_SEARCH: 60 * 60 * 24,     // 24 hours (foodDescription is static reference data)
    USER_PREFERENCE: 60 * 60 * 24, // 24 hours (no write path exists for userPreference)
    CHAT_MEMORY: 60 * 60 * 24 * 7, // 7 days (only our backend writes this, so this is storage hygiene, not staleness defense)
};
