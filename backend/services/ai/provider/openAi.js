import OpenAI from "openai";
import runAiTool from "../runAitools.js";
import { withTimeout } from "../../../utils/abortReq.js";
import { validMealTypes } from "../../../constant.js";


const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_TOOL_ROUNDS = 5;
const TOOL_TIMEOUT_MS = 30000;

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
            description: "Serving unit like piece, bowl, katori, cup, teaspoon, or plate"
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
            type: "number",
            enum: validMealTypes,
            description: "Type of meal such as breakfast, lunch, dinner, or snack"
          },
        },
        required: ["meal_type"],
        additionalProperties: false
      },
    }
  },
];


const generateOpenAIResponse = async (prompt, toolContext = {}) => {
  const messages = [
    { role: "system", content: prompt.systemPrompt },
    { role: "user", content: prompt.userPrompt },
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
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
            },
            { signal }
          ),
        TOOL_TIMEOUT_MS,
        "OpenAI API call"
      );
    } catch (e) {
      throw e;
    }

    const message = response.choices[0].message;
    const toolCalls = message.tool_calls || [];

    if (toolCalls.length === 0) {
      return message.content || "";
    }

    messages.push({
      role: "assistant",
      content: message.content || null,
      tool_calls: message.tool_calls || [],
    });

    const toolResponses = await Promise.all(
      toolCalls.map(async (toolCall) => {
        try {
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

          return {
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          };
        } catch (error) {
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

  console.log({ rounds: MAX_TOOL_ROUNDS }, "Exhausted tool rounds")
  return "I could not finish that request because too many tool calls were needed. Please ask a narrower question.";
}

export default generateOpenAIResponse;