import { createClient } from "@supabase/supabase-js";
import { decodedToken } from "../utils/getJWTInfo.js";
import { Keys } from "../utils/cacheKeys.js";
import { getCache, setCache } from "../services/cache/cache.js";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL, process.env.SUPABASE_ANON_KEY)

const getUserSupabase = (token) =>
    createClient(
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

const AuthMiddleWare = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized" })
        }
        const token = authHeader.split(" ")[1];

        const cachedUser = await getCache(Keys.userAuth(token));
        if (cachedUser) {
            req.user = cachedUser.userId;
            req.supabase = getUserSupabase(token)
            return next();
        }

        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data?.user) {
            return res.status(401).json({ message: "Unauthorized" })
        }

        const tokenExpiresIn = decodedToken(token).exp - Math.floor(Date.now() / 1000);

        if (tokenExpiresIn > 0) {
            await setCache(Keys.userAuth(token), { userId: data.user.id }, tokenExpiresIn)
        }

        req.supabase = getUserSupabase(token);
        req.user = data.user.id

        return next();
    } catch (e) {
        console.log(e)
        return res.status(500).json({ message: "Internal Server Error" })
    }
}

export default AuthMiddleWare