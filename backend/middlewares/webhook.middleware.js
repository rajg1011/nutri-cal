import paymentServiceWebhook from "../services/paymentGateway/paymentService.webhook.js";
import supabaseAdmin from "../config/supabaseAdmin.js";


const verifyWebhookSignature = async (req, res, next) => {
    try {
        const isValidSignature = await paymentServiceWebhook.validateWebhookSignature(req);
        if (!isValidSignature) {
            return res.status(400).json({ success: false, message: "Invalid signature" });
        }
    } catch (error) {
        console.error("Error validating webhook signature:", error);
        return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    return next();
};

const checkDuplicateEvent = async (req, res, next) => {
    const eventId = paymentServiceWebhook.getEventId(req);
    if (!eventId) {
        return res.status(400).json({ success: false, message: "Missing event ID" });
    }

    const { error } = await supabaseAdmin
        .from('webhooksDeatails')
        .insert({ webhook_id: eventId });

    if (error) {
        // Unique constraint violation — event already processed
        if (error.code === '23505') {
            return res.status(200).json({ success: true, message: "Event already processed" });
        }
        return res.status(500).json({ success: false });
    }

    return next();
};

const releaseWebhookEvent = async (req) => {
    const eventId = paymentServiceWebhook.getEventId(req);
    if (!eventId) return;

    const { error } = await supabaseAdmin
        .from('webhooksDeatails')
        .delete()
        .eq('webhook_id', eventId);

    if (error) {
        console.error("Error releasing webhook event:", error);
    }
};

export { verifyWebhookSignature, checkDuplicateEvent, releaseWebhookEvent }
