import paymentServiceWebhook from "../services/paymentGateway/paymentService.webhook.js";
import supabaseAdmin from "../utils/supabaseAdmin.js";


const checkDuplicateEvent = async (req, res, next) => {
    const eventId = paymentServiceWebhook.getEventId(req);
    const { data, error } = await supabaseAdmin.from('webhooksDeatails').select('*').eq('webhook_id', eventId);
    if (!data || data.length == 0) {
        await supabaseAdmin.from('webhooksDeatails').insert({
            webhook_id: eventId
        })
        return next()
    }
    if (error) {
        return res.status(500).json({ success: false });
    }
    return res.status(200).send({ success: true, message: "Event already processed" })
};

export { checkDuplicateEvent }