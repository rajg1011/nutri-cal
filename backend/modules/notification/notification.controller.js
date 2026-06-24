import queueService from "../../services/queue/queueService.js";
import { JOB_TYPES } from "../../services/queue/jobTypes.js";

const welcomeEmailController = async (req, res) => {
    try {
        const { data, error } = await req.supabase.auth.getUser();

        if (error || !data?.user?.email) {
            return res.status(400).json({ success: false, message: "Could not resolve user email" });
        }

        const name = data.user.user_metadata?.full_name || data.user.user_metadata?.name || "";

        await queueService.enqueue(JOB_TYPES.SEND_WELCOME_EMAIL, { email: data.user.email, name });

        return res.status(202).json({ success: true });
        
    } catch (e) {
        console.log(e);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export { welcomeEmailController };
