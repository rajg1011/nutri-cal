import Razorpay from "razorpay";
import { handlePaymentAuthorizedLogic, handleSubscriptionCharged } from "../paymentService.webhook.js";
import { SUBSCRIPTION_TYPE_PRO } from "../../../constant.js";
import logger from "../../../utils/logger.js";

const parseRawBody = (req) => {
    return JSON.parse(req.body.toString("utf8"));
}

const validWebhook = async (req) => {
    const signature = req.headers["x-razorpay-signature"];
    const isValid = Razorpay.validateWebhookSignature(
        req.body.toString("utf8"),
        signature,
        process.env.RAZORPAY_WEBHOOK_SECRET
    );
    return isValid
}

const getEventId = (req) => {
    return req.headers["x-razorpay-event-id"]
}

const eventParser = (req) => {
    const { event } = parseRawBody(req);
    return event;
}


const handleWebhookLogic = async (req) => {
    const { event, payload } = parseRawBody(req)
    switch (event) {
        case "payment.authorized": {
            const { id: payment_id, order_id, invoice_id, notes } = payload.payment.entity;
            const { user_id, subscription } = notes || {};
            if (invoice_id || !order_id || !user_id || !subscription) {
                logger.info({ paymentId: payment_id }, "Skipping payment.authorized for non-order payment");
                return true;
            }
            return await handlePaymentAuthorizedLogic({ user_id, payment_id, subscription, order_id });
        }
        case "subscription.charged":
        case "subscription.activated": {
            const { user_id: user, subscription: subType } = payload.subscription.entity.notes || {};
            const { id: subscription_id, current_end } = payload.subscription.entity;
            return await handleSubscriptionCharged({
                subscription: subType || SUBSCRIPTION_TYPE_PRO,
                user_id: user,
                subscription_id,
                current_end,
                isCharge: event === "subscription.charged"
            });
        }
        default:
            logger.info({ event }, "Unhandled webhook event");
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