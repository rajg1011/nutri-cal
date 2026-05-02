import aiServiceResponse from "../../ai/aiService.js";
import { Constants, SUBSCRIPTION_TYPE } from "../../constant.js";


const aiChatbotController = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" })
    }

    const { data, error } = await req.supabase.from('userSubscritionsDetails').select('*');
    if (error) {
      return res.status(500).json({ success: false, message: "Internal Server Error" })
    }

    if (!data || +data[0]?.subcription_status === 0) {
      return res.status(400).json({ success: false, message: "No subscription found" })
    }

    if ((data[0]?.plan?.toLowerCase() !== Object.keys(SUBSCRIPTION_TYPE)?.[0] && data[0]?.tokens_remaining <= 0) || (data[0]?.plan?.toLowerCase() === Object.keys(SUBSCRIPTION_TYPE)?.[1] && data[0]?.questions_asked >= Constants?.QUESTION_AKSED)) {
      return res.status(400).json({ success: false, message: "Limit ends" })
    }

    const response = await aiServiceResponse(message);

    return res.status(200).json({ success: true, message: "Message sent successfully", response })
  } catch (e) {
    console.log(e)
    return res.status(500).json({ success: false, message: "Internal Server Error" })
  }
}

export { aiChatbotController }