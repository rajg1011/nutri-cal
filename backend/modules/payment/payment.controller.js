import { SUBSCRIPTION_TYPE } from "../../constant.js"
import paymentService from "../../paymentGateway/paymentService.js"
import supabaseAdmin from "../../utils/supabaseAdmin.js"


const createOrderController = async (req, res) => {
    try {
        if (!req.body || !req.body.subscription) {
            return res.status(400).json({ success: false, message: "Subscription is required" })
        }
        if (!Object.keys(SUBSCRIPTION_TYPE).includes(req.body.subscription.toUpperCase())) {
            return res.status(400).json({ success: false, message: "Invalid subscription" })
        }
        const subsPrice = SUBSCRIPTION_TYPE[req.body.subscription.toUpperCase()]

        const checkSubscription = await supabaseAdmin.from("userSubscriptionDetails").select('*').eq('user_id', req.user).eq('status', 'ACTIVE')

        if (checkSubscription.data && checkSubscription.data.length > 0) {
            return res.status(400).json({ success: false, message: "Already subscribed" })
        }

        const { data, error } = await supabaseAdmin.from("userPaymentDetails").insert({
            user_id: req.user,
            plan: req.body.subscription,
            subscription_status: "PENDING"
        }).select('*')

        if (error) {
            throw new Error("Error in inserting order");
        }

        const createOrder = await paymentService.createOrder({ amount: subsPrice, subscription: req.body.subscription, user_id: req.user })

        const { __, error: err } = await supabaseAdmin
            .from("userPaymentDetails")
            .update({
                order_id: createOrder?.order_id
            })
            .eq("id", data[0].id);

        if (err) {
            throw new Error("Error in updating order");
        }

        res.status(201).json(createOrder)
    } catch (e) {
        console.log(e)
        return res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}

const verifyPaymentController = async (req, res) => {
    try {
        const { order_id, payment_id, signature } = req.body;

        if (!order_id || !payment_id || !signature) {
            return res.status(400).json({ success: false, message: "Invalid request" })
        }

        const verify = await paymentService.verifyPayment({ order_id, payment_id, signature })

        if (!verify) {
            const { _, error } = await supabaseAdmin.from('userPaymentDetails').update({ subscription_status: "FAILED" }).eq('order_id', order_id)
            if (error) {
                console.log("Error in updating payment status")
            }
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed'
            })
        }

        const { data, error } = await supabaseAdmin.from('userPaymentDetails').select('*').eq('order_id', order_id).eq('user_id', req.user).single();
        if (error) {
            return res.status(500).json({ success: false, message: "Internal Server Error" })
        }

        if (!data || data.length == 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }
        if (data.subscription_status === "CONFIRM") {
            return res.status(200).json({
                success: true,
                message: "Already confirmed"
            });
        }

        await supabaseAdmin.from('userPaymentDetails').update({ subscription_status: "CONFIRM", payment_id: payment_id }).eq('order_id', order_id).eq('user_id', req.user);
        const { _, error: subError } = await supabaseAdmin.from('userSubscriptionDetails').update({ subscription_type: Object.keys(SUBSCRIPTION_TYPE)?.[1], subscription_id: payment_id, status: "ACTIVE" }).eq('user_id', req.user);
        if (subError) {
            return res.status(500).json({ success: false, message: "Internal Server Error" })
        }

        return res.status(200).json({ success: true, message: "Subscription Successful" })
    } catch (e) {
        console.log(e)
        return res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}

const createPlanController = async (req, res) => {
    try {
        if (!req.body || !req.body.subscription) {
            return res.status(400).json({ success: false, message: "Subscription is required" })
        }
        if (!Object.keys(SUBSCRIPTION_TYPE).includes(req.body.subscription.toUpperCase())) {
            return res.status(400).json({ success: false, message: "Invalid subscription" })
        }
        const checkSubscription = await supabaseAdmin.from("userSubscriptionDetails").select('*').eq('user_id', req.user).eq('status', 'ACTIVE')

        if (checkSubscription.data && checkSubscription.data.length > 0) {
            return res.status(400).json({ success: false, message: "Already subscribed" })
        }
        const createPlan = await paymentService.createProPlanSubscription({ user_id: req.user });
        res.status(201).json(createPlan)
    } catch (e) {
        console.log(e)
        return res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}

export { createOrderController, verifyPaymentController, createPlanController }