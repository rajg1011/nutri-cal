import aiServiceResponse from "../../services/ai/aiService.js";
import supabaseAdmin from "../../config/supabaseAdmin.js";
import { deleteCache } from "../../services/cache/cache.js";
import { Keys } from "../../utils/cacheKeys.js";

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
    
    if (req.subscriptionType === 'QUESTION') {
      const { data: remaining, error } = await supabaseAdmin.rpc('decrement_question_credit', { p_user_id: req.user });

      if (error) {
        console.log("Error decrementing question credit:", error);
      } else if (!remaining || remaining.length === 0 || remaining[0].question_asked <= 0) {
        await deleteCache(Keys.userSubscribe(req.user));
      }
    }

    return res.status(200).json({ success: true, response })
  } catch (e) {
    console.log(e)
    return res.status(500).json({ success: false, message: "Internal Server Error" })
  }
}

export { aiChatbotController }