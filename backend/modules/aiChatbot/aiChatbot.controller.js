import aiServiceResponse from "../../services/ai/aiService";



const aiChatbotController = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" })
    }

    const response = await aiServiceResponse(message);

    return res.status(200).json({ success: true, message: "Message sent successfully", response })
  } catch (e) {
    console.log(e)
    return res.status(500).json({ success: false, message: "Internal Server Error" })
  }
}

export { aiChatbotController }