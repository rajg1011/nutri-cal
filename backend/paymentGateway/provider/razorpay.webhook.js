import { handlePaymentAuthorizedLogic } from '../../modules/payment/payment.webhook.js';
import Razorpay from "razorpay";

const validWebhook = async (req) => {
    const signature = req.headers["x-razorpay-signature"];
    const isValid = Razorpay.validateWebhookSignature(
        JSON.stringify(req.body),
        signature,
        process.env.RAZORPAY_WEBHOOK_SECRET
    );
    return isValid
}

const getEventid = () => {
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
            const { user_id, subscription } = payload.payement.entity.notes
            await handlePaymentAuthorizedLogic({ user_id, payment_id, subscription, order_id });
            break;
        case "subscription.authenticated":
        case "subscription.charged":
            const { user_id: user } = payload.subscription.entity.notes;
            await handleSubscriptionStart({ subscription: "PRO", user_id: user, plan_id: process.env.RAZORPAY_PLAN_ID_199 });
            break;
        case "subscription.halted":
        case "subscription.cancelled":
            const { user_id: userCancel } = payload.subscription.entity.notes;
            await handleSubscriptionEnd({ subscription: "PRO", user_id: userCancel, plan_id: process.env.RAZORPAY_PLAN_ID_199 });
            break;
        default:
            console.log(`Unhandled event: ${event}`);
            break;
    }
}


export const razorPay = (async () => {
    return {
        validateWebhookSignature: async (req) => {
            return await validWebhook(req)
        },
        eventParser: (req) => {
            return eventParser(req)
        },
        getEventid: () => {
            return getEventid(req)
        },
        webhookHandler: async (req) => {
            return await handleWebhookLogic(req)
        }
    }
})()