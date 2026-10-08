import paymentServiceWebhook from "../../services/paymentGateway/paymentService.webhook.js"
import { releaseWebhookEvent } from "../../middlewares/webhook.middleware.js"
import logger from "../../utils/logger.js"

export const paymentServiceWebhookController = async (req, res) => {
    try {
        const event = await paymentServiceWebhook.eventParser(req)
        if (!event) {
            return res.status(400).json({ message: "No event" })
        }

        const result = await paymentServiceWebhook.webhookHandler(req)
        if (!result) {
            logger.error({ event }, "Webhook handler failed to process event");
            await releaseWebhookEvent(req)
            return res.status(500).json({ message: "Internal Server Error" })
        }

        res.status(200).json({ message: "Webhook processed successfully" })
    } catch (error) {
        logger.error({ err: error }, "Error in webhook controller");
        await releaseWebhookEvent(req)
        return res.status(500).json({ message: "Internal Server Error" })
    }
}
