import OpenAI from "openai";
import runAiTool from "../runAitools.js";
import { withTimeout } from "../../../utils/abortReq.js";
import { validMealTypes, MEAL_UNITS } from "../../../constant.js";
import langfuse from "../../../config/langfuse.js";
import { safeFlush } from "../observability/langfuse.js";


const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_TOOL_ROUNDS = 5;
const TOOL_TIMEOUT_MS = 30000;
const MAX_RESPONSE_TOKENS = 500;
const MAX_COMPLETION_TOKENS = 300;

const sumUsage = (totals, usage) => ({
  prompt_tokens: totals.prompt_tokens + (usage?.prompt_tokens || 0),
  completion_tokens: totals.completion_tokens + (usage?.completion_tokens || 0),
  total_tokens: totals.total_tokens + (usage?.total_tokens || 0),
});

const tools = [
  {
    type: "function",
    function: {
      name: 'get_user_profile',
      description: 'Get the user\'s profile (height, weight, age, gender, diet, activity, goal).',
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: 'get_today_nutrition',
      description: "Get today's nutrition summary including total calories consumed, total protein consumed, calorie goal, remaining calories, and number of meals logged today.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: 'get_meal_history',
      description: "Get meals logged by the user over the last N days. Defaults to the past 7 days if no value is provided.",
      parameters: {
        type: "object",
        properties: {
          days: {
            type: "integer",
            minimum: 1,
            description: "Number of past days to fetch meal logs for"
          }
        },
        required: [],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: 'get_weekly_trends',
      description: 'Get daily totals and averages calories and protein for the past 7 days.',
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: 'search_food_database',
      description: "Search the app's food database for foods matching a name or alias. Returns nutrition details and serving unit information for matching foods.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Food name or keyword to search for"
          },
        },
        required: ["query"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: 'log_meal',
      description: 'Log a meal entry for the user including food item, quantity, meal type, calories, protein, and serving unit.',
      parameters: {
        type: "object",
        properties: {
          food_item: {
            type: "string",
            description: "Name of the food item"
          },
          meal_type: {
            type: "string",
            enum: validMealTypes,
            description: "Type of meal such as breakfast, lunch, dinner, or snack"
          },
          calories: {
            type: "number",
            minimum: 1,
            description: "Calories provided by the meal"
          },
          protein: {
            type: "number",
            minimum: 1,
            description: "Protein provided by the meal in grams"
          },
          quantity: {
            type: "number",
            minimum: 1,
            description: "Quantity of the food consumed"
          },
          meal_unit: {
            type: "string",
            enum: MEAL_UNITS,
            description: "Serving unit for the meal"
          },
        },
        required: ["food_item", "meal_type", "calories", "protein", "quantity", "meal_unit"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: 'update_goal',
      description: "Set or update the user's daily nutrition calories targets.",
      parameters: {
        type: "object",
        properties: {
          calories: {
            type: "number",
            minimum: 1,
            description: "Calories to be set for daily goal"
          },
        },
        required: ["calories"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: 'get_deficiency_analysis',
      description: "Analyze the user's nutrition intake for today and identify nutrient deficiencies or gaps based on meals logged and daily goals.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: 'generate_meal_recommendations',
      description: "Generate personalized meal and food recommendations based on the user's nutrition deficiencies, diet preferences, goals, and recent meal history.",
      parameters: {
        type: "object",
        properties: {
          meal_type: {
            type: "string",
            enum: validMealTypes,
            description: "Type of meal such as breakfast, lunch, dinner, or snack. Omit for general recommendations."
          },
        },
        required: [],
        additionalProperties: false
      },
    }
  },
];


const generateOpenAIResponse = async (inputMessages, toolContext = {}) => {
  const messages = [...inputMessages];
  let usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

  const trace = langfuse.trace({
    name: "chatbot-request",
    userId: toolContext.userId,
    input: inputMessages,
  });

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const generation = trace.generation({
      name: `round-${round}`,
      model: "gpt-4o-mini",
      input: messages,
    });

    let response;
    try {
      response = await withTimeout(
        (signal) =>
          client.chat.completions.create(
            {
              model: "gpt-4o-mini",
              messages,
              tools,
              tool_choice: "auto",
              temperature: 0.3,
              max_completion_tokens: MAX_RESPONSE_TOKENS,
            },
            { signal }
          ),
        TOOL_TIMEOUT_MS,
        "OpenAI API call"
      );
    } catch (e) {
      generation.end({ level: "ERROR", statusMessage: e.message });
      await safeFlush();
      throw e;
    }

    usage = sumUsage(usage, response.usage);

    const message = response.choices[0].message;
    const toolCalls = message.tool_calls || [];

    if (toolCalls.length === 0) {
      trace.update({ output: message.content || "" });
      await safeFlush();
      return { content: message.content || "", usage };
    }

    messages.push({
      role: "assistant",
      content: message.content || null,
      tool_calls: message.tool_calls || [],
    });

    const toolResponses = await Promise.all(
      toolCalls.map(async (toolCall) => {
        try {
          const span = trace.span({
            name: `tool:${toolCall.function.name}`,
            input: toolCall.function.arguments,
          });

          const args = JSON.parse(
            toolCall.function.arguments
          );

          const result = await withTimeout(
            (signal) =>
              runAiTool(
                toolCall.function.name,
                args,
                toolContext,
                signal
              ),
            TOOL_TIMEOUT_MS,
            `tool:${toolCall.function.name}`
          )
          span.end({ output: result });

          return {
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          };
        } catch (error) {
          span.end({ level: "ERROR", statusMessage: error.message ?? String(error) });
          return {
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: error.message ?? String(error) }),
          };
        }
      })
    );

    messages.push(...toolResponses);
  }

  trace.update({ output: "exhausted-rounds" });
  await safeFlush();  // we are flushing bcz lambda will freez as request complete.

  console.log({ rounds: MAX_TOOL_ROUNDS }, "Exhausted tool rounds")
  return {
    content: "I could not finish that request because too many tool calls were needed. Please ask a narrower question.",
    usage,
  };
}

const completeOpenAI = async (messages, { json = false } = {}) => {
  const response = await withTimeout(
    (signal) =>
      client.chat.completions.create(
        {
          model: "gpt-4o-mini",
          messages,
          temperature: 0.2,
          max_completion_tokens: MAX_COMPLETION_TOKENS,
          ...(json ? { response_format: { type: "json_object" } } : {}),
        },
        { signal }
      ),
    TOOL_TIMEOUT_MS,
    "OpenAI completion call"
  );

  return {
    content: response.choices[0].message.content || "",
    usage: sumUsage({ prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }, response.usage),
  };
};

export default generateOpenAIResponse;
export { completeOpenAI };