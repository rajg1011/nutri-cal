const handlePaymentAuthorizedLogic = async ({ user_id, payment_id, subscription, order_id }) => {
    try {
        const { data, error } = await supabaseAdmin.from("userSubscriptionDetails").select('*').eq('user_id', req.user).eq('status', 'ACTIVE')
        if (error || !data || data.length === 0) {
            await supabaseAdmin.from('userPaymentDetails').update({ subscription_status: "CONFIRM", payment_id }).eq('order_id', order_id).eq('user_id', user_id);
            const { _, error: subError } = await supabaseAdmin.from('userSubscriptionDetails').update({ subscription_type: subscription, subscription_id: payment_id, status: "ACTIVE" }).eq('user_id', user_id);
            if (subError) {
                res.status(500).json({ success: false });
            }
        }
        return res.send()
    } catch (error) {
        console.error("Error in payment.authorized webhook:", error);
    }
};

const handleSubscriptionStart = async ({ user_id, plan_id, subscription }) => {
    try {
        const { data, error } = await supabaseAdmin.from("userSubscriptionDetails").select('*').eq('user_id', req.user).eq('status', 'ACTIVE')
        if (error || !data || data.length === 0) {
            const { _, error: subError } = await supabaseAdmin.from('userSubscriptionDetails').update({ subscription_type: subscription, subscription_id: plan_id, status: "ACTIVE" }).eq('user_id', user_id);
            if (subError) {
                res.status(500).json({ success: false });
            }
        }
        return res.send()

    }
    catch (error) {
        console.error("Error in payment.authorized webhook:", error);
    }
}

const handleSubscriptionEnd = async ({ user_id, plan_id, subscription }) => {
    try {
        const { data, error } = await supabaseAdmin.from("userSubscriptionDetails").select('*').eq('user_id', req.user).or('status.eq.STOP,status.is.null,status.eq.');
        if (error || !data || data.length === 0) {
            const { _, error: subError } = await supabaseAdmin.from('userSubscriptionDetails').update({ subscription_type: subscription, subscription_id: plan_id, status: "STOP" }).eq('user_id', user_id);
            if (subError) {
                res.status(500).json({ success: false });
            }
        }
        return res.send()

    }
    catch (error) {
        console.error("Error in payment.authorized webhook:", error);
    }
}


export { handlePaymentAuthorizedLogic, handleSubscriptionStart, handleSubscriptionEnd }



