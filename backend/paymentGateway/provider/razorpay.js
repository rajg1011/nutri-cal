import Razorpay from "razorpay";
import crypto from "crypto";

export const razorPay = (() => {
    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_API_KEY,
        key_secret: process.env.RAZORPAY_SECRET,
    });
    return {
        createOrder: async ({ amount, subscription, user_id }) => {
            try {
                const options = {
                    amount: amount * 100,
                    currency: "INR",
                    receipt: `receipt_${Date.now()}`,
                    payment_capture: 1,
                    notes: {
                        subscription,
                        user_id
                    }
                }
                const response = await razorpay.orders.create(options)
                return {
                    order_id: response.id,
                    amount: response.amount
                }
            } catch (e) {
                console.log(e);
                throw new Error("Failed to create order");
            }
        },
        verifyPayment: async ({ order_id, payment_id, signature }) => {
            const generated_signature = crypto
                .createHmac("sha256", process.env.RAZORPAY_SECRET)
                .update(order_id + "|" + payment_id)
                .digest("hex");

            return generated_signature === signature;
        }
    }
})()