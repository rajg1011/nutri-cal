const isSubscriptionActive = (data) => {
    if (!data || data.length === 0) return false;
    const sub = data[0];
    const planType = sub.subscription_type ? sub.subscription_type.toUpperCase() : '';

    if (planType === 'QUESTION') {
        if (sub.question_asked && sub.question_asked > 0) return true;
    } else if (planType === 'PRO') {
        if (sub.end_date && new Date(sub.end_date) > new Date()) return true;
    }
    return false;
}

export default isSubscriptionActive