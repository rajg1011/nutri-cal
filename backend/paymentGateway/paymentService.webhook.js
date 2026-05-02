import { razorPay } from "./provider/razorpay.webhook.js";

const provider = {
    "razorpay": razorPay
}

const paymentServiceWebhook = (() => {
    try {
        const providerey = (process.env.PAYMENT_PROVIDER?.toLowerCase() || "razorpay");
        const functionCall = provider[providerey];
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

export default paymentServiceWebhook