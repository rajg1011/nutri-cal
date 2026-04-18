import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(process.env.SUPABASE_PROJECT_URL, process.env.SUPABASE_SUPER_ADMIN, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

export default supabaseAdmin;