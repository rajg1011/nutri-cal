
export const Keys = {
    userAuth: (token) => `user:${token}:auth`,
    userSubscribe: (userId) => `user:${userId}:aiSubs`,
    userProfileDetails: (userId) => `user:${userId}:profileDetails`,
    userGoal: (userId) => `user:${userId}:goal`,
};

export const TTL = {
    USER_SUBSCRIBER: 60 * 5,  // 5 min (Cache for 5 min if user is subscribed or not)
};
