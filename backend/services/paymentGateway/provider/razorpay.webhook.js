import Razorpay from "razorpay";
import { handlePaymentAuthorizedLogic, handleSubscriptionStart } from "../paymentService.webhook.js";
import { SUBSCRIPTION_TYPE } from "../../../constant.js";

const validWebhook = async (req) => {
    const signature = req.headers["x-razorpay-signature"];
    const isValid = Razorpay.validateWebhookSignature(
        JSON.stringify(req.body),
        signature,
        process.env.RAZORPAY_WEBHOOK_SECRET
    );
    return isValid
}

const getEventId = (req) => {
    return req.headers["x-razorpay-event-id"]
}

const eventParser = (req) => {
    const { event } = req.body;
    return event;
}


const handleWebhookLogic = async (req) => {
    const { event, payload } = req.body
    switch (event) {
        case "payment.authorized":
            const { id: payment_id, order_id, } = payload.payment.entity;
            const { user_id, subscription } = payload.payment.entity.notes
            return await handlePaymentAuthorizedLogic({ user_id, payment_id, subscription, order_id });
        case "subscription.authenticated":
        case "subscription.charged":
            const { user_id: user, subscription: subType } = payload.subscription.entity.notes;
            return await handleSubscriptionStart({ subscription: subType || "PRO", user_id: user, plan_id: process.env.RAZORPAY_PLAN_ID_199 });
        default:
            console.log(`Unhandled event: ${event}`);
            return true
    }
}


export const razorPayWebhook = {
    validateWebhookSignature: async (req) => {
        return await validWebhook(req)
    },
    eventParser: (req) => {
        return eventParser(req)
    },
    getEventId: (req) => {
        return getEventId(req)
    },
    webhookHandler: async (req) => {
        return await handleWebhookLogic(req)
    }
};