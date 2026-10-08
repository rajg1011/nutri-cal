import { validMealTypes, MEAL_UNITS } from "../../constant.js";
import { Keys, TTL } from "../../utils/cacheKeys.js";
import { deleteCache, getCache, setCache } from "../cache/cache.js";
import logger from "../../utils/logger.js";

const errorMessage = (errorCode, errorMessage) => {
    return {
        success: false,
        error: {
            errorCode,
            errorMessage
        }
    }
}


async function get_user_profile(_, { supabase, signal, userId }) {
    try {
        const profileDetails = await getCache(Keys.userProfileDetails(userId));

        if (profileDetails) {
            return {
                success: true,
                data: profileDetails
            }
        }
        const { data, error } = await supabase
            .from('userProfile')
            .select('height,weight,age,gender,dietType,activityLevel,goal')
            .single()
            .abortSignal(signal);

        if (error) throw error

        await setCache(Keys.userProfileDetails(userId), data, TTL.USER_PROFILE)

        return {
            success: true,
            data
        };

    } catch (e) {
        logger.error({ err: e, tool: "get_user_profile", userId }, "AI tool failed");
        return errorMessage('INTERNAL_SERVER_ERROR', e?.message || 'Interal Server Error')
    }
}


async function get_today_nutrition(_, { supabase, signal, userId }) {
    try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        let userGoalCache = await getCache(Keys.userGoal(userId));

        const [mealsResult, goalResult] = await Promise.all([
            supabase
                .from('userCaloriesData')
                .select('calories, protein, meal_type')
                .gte('created_at', start.toISOString())
                .lte('created_at', end.toISOString())
                .abortSignal(signal),

            !userGoalCache ? supabase
                .from('dailyUserGoals')
                .select('calories')
                .order('created_at', { ascending: false })
                .limit(1)
                .single()
                .abortSignal(signal) : Promise.resolve({ data: null, error: null })
        ]);

        const { data: meals, error } = mealsResult;
        const { data: goal, error: goalError } = goalResult;

        if (error) throw error;
        if (goalError) throw goalError;

        if(!userGoalCache && goal){
            await setCache(Keys.userGoal(userId), goal, TTL.USER_GOAL)
        }

        const total_calories = meals.reduce(
            (sum, meal) => sum + (meal.calories || 0),
            0
        );

        const total_protein = meals.reduce(
            (sum, meal) => sum + (meal.protein || 0),
            0
        );

        return {
            success: true,
            data: {
                total_calories,
                total_protein,
                goal_calories: goal?.calories || null,
                remaining: goal?.calories ? goal.calories - total_calories : null,
                meal_count: meals.length,
            }
        };
    } catch (e) {
        logger.error({ err: e, tool: "get_today_nutrition", userId }, "AI tool failed");
        return errorMessage("INTERNAL_SERVER_ERROR", e?.message || "Internal Server Error")
    }
}



async function get_meal_history({ days = 7 }, { supabase, signal }) {
    try {
        if (typeof days !== "number") {
            return errorMessage('INVALID_FORMAT', "Days must be Number")
        }
        const since = new Date();
        since.setDate(since.getDate() - days);

        const { data, error } = await supabase
            .from('userCaloriesData')
            .select('created_at,food_item,meal_type,calories,protein,meal_unit, quantity')
            .gte('created_at', since.toISOString())
            .order('created_at', { ascending: false })
            .abortSignal(signal);

        if (error) throw error;
        return {
            success: true,
            data
        }
    } catch (e) {
        logger.error({ err: e, tool: "get_meal_history" }, "AI tool failed");
        return errorMessage('INTERNAL_SERVER_ERROR', e?.message || "Internal Server Error")
    }
}


async function get_weekly_trends(_, { supabase, signal }) {
    try {
        const since = new Date();
        since.setDate(since.getDate() - 7);

        const { data, error } = await supabase
            .from('userCaloriesData')
            .select('calories, protein, created_at')
            .gte('created_at', since.toISOString())
            .abortSignal(signal);

        if (error) throw error;

        const byDay = {};
        for (const m of data) {
            const day = m.created_at.split('T')[0];
            if (!byDay[day]) byDay[day] = { date: day, calories: 0, protein: 0 };
            byDay[day].calories += m.calories || 0;
            byDay[day].protein += m.protein || 0;
        }

        const days = Object.values(byDay);
        const avg_calories = days.reduce((s, d) => s + d.calories, 0) / (days.length || 1);
        const avg_protein = days.reduce((s, d) => s + d.protein, 0) / (days.length || 1);

        return {
            success: true,
            data: { days, avg_calories, avg_protein }
        };
    } catch (e) {
        logger.error({ err: e, tool: "get_weekly_trends" }, "AI tool failed");
        return errorMessage('INTERNAL_SERVER_ERROR', e?.message || "Internal Server Error")
    }
}


