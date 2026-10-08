import supabaseAdmin from "../config/supabaseAdmin.js";
import logger from "./logger.js";

const getUserContact = async (userId) => {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error || !data?.user) {
        logger.error({ err: error, userId }, "Error fetching user contact");
        return null;
    }
    return {
        email: data.user.email,
        name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || "",
    };
};

export default getUserContact;
