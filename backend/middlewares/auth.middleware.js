import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL, process.env.SUPABASE_ANON_KEY)

const AuthMiddleWare = async (req, res, next) => {
    try {
        if (req.path === "/webhook") {
            return next(); 
        }
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized" })
        }
        const token = authHeader.split(" ")[1];
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data?.user) {
            return res.status(401).json({ message: "Unauthorized" })
        }
        req.supabase = createClient(
            process.env.SUPABASE_PROJECT_URL,
            process.env.SUPABASE_ANON_KEY,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            }
        );
        req.user = data.user.id
        next();
    } catch (e) {
        console.log(e)
        res.status(500).json({ message: "Internal Server Error" })
    }
}

export default AuthMiddleWare