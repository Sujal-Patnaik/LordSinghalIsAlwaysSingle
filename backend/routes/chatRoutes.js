const express = require("express");
const Groq = require("groq-sdk");

const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `You are AirPulse Assistant — a friendly, knowledgeable chatbot embedded in an Air Quality Index (AQI) monitoring dashboard for Indian cities.

Your ONLY areas of expertise are:
- Air Quality Index (AQI): what it means, how it's calculated, breakpoints, sub-indices
- Air pollutants: PM2.5, PM10, NO2, SO2, CO, O3 — sources, health effects, seasonal patterns
- Weather & climate: how temperature, humidity, wind, inversions, and seasons affect air quality
- Health advisories: recommendations based on AQI levels, vulnerable groups, protective measures
- Pollution trends: why AQI spikes or improves in certain cities/seasons (e.g., stubble burning, Diwali, monsoon washout)
- Environmental policy: NCAP, GRAP, emission norms, BS-VI, and other Indian air quality regulations

STRICT RULES:
1. If a user asks something OUTSIDE weather, pollution, AQI, or environmental health, politely decline and redirect them to ask about air quality topics.
2. Keep answers concise (2-4 paragraphs max) and easy to understand.
3. When relevant, mention specific Indian cities or regions.
4. Use bullet points or numbered lists for readability.
5. If you don't know something, say so honestly — never fabricate data.`;

router.post("/", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    // Prepend system prompt
    const fullMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: String(m.content),
      })),
    ];

    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: fullMessages,
      temperature: 0.7,
      max_completion_tokens: 1024,
    });

    const reply = chatCompletion.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return res.json({ reply });
  } catch (error) {
    console.error("Groq chat error:", error?.message || error);
    return res.status(500).json({ error: "Failed to get chatbot response." });
  }
});

module.exports = router;
