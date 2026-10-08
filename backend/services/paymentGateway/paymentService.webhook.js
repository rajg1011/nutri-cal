import isSubscriptionActive from "../../utils/subscriptionActive.js";
import { Constants, SUBSCRIPTION_TYPE, SUBSCRIPTION_TYPE_PRO, SUBSCRIPTION_TYPE_QUESTION } from "../../constant.js";
import supabaseAdmin from "../../config/supabaseAdmin.js";
import { razorPayWebhook } from "./provider/razorpay.webhook.js";
import { deleteCache } from "../cache/cache.js";
import { Keys } from "../../utils/cacheKeys.js";
import queueService from "../queue/queueService.js";
import { JOB_TYPES } from "../queue/jobTypes.js";
import getUserContact from "../../utils/getUserContact.js";
import logger from "../../utils/logger.js";

const enqueueSubscriptionEmail = async ({ user_id, plan, price, endDate, questionsRemaining }) => {
    try {
        const contact = await getUserContact(user_id);
        if (!contact?.email) return;
        await queueService.enqueue(JOB_TYPES.SEND_SUBSCRIPTION_EMAIL, {
            email: contact.email,
            name: contact.name,
            plan,
            price,
            endDate,
            questionsRemaining,
        });
    } catch (emailError) {
        logger.error({ err: emailError, userId: user_id }, "Error enqueueing subscription email");
    }
};

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
            logger.error({ err: error, userId: user_id }, "Supabase error in handlePaymentAuthorizedLogic fetch");
            throw new Error("Error at handlePayementAuthorizedLogic's fetch query")
        }
        if (!isSubscriptionActive(data)) {
            const { error: confirmError } = await supabaseAdmin.from('userPaymentDetails').update({ subscription_status: "CONFIRM", payment_id }).eq('order_id', order_id).eq('user_id', user_id);
            if (confirmError) {
                logger.error({ err: confirmError, userId: user_id, orderId: order_id }, "Error updating payment status to CONFIRM in webhook");
            }

            const purchasedPlan = subscription.toUpperCase();
            let updatePayload = {
                user_id,
                subscription_type: purchasedPlan,
                subscription_id: payment_id,
                status: "ACTIVE"
            };

            if (purchasedPlan === SUBSCRIPTION_TYPE_QUESTION) {
                updatePayload.question_asked = Constants.QUESTION_AKSED;
            } else if (purchasedPlan === SUBSCRIPTION_TYPE_PRO) {
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
                logger.error({ err: subError, userId: user_id, plan: purchasedPlan }, "Supabase error in handlePaymentAuthorizedLogic upsert");
                throw new Error("Error at handlePayementAuthorizedLogic's update query")
            }

            await enqueueSubscriptionEmail({
                user_id,
                plan: purchasedPlan,
                price: SUBSCRIPTION_TYPE[purchasedPlan],
                endDate: updatePayload.end_date,
                questionsRemaining: updatePayload.question_asked,
            });
        }
        await deleteCache(Keys.userSubscribe(user_id))
        return true
    } catch (error) {
        logger.error({ err: error, userId: user_id, orderId: order_id, paymentId: payment_id }, "Error in handlePaymentAuthorizedLogic");
        return null
    }
};

const handleSubscriptionCharged = async ({ user_id, subscription_id, subscription, current_end, isCharge }) => {
    try {
        if (!user_id || !subscription_id || !subscription) {
            throw new Error("Invalid arguments at handleSubscriptionCharged")
        }

        const { data: existingRows, error: fetchError } = await supabaseAdmin
            .from("userSubscriptionDetails")
            .select('*')
            .eq('user_id', user_id);

        if (fetchError) {
            logger.error({ err: fetchError, userId: user_id }, "Supabase error in handleSubscriptionCharged fetch");
            throw new Error("Error at handleSubscriptionCharged's fetch query")
        }

        const existing = existingRows?.[0];
        const purchasedPlan = subscription.toUpperCase();
        const wasActive = isSubscriptionActive(existingRows);

        let updatePayload = {
            user_id,
            subscription_type: purchasedPlan,
            subscription_id,
            status: "ACTIVE"
        };

        if (purchasedPlan === SUBSCRIPTION_TYPE_QUESTION) {
            if (wasActive) {
                await deleteCache(Keys.userSubscribe(user_id))
                return true;
            }
            updatePayload.question_asked = Constants.QUESTION_AKSED;
        } else if (purchasedPlan === SUBSCRIPTION_TYPE_PRO) {
            const currentEndDate = existing?.end_date ? new Date(existing.end_date) : null;
            const activeEndDate = currentEndDate && currentEndDate > new Date() ? currentEndDate : null;

            if (current_end) {
                const cycleEndDate = new Date(current_end * 1000);
                updatePayload.end_date = (activeEndDate && activeEndDate > cycleEndDate ? activeEndDate : cycleEndDate).toISOString();
            } else if (isCharge || !activeEndDate) {
                const baseDate = isCharge && activeEndDate ? new Date(activeEndDate) : new Date();
                baseDate.setMonth(baseDate.getMonth() + 1);
                updatePayload.end_date = baseDate.toISOString();
            } else {
                updatePayload.end_date = activeEndDate.toISOString();
            }
        }

        const { error: subError } = await supabaseAdmin.from('userSubscriptionDetails')
            .upsert(updatePayload, { onConflict: 'user_id' })
        if (subError) {
            logger.error({ err: subError, userId: user_id, plan: purchasedPlan }, "Supabase error in handleSubscriptionCharged upsert");
            throw new Error("Error at handleSubscriptionCharged's update query")
        }

        if (!wasActive) {
            await enqueueSubscriptionEmail({
                user_id,
                plan: purchasedPlan,
                price: SUBSCRIPTION_TYPE[purchasedPlan],
                endDate: updatePayload.end_date,
                questionsRemaining: updatePayload.question_asked,
            });
        }

        await deleteCache(Keys.userSubscribe(user_id))
        return true

    }
    catch (error) {
        logger.error({ err: error, userId: user_id, subscriptionId: subscription_id }, "Error in handleSubscriptionCharged");
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
        logger.error({ err: e }, "Error initializing paymentServiceWebhook provider")
        throw e
    }
})()

export default paymentServiceWebhook;
export { handlePaymentAuthorizedLogic, handleSubscriptionCharged }