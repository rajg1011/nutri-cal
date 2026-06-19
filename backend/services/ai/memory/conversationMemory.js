import { Keys, TTL } from "../../../utils/cacheKeys.js";
import { getCache, setCache, deleteCache } from "../../cache/cache.js";

const MAX_RECENT_MESSAGES = 12;
const SUMMARIZE_TRIGGER_MESSAGES = MAX_RECENT_MESSAGES + 6;
const MAX_FACTS_IN_PROMPT = 50;

const FACTS_SYSTEM_PROMPT = `From this nutrition-coaching conversation snippet, extract only concrete, durable facts worth remembering for future conversations: custom food calorie/macro values the user states, allergies, dietary restrictions, stated goals, or commitments.
Ignore generic questions, small talk, and anything not explicitly stated as true about this user. Do not invent or infer facts that aren't directly stated.
Each fact must be a short, self-contained statement (e.g. "User's homemade chole bhature is 120 kcal per serving").
Respond with strict JSON only: {"facts": ["...", "..."]}. Respond {"facts": []} if nothing qualifies.`;

const getContext = async (userId, supabase) => {
  let recentMessages = await getCache(Keys.chatHistory(userId));

  if (!recentMessages) {
    const { data, error } = await supabase
      .from("chatHistory")
      .select("role, content")
      .order("created_at", { ascending: false })
      .limit(MAX_RECENT_MESSAGES);

    if (error) throw error;

    recentMessages = (data || []).reverse();
    if (recentMessages.length > 0) {
      await setCache(Keys.chatHistory(userId), recentMessages, TTL.CHAT_MEMORY);
    }
  }

  let facts = await getCache(Keys.userMemoryFacts(userId));
  if (!facts) {
    const { data, error } = await supabase
      .from("userMemoryFacts")
      .select("fact")
      .order("created_at", { ascending: false })
      .limit(MAX_FACTS_IN_PROMPT);

    if (error) throw error;

    facts = (data || []).map((row) => row.fact).reverse();
    if (facts.length > 0) {
      await setCache(Keys.userMemoryFacts(userId), facts, TTL.CHAT_MEMORY);
    }
  }

  return { facts, recentMessages };
};


const extractFacts = async (userId, supabase, oldMessages, existingFacts, complete) => {
  try {
    const transcript = oldMessages.map((message) => `${message.role}: ${message.content}`).join("\n");
    const messages = [
      { role: "system", content: FACTS_SYSTEM_PROMPT },
      { role: "user", content: `Conversation snippet: ${transcript}` },
    ];

    let newFacts;

    const { content } = await complete(messages, { json: true });
    const parsed = JSON.parse(content);
    newFacts = Array.isArray(parsed?.facts)
      ? parsed.facts.filter((fct) => typeof fct === "string" && fct.trim().length > 0)
      : [];

    if (newFacts.length === 0) return;

    const { error } = await supabase
      .from("userMemoryFacts")
      .insert(newFacts.map((fact) => ({ user_id: userId, fact })));

    if (error) throw error;

    const updatedFacts = [...existingFacts, ...newFacts].slice(-MAX_FACTS_IN_PROMPT);
    await setCache(Keys.userMemoryFacts(userId), updatedFacts, TTL.CHAT_MEMORY);
  } catch (e) {
    console.log(e, "Failed to extract memory facts; skipping this batch");
    throw e;
  }
};

const appendTurn = async ({ userId, supabase, userMessage, assistantMessage, usage, recentMessages, facts, complete }) => {
  try {
    const { error } = await supabase.from("chatHistory").insert([
      { user_id: userId, role: "user", content: userMessage },
      {
        user_id: userId,
        role: "assistant",
        content: assistantMessage,
        prompt_tokens: usage?.prompt_tokens ?? null,
        completion_tokens: usage?.completion_tokens ?? null,
      },
    ]);

    if (error) throw error;

    await deleteCache(Keys.chatHistoryRecent(userId));

    const updated = [
      ...recentMessages,
      { role: "user", content: userMessage },
      { role: "assistant", content: assistantMessage },
    ];

    if (updated.length > SUMMARIZE_TRIGGER_MESSAGES) {
      const overflow = updated.slice(0, updated.length - MAX_RECENT_MESSAGES);
      const kept = updated.slice(updated.length - MAX_RECENT_MESSAGES);

      await extractFacts(userId, supabase, overflow, facts, complete);
      await setCache(Keys.chatHistory(userId), kept, TTL.CHAT_MEMORY);
      return;
    }

    await setCache(Keys.chatHistory(userId), updated, TTL.CHAT_MEMORY);
  } catch (e) {
    console.log("Error in appen", e);
    throw e;
  }
};

export { getContext, appendTurn };
