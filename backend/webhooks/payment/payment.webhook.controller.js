import paymentServiceWebhook from "../../services/paymentGateway/paymentService.webhook.js"
import { releaseWebhookEvent } from "../../middlewares/webhook.middleware.js"

export const paymentServiceWebhookController = async (req, res) => {
    try {
        const event = await paymentServiceWebhook.eventParser(req)
        if (!event) {
            return res.status(400).json({ message: "No event" })
        }

        const result = await paymentServiceWebhook.webhookHandler(req)
        if (!result) {
            await releaseWebhookEvent(req)
            return res.status(500).json({ message: "Internal Server Error" })
        }

        res.status(200).json({ message: "Webhook processed successfully" })
    } catch (error) {
        console.error("Error in webhook controller:", error);
        await releaseWebhookEvent(req)
        return res.status(500).json({ message: "Internal Server Error" })
    }
}
