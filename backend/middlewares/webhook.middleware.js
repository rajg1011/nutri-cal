import paymentServiceWebhook from "../services/paymentGateway/paymentService.webhook.js";
import supabaseAdmin from "../config/supabaseAdmin.js";


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

export { checkDuplicateEvent }