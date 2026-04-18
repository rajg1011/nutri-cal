import paymentService from "../../paymentGateway/paymentService.js"
import supabaseAdmin from "../../utils/supabaseAdmin.js"

const SUBSCRIPTION_PRICE = {
    "PRO": 199,
    "QUESTION": 49
}

const createOrderController = async (req, res) => {
    try {
        if (!req.body || !req.body.subscription) {
            return res.status(400).json({ success: false, message: "Subscription is required" })
        }
        const subsPrice = SUBSCRIPTION_PRICE[req.body.subscription.toUpperCase()]
        if (!subsPrice) {
            return res.status(500).json({ success: false, message: "Internal Server Error" })
        }
        const createOrder = await paymentService.createOrder({ amount: subsPrice, subscription: req.body.subscription, user_id: req.user })
        const { _, error } = await supabaseAdmin.from("userSubscritionsDetails").insert({
            user_id: req.user,
            plan: req.body.subscription,
            subscription_status: "PENDING"
        })
        if (error) {
            throw error;
        }
        res.status(201).json(createOrder)
    } catch (e) {
        console.log(e)
        return res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}

const verifyPaymentController = async (req, res) => {
    try {
        const body = req.body;
        const verify = await paymentService.verifyPayment(body)
        if (!verify) {
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed'
            })
        }

        const { _, error } = await supabaseAdmin.from('userSubscritionsDetails').update({ subscription_status: "CONFIRM" }).eq('user_id', req.user);
        if (error) {
            //todo -> DB not updated yet
            res.status(500).json({ success: true, message: "Money debited" })
        }
        return res.status(200).json({ success: true, message: "Subscription Successful" })
    } catch (e) {
        console.log(e)
        return res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}

export { createOrderController, verifyPaymentController }