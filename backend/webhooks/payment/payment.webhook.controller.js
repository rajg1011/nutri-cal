import paymentServiceWebhook  from "../../paymentGateway/paymentService.webhook.js"

export const paymentServiceWebhookController = async (req, res) => {
    const isValidSignature = await paymentServiceWebhook.validateWebhookSignature(req)

    if (!isValidSignature) {
        return res.status(400).json({ message: "Invalid signature" })
    }

    const event = await paymentServiceWebhook.eventParser(req)
    if (!event) {
        return res.status(400).json({ message: "No event" })
    }

    const result = await paymentServiceWebhook.webhookHandler(req)
    if (!result) {
        return res.status(500).json({ message: "Internal Server Error" })
    }

    res.status(200).json({ message: "Webhook processed successfully" })
}