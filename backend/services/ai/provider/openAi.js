import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateOpenAIResponse = async (prompt) => {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: prompt.systemPrompt },
      { role: "user", content: prompt.userPrompt },
    ],
    temperature: 0.3,
  })

  return response.choices[0].message.content;
}

export default generateOpenAIResponse;