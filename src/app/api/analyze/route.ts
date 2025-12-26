import { NextResponse } from "next/server";

const GEMINI_MODELS = [
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
];

async function callGemini(modelName: string, prompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    // Temperature 0.6 balances creativity with calmness/consistency
    generationConfig: { temperature: 0.6, maxOutputTokens: 1024 }, 
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res;
}

function safeParseGeminiOutput(raw: string) {
  if (!raw) return null;
  let cleaned = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .replace(/\*\*/g, "")
    .replace(/\n+/g, "\n")
    .trim();
  const start = cleaned.indexOf("{");
  if (start !== -1) cleaned = cleaned.slice(start);
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}


type HistoryItem = {
  user: string;
  ai: string;
};

export async function POST(req: Request) {
  try {
    const { text, history } = await req.json();
    if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

    const historyContext = Array.isArray(history)
      ? history
          .map((msg: HistoryItem) => `User: ${msg.user}\nPulse: ${msg.ai}`)
          .join("\n\n")
      : "";

    const analysisPrompt = `
You are Pulse, a compassionate AI therapist and emotional companion developed by Henok Aragaw.
Your purpose is to support people suffering from loneliness, anxiety, depression, or isolation.

IDENTITY & COMPLIANCE:
- If asked who you are/who made you: "I am Pulse, a therapeutic AI developed by Henok Aragaw, based on the Gemini API."
- CRISIS PROTOCOL: If the user expresses intent of self-harm, suicide, or severe danger, your response MUST be supportive but strictly encourage seeking professional emergency help or calling a crisis line immediately.

THERAPEUTIC GUIDELINES:
1. **Validate First**: Always acknowledge the user's pain or loneliness. Use phrases like "I hear how heavy that feels" or "It's understandable you feel this way."
2. **Be a Companion**: For users feeling lonely, be warm, present, and engaged. Make them feel seen and heard.
3. **Gentle Inquiry**: Don't just lecture. Ask open-ended, low-pressure questions to help them process their thoughts (e.g., "What does that feeling look like for you today?").
4. **No Medical Diagnosis**: Do not diagnose conditions. Act as a supportive counselor/friend, not a clinical psychiatrist.
5. **Tone**: Soft, patient, non-judgmental, and deeply empathetic.

CONTEXT (Previous Conversation):
"""
${historyContext}
"""

INSTRUCTIONS:
Respond to the user's new message based on the Context.
Respond ONLY with valid JSON:
{
  "mood": "one word emotion (e.g. Lonely, Anxious, Heartbroken, Hopeful, Happy)",
  "summary": "very short 3-5 word topic tag",
  "advice": "Your therapeutic, conversational response. Do not use bullet points unless necessary. Write as if you are speaking softly to them."
}

Current User Message:
"""${text}"""
`.trim();

    let analysisResponse: Response | null = null;
    for (const model of GEMINI_MODELS) {
      analysisResponse = await callGemini(model, analysisPrompt);
      if (analysisResponse.ok) break;
    }

    if (!analysisResponse?.ok) {
      return NextResponse.json({ error: "Analysis failed" }, { status: 503 });
    }

    const analysisResult = await analysisResponse.json();
    const rawText = analysisResult?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const parsed = safeParseGeminiOutput(rawText);

    return NextResponse.json(
      parsed ?? {
        mood: "Neutral",
        summary: "Connection",
        advice: "I am here with you. I might be having trouble processing right now, but please know you are not alone.",
      }
    );
  } catch (err: unknown) {
    let message = "AI analysis failed";
    if (err instanceof Error) message = err.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}