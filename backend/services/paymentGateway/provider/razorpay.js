import Razorpay from "razorpay";
import crypto from "crypto";
import { SUBSCRIPTION_TYPE_PRO } from "../../../constant.js";

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
        verifyPayment: async ({ order_id, subscription_id, payment_id, signature }) => {
            if (order_id) {
                const generated_signature = crypto
                    .createHmac("sha256", process.env.RAZORPAY_SECRET)
                    .update(order_id + "|" + payment_id)
                    .digest("hex");
                return { verified: generated_signature === signature, mode: "order" };
            }
            if (subscription_id) {
                const generated_signature = crypto
                    .createHmac("sha256", process.env.RAZORPAY_SECRET)
                    .update(payment_id + "|" + subscription_id)
                    .digest("hex");
                return { verified: generated_signature === signature, mode: "subscription" };
            }
            return { verified: false, mode: null };
        },
        createProPlanSubscription: async ({ user_id }) => {
            try {
                const params = {
                    "plan_id": process.env.RAZORPAY_PLAN_ID_199,
                    "total_count": 100,
                    "quantity": 1,
                    "customer_notify": 1,
                    "notes": {
                        "user_id": user_id,
                        "subscription": SUBSCRIPTION_TYPE_PRO
                    }
                };
                const response = await razorpay.subscriptions.create(params)
                return {
                    subscription_id: response.id,
                    status: response.status,
                }
            } catch (e) {
                console.log(e);
                throw new Error("Failed to create subscription");
            }
        }
    }
})()