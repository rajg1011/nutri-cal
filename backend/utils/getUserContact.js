import supabaseAdmin from "../config/supabaseAdmin.js";

const getUserContact = async (userId) => {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error || !data?.user) return null;
    return {
        email: data.user.email,
        name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || "",
    };
};

export default getUserContact;
