import isSubscriptionActive from "../../utils/subscriptionActive.js";
import { Constants } from "../../constant.js";
import supabaseAdmin from "../../config/supabaseAdmin.js";
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

        if (error) {
            throw new Error("Error at handlePayementAuthorizedLogic's fetch query")
        }
        if (!isSubscriptionActive(data)) {
            await supabaseAdmin.from('userPaymentDetails').update({ subscription_status: "CONFIRM", payment_id }).eq('order_id', order_id).eq('user_id', user_id);

            const purchasedPlan = subscription.toUpperCase();
            let updatePayload = {
                user_id,
                subscription_type: purchasedPlan,
                subscription_id: payment_id,
                status: "ACTIVE"
            };

            if (purchasedPlan === 'QUESTION') {
                updatePayload.question_asked = Constants.QUESTION_AKSED;
            } else if (purchasedPlan === 'PRO') {
                const futureDate = new Date();
                futureDate.setMonth(futureDate.getMonth() + 1);
                updatePayload.end_date = futureDate.toISOString();
            }

            const { _, error: subError } = await supabaseAdmin
                .from('userSubscriptionDetails')
                .upsert(updatePayload, {
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
        if (error) {
            throw new Error("Error at handleSubscriptionStart's fetch query")
        }
        if (!isSubscriptionActive(data)) {
            const purchasedPlan = subscription.toUpperCase();
            let updatePayload = {
                user_id,
                subscription_type: purchasedPlan,
                subscription_id: plan_id,
                status: "ACTIVE"
            };

            if (purchasedPlan === 'QUESTION') {
                updatePayload.question_asked = Constants.QUESTION_AKSED;
            } else if (purchasedPlan === 'PRO') {
                const futureDate = new Date();
                futureDate.setMonth(futureDate.getMonth() + 1);
                updatePayload.end_date = futureDate.toISOString();
            }

            const { _, error: subError } = await supabaseAdmin.from('userSubscriptionDetails')
                .upsert(updatePayload, { onConflict: 'user_id' })
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
export { handlePaymentAuthorizedLogic, handleSubscriptionStart }