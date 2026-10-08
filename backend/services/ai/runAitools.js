import { generate_meal_recommendations, get_deficiency_analysis, get_meal_history, get_today_nutrition, get_user_profile, get_weekly_trends, log_meal, search_food_database, update_goal } from "./aiTools.js";
import logger from "../../utils/logger.js";

const TOOL_MAP = {
    get_user_profile,
    get_today_nutrition,
    get_meal_history,
    get_weekly_trends,
    search_food_database,
    log_meal,
    update_goal,
    get_deficiency_analysis,
    generate_meal_recommendations,
};

async function runAiTool(name, args, context, signal) {
    const tool = TOOL_MAP[name];

    if (!tool) {
        logger.warn({ tool: name }, "Unknown AI tool requested");
        return {
            success: false,
            error: {
                code: "UNKNOWN_TOOL",
                message: `Tool ${name} not found`,
            },
        };
    }

    try {
        return await tool(args, context, signal);
    } catch (e) {
        logger.error({ err: e, tool: name, userId: context?.userId }, "AI tool execution failed");
        return {
            success: false,
            error: {
                code: "TOOL_EXECUTION_FAILED",
                message: e.message || "Tool execution failed",
            },
        };
    }
}


export default runAiTool;