async function search_food_database({ query }, { supabase, signal }) {
    try {
        if (!query) {
            return errorMessage('ARGUMENT_NOT_AVAILABLE', "Provide Food to search")
        }
        if (typeof query !== "string") {
            return errorMessage('INVALID_FORMAT', "Days must be Number")
        }

        const cached = await getCache(Keys.foodSearch(query));
        if (cached) {
            return {
                success: true,
                data: cached
            }
        }

        const { data, error } = await supabase
            .from('foodDescription')
            .select('name,caloriesPerUnit,proteinPerUnit,unit,unitMeans')
            .or(`name.ilike.%${query}%,aliases.ilike.%${query}%`)
            .limit(10)
            .abortSignal(signal);

        if (error) throw error;

        await setCache(Keys.foodSearch(query), data, TTL.FOOD_SEARCH)

        return {
            success: true,
            data
        }
    } catch (e) {
        logger.error({ err: e, tool: "search_food_database", query }, "AI tool failed");
        return errorMessage('INTERNAL_SERVER_ERROR', e?.message || "Internal Server Error")
    }
}


async function log_meal({ food_item, meal_type, calories, protein, quantity, meal_unit }, { supabase, signal }) {
    try {
        if (!food_item) {
            return errorMessage('ARGUMENT_NOT_AVAILABLE', 'Provide food item')
        }
        if (!meal_type) {
            return errorMessage('ARGUMENT_NOT_AVAILABLE', 'Provide meal type e.g. breakfast, dinner')
        }
        if (!calories) {
            return errorMessage('ARGUMENT_NOT_AVAILABLE', 'Provide calories provided by food')
        }
        if (!protein) {
            return errorMessage('ARGUMENT_NOT_AVAILABLE', 'Provide Protein provided by food')
        }
        if (!meal_unit) {
            return errorMessage('ARGUMENT_NOT_AVAILABLE', 'Provide Unit of meal like Katori, Piece')
        }
        if (typeof food_item !== "string" || typeof meal_type !== "string" || !validMealTypes.includes(meal_type.toLowerCase()) || typeof calories !== "number" || typeof protein !== "number" || typeof quantity !== "number" || typeof meal_unit !== "string" || !MEAL_UNITS.some(u => u.toLowerCase() === meal_unit.toLowerCase())) {
            return errorMessage('INVALID_FORMAT', "Provided argument must follow type")
        }

        const { _, error } = await supabase
            .from('userCaloriesData')
            .insert([{ food_item, meal_type, calories, protein, quantity, meal_unit }])
            .abortSignal(signal);

        if (error) throw error;

        return { success: true, data: "Meal Inserted Successfully" };
    } catch (e) {
        logger.error({ err: e, tool: "log_meal", meal_type }, "AI tool failed");
        return errorMessage('INTERNAL_SERVER_ERROR', e?.message || "Internal Server Error")

    }
}


async function update_goal({ calories }, { supabase, signal, userId }) {
    try {
        if (!calories) {
            return errorMessage('ARGUMENT_NOT_AVAILABLE', "Provide calories to be inserted")
        }
        const { _ , error } = await supabase
            .from('dailyUserGoals')
            .insert([{ calories }])
            .abortSignal(signal)

        if (error) throw error;

        await deleteCache(Keys.userGoal(userId));

        return { success: true, data: "Updated Successfully" };
    } catch (e) {
        logger.error({ err: e, tool: "update_goal", userId }, "AI tool failed");
        return errorMessage('INTERNAL_SERVER_ERROR', e?.message || "Internal Server Error")
    }
}


