import { promptBuilderforChatbot } from "./promptBuilder.js";
import generateOpenAIResponse from "./provider/openAi.js";


const provider = {
  "openai": generateOpenAIResponse
}

const aiServiceResponse = async (message, toolContext = {}) => {
  try {
    const providerey = (process.env.AI_Provider?.toLowerCase() || "openai");
    const functionCall = provider[providerey];
    
    if (!functionCall) {
      throw new Error("Error in calling function")
    }
    const buildPrompt = promptBuilderforChatbot(message);

    const response = await functionCall(buildPrompt, toolContext);

    return response

  } catch (e) {
    console.log(e)
    throw e
  }
}

export default aiServiceResponse