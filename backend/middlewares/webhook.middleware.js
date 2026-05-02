import paymentServiceWebhook from "../paymentGateway/paymentService.webhook.js";
import supabaseAdmin from "../utils/supabaseAdmin.js";


const checkDuplicateEvent = async (req, res, next) => {
    const eventId = paymentServiceWebhook.getEventId(req);
    const { data, error } = await supabaseAdmin.from('webhooksDeatails').select('*').eq('webhook_id', eventId);
    if (!data || data.length == 0) {
        await supabaseAdmin.from('webhooksDeatails').insert({
            webhook_id: eventId
        })
        next()
    }
    if (error) {
        res.status(500).json({ success: false });
    }
    return res.send()
};

export { checkDuplicateEvent }