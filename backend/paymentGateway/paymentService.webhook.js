import { razorPayWebhook } from "./provider/razorpay.webhook.js";

const webhookProvider = {
    "razorpay": razorPayWebhook
}

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


const paymentServiceWebhook = (() => {
    try {
        const provider = (process.env.PAYMENT_PROVIDER?.toLowerCase() || "razorpay");
        const functionCall = webhookProvider[provider];
        if (!functionCall) {
            throw new Error("Error in calling function")
        }

        return {
            validateWebhookSignature: async (req) => {
                return await functionCall.validateWebhookSignature(req)
            },
            eventParser: async (req) => {
                return await functionCall.eventParser(req)
            },
            webhookHandler: async (req) => {
                return await functionCall.webhookHandler(req)
            },
            getEventId: (req) => {
                return functionCall.getEventId(req)
            }
        }
    } catch (e) {
        console.log(e)
        throw e
    }
})()

export default paymentServiceWebhook;
export { handlePaymentAuthorizedLogic, handleSubscriptionStart, handleSubscriptionEnd }