async function get_deficiency_analysis(_, { supabase, signal, userId }) {
    try {
        const [profile, today] = await Promise.all([
            get_user_profile({}, { supabase, signal, userId }),
            get_today_nutrition({}, { supabase, signal, userId })
        ]);

        if (!profile.success || !today.success) {
            return errorMessage('INTERNAL_SERVER_ERROR', 'Failed to fetch profile or nutrition');
        }

        const protein_target = profile.data.weight ? Math.round(profile.data.weight * 1.6) : null;
        const calorie_target = today.data.goal_calories;

        const deficiencies = [];
        if (protein_target && today.data.total_protein < protein_target) {
            deficiencies.push({
                nutrient: 'protein',
                consumed: today.data.total_protein,
                target: protein_target,
                gap: Math.round(protein_target - today.data.total_protein),
                target_basis: 'estimated at 1.6g protein per kg bodyweight - a generic guideline, not a personalized goal the user set',
            });
        }
        if (calorie_target && today.data.total_calories < calorie_target * 0.8) {
            deficiencies.push({
                nutrient: 'calories',
                consumed: today.data.total_calories,
                target: calorie_target,
                gap: calorie_target - today.data.total_calories,
                target_basis: 'the calorie goal the user set',
            });
        }

        return {
            success: true,
            data: { deficiencies, protein_target, calorie_target, today: today.data, profile: profile.data }
        };
    } catch (e) {
        logger.error({ err: e, tool: "get_deficiency_analysis", userId }, "AI tool failed");
        return errorMessage('INTERNAL_SERVER_ERROR', e?.message || 'Internal Server Error');
    }
}



async function generate_meal_recommendations({ meal_type = null }, { supabase, signal, userId }) {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const userPrefCache = await getCache(Keys.userPreference(userId));

        const [analysis, recentFoods, todayFoods, prefsResult] = await Promise.all([
            get_deficiency_analysis({}, { supabase, signal, userId }),
            supabase
                .from('userCaloriesData')
                .select('food_item, meal_type, calories, protein, quantity, meal_unit')
                .gte('created_at', sevenDaysAgo)
                .order('created_at', { ascending: false })
                .abortSignal(signal),
            supabase
                .from('userCaloriesData')
                .select('food_item')
                .gte('created_at', todayStart.toISOString())
                .abortSignal(signal),
            !userPrefCache ? supabase
                .from('userPreference')
                .select('food, protein, calories, unit, unitMeans')
                .abortSignal(signal) : Promise.resolve({ data: null, error: null }),
        ]);

        if (!analysis.success) {
            return errorMessage('INTERNAL_SERVER_ERROR', 'Failed to fetch deficiency analysis');
        }

        if (!userPrefCache && prefsResult.data) {
            await setCache(Keys.userPreference(userId), prefsResult.data, TTL.USER_PREFERENCE)
        }

        const preferredFoods = userPrefCache || prefsResult.data || [];

        const needsProtein = analysis.data.deficiencies.find(d => d.nutrient === 'protein');
        const needsCalories = analysis.data.deficiencies.find(d => d.nutrient === 'calories');

        const todayFoodNames = new Set((todayFoods.data || []).map(f => f.food_item.toLowerCase()));
        
        const seenNames = new Set();
        const notYetEatenToday = (recentFoods.data || []).filter(f => {
            const name = f.food_item.toLowerCase();
            if (todayFoodNames.has(name) || seenNames.has(name)) return false;
            seenNames.add(name);
            return true;
        });

        let suggestedFoods = [];
        if (notYetEatenToday.length < 3) {
            let query = supabase.from('foodDescription').select('name, caloriesPerUnit, proteinPerUnit, unit, unitMeans');
            if (needsProtein) query = query.order('proteinPerUnit', { ascending: false });
            else if (needsCalories) query = query.order('caloriesPerUnit', { ascending: false });
            const { data: foods } = await query.limit(5).abortSignal(signal);
            suggestedFoods = foods || [];
        }

        return {
            success: true,
            data: {
                meal_type,
                diet_type: analysis.data.profile.dietType,
                deficiencies: analysis.data.deficiencies,
                recent_not_eaten_today: notYetEatenToday,
                preferred_foods: preferredFoods,
                suggested_foods: suggestedFoods,
                low_data: notYetEatenToday.length < 3
            }
        };

    } catch (e) {
        logger.error({ err: e, tool: "generate_meal_recommendations", userId }, "AI tool failed");
        return errorMessage('INTERNAL_SERVER_ERROR', e?.message || 'Internal Server Error');
    }
}



export {
    get_user_profile,
    get_today_nutrition,
    get_meal_history,
    get_weekly_trends,
    search_food_database,
    log_meal,
    update_goal,
    get_deficiency_analysis,
    generate_meal_recommendations,
}