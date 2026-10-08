import aiServiceResponse from "../../services/ai/aiService.js";
import supabaseAdmin from "../../config/supabaseAdmin.js";
import { getCache, setCache, deleteCache } from "../../services/cache/cache.js";
import { Keys, TTL } from "../../utils/cacheKeys.js";
import { SUBSCRIPTION_TYPE_QUESTION } from "../../constant.js";
import logger from "../../utils/logger.js";

const DEFAULT_HISTORY_LIMIT = 10;

const aiChatbotController = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" })
    }

    const response = await aiServiceResponse(message, {
      supabase: req.supabase,
      userId: req.user,
    });
    
    if (req.subscriptionType === SUBSCRIPTION_TYPE_QUESTION) {
      const { data: remaining, error } = await supabaseAdmin.rpc('decrement_question_credit', { p_user_id: req.user });

      if (error) {
        logger.error({ err: error, userId: req.user }, "Error decrementing question credit");
      } else if (!remaining || remaining.length === 0 || remaining[0].question_asked <= 0) {
        await deleteCache(Keys.userSubscribe(req.user));
      }
    }

    return res.status(200).json({ success: true, response })
  } catch (e) {
    logger.error({ err: e, userId: req.user }, "Error in aiChatbotController");
    return res.status(500).json({ success: false, message: "Internal Server Error" })
  }
}

const getChatHistoryController = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || DEFAULT_HISTORY_LIMIT, 50);
    const cursor = req.query.cursor ? Number(req.query.cursor) : null;
    const isLatestPage = !cursor && limit === DEFAULT_HISTORY_LIMIT;

    if (isLatestPage) {
      const cached = await getCache(Keys.chatHistoryRecent(req.user));
      if (cached) {
        return res.status(200).json({ success: true, history: cached });
      }
    }

    let query = req.supabase
      .from("chatHistory")
      .select("id, role, content, created_at")
      .order("id", { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt("id", cursor);
    }

    const { data, error } = await query;

    if (error) throw error;

    const history = (data || []).reverse();

    if (isLatestPage && history.length > 0) {
      await setCache(Keys.chatHistoryRecent(req.user), history, TTL.CHAT_MEMORY);
    }

    return res.status(200).json({ success: true, history })
  } catch (e) {
    logger.error({ err: e, userId: req.user }, "Error in getChatHistoryController");
    return res.status(500).json({ success: false, message: "Internal Server Error" })
  }
}

export { aiChatbotController, getChatHistoryController }