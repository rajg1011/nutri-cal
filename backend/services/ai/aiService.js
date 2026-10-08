import { promptBuilderforChatbot } from "./promptBuilder.js";
import generateOpenAIResponse, { completeOpenAI } from "./provider/openAi.js";
import { getContext, appendTurn } from "./memory/conversationMemory.js";
import logger from "../../utils/logger.js";

const providers = {
  openai: { generateResponse: generateOpenAIResponse, complete: completeOpenAI },
}

const aiServiceResponse = async (message, toolContext = {}) => {
  try {
    const providerKey = (process.env.AI_Provider?.toLowerCase() || "openai");
    const provider = providers[providerKey];

    if (!provider) {
      throw new Error("Error in calling function")
    }

    const { userId, supabase } = toolContext;
    const systemPrompt = promptBuilderforChatbot();
    const { facts, recentMessages } = await getContext(userId, supabase);

    const messages = [
      { role: "system", content: systemPrompt },
      ...(facts?.length ? [{ role: "system", content: `Known facts about this user from past conversations: ${facts.map((fact) => `- ${fact}`).join("\n")}` }] : []),
      ...recentMessages,
      { role: "user", content: message },
    ];

    const { content, usage } = await provider.generateResponse(messages, toolContext);

    try {
      await appendTurn({
        userId,
        supabase,
        userMessage: message,
        assistantMessage: content,
        usage,
        recentMessages,
        facts,
        complete: provider.complete,
      });
    } catch (memoryError) {
      logger.error({ err: memoryError, userId }, "Failed to persist conversation memory");
    }

    return content

  } catch (e) {
    logger.error({ err: e, userId: toolContext.userId }, "Error in aiServiceResponse")
    throw e
  }
}

export default aiServiceResponse
