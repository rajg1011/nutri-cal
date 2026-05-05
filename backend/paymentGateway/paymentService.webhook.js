import supabaseAdmin from "../utils/supabaseAdmin.js";
import { razorPayWebhook } from "./provider/razorpay.webhook.js";

const webhookProvider = {
    "razorpay": razorPayWebhook
}

const handlePaymentAuthorizedLogic = async ({ user_id, payment_id, subscription, order_id }) => {
    try {
        if (!user_id || !payment_id || !subscription || !order_id) {
            throw new Error("Invalid arguments at handlePaymentAuthorizedLogic")
        }
        const { data, error } = await supabaseAdmin.from("userSubscriptionDetails").select('*').eq('user_id', user_id).eq('status', 'ACTIVE')
        if (error || !data || data.length === 0) {
            await supabaseAdmin.from('userPaymentDetails').update({ subscription_status: "CONFIRM", payment_id }).eq('order_id', order_id).eq('user_id', user_id);
            const { _, error: subError } = await supabaseAdmin
                .from('userSubscriptionDetails')
                .upsert({
                    user_id,
                    subscription_type: subscription,
                    subscription_id: payment_id,
                    status: "ACTIVE"
                }, {
                    onConflict: 'user_id'
                });
            if (subError) {
                throw new Error("Error at handlePayementAuthorizedLogic's update query")
            }
        }
        return true
    } catch (error) {
        console.error("Error in webhook:", error);
        return null
    }
};

const handleSubscriptionStart = async ({ user_id, plan_id, subscription }) => {
    try {
        if (!user_id || !plan_id || !subscription) {
            throw new Error("Invalid arguments at handleSubscriptionStart")
        }
        const { data, error } = await supabaseAdmin.from("userSubscriptionDetails").select('*').eq('user_id', user_id).eq('status', 'ACTIVE')
        if (error || !data || data.length === 0) {
            const { _, error: subError } = await supabaseAdmin.from('userSubscriptionDetails')
                .upsert({ subscription_type: subscription, subscription_id: plan_id, status: "ACTIVE", user_id }, { onConflict: 'user_id' })
            if (subError) {
                throw new Error("Error at handleSubscriptionStart's update query")
            }
        }
        return true

    }
    catch (error) {
        console.error("Error in webhook:", error);
        return null
    }
}

const handleSubscriptionEnd = async ({ user_id, plan_id, subscription }) => {
    try {
        if (!user_id || !plan_id || !subscription) {
            throw new Error("Invalid arguments at handleSubscriptionEnd")
        }
        const { data, error } = await supabaseAdmin.from("userSubscriptionDetails").select('*').eq('user_id', user_id).or('status.eq.STOP,status.is.null,status.eq.');
        if (error || !data || data.length === 0) {
            const { _, error: subError } = await supabaseAdmin.from('userSubscriptionDetails').update({ subscription_type: subscription, subscription_id: plan_id, status: "STOP" }).eq('user_id', user_id);
            if (subError) {
                throw new Error("Error at handleSubscriptionEnd's update query")
            }
        }
        return true

    }
    catch (error) {
        console.error("Error in webhook:", error);
        return null
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