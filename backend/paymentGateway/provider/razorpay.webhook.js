import { handlePaymentAuthorizedLogic } from '../../modules/payment/payment.webhook';
const { validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils')

const validWebhook = async (req) => {
    const signature = req.headers["x-razorpay-signature"];
    const isValid = validateWebhookSignature(
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


const handleWebhookLogic = async ({ event, payload }) => {
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


export const razorPay = (async (req) => {
    const { event, payload } = req.body;
    return {
        validateWebhookSignature: validWebhook(req),
        eventParser: eventParser(req),
        getEventid: getEventid(req),
        webhookHandler: handleWebhookLogic({ event, payload })
    }
})()