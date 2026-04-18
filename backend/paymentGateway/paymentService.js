import { razorPay } from "./provider/razorpay.js";

const provider = {
    "razorpay": razorPay
}

const paymentService = (() => {
    try {
        const providerey = (process.env.PAYMENT_PROVIDER?.toLowerCase() || "razorpay");
        const functionCall = provider[providerey];
        if (!functionCall) {
            throw new Error("Error in calling function")
        }
        return {
            createOrder: async ({ amount, subscription, user_id }) => {
                return await functionCall.createOrder({ amount, subscription, user_id })
            },
            verifyPayment: async (body) => {
                return await functionCall.verifyPayment({ order_id: body.order_id, payment_id: body.payment_id, signature: body.signature })
            }
        }
    } catch (e) {
        console.log(e)
        throw e
    }
})()

export default paymentService