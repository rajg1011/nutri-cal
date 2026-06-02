import aiServiceResponse from "../../services/ai/aiService.js";

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

    return res.status(200).json({ success: true, response })
  } catch (e) {
    console.log(e)
    return res.status(500).json({ success: false, message: "Internal Server Error" })
  }
}

export { aiChatbotController }