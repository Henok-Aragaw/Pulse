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
    generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
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

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

    // Step 1: Context check
    const contextPrompt = `
You are an AI that strictly validates journal entries. Only respond true if input expresses emotions, thoughts, or reflections in a way that can be understood.
If the input is gibberish, random letters, numbers only, non-English, or unclear, respond ONLY with:
{
  "isValid": false,
  "message": "I don't understand what you mean. Could you reflect and share your thoughts or feelings in a few sentences?"
}
If valid, respond ONLY with:
{
  "isValid": true
}
Input:
"""${text}"""
Respond with ONLY JSON.
`.trim();

    let contextResponse: Response | null = null;
    for (const model of GEMINI_MODELS) {
      contextResponse = await callGemini(model, contextPrompt);
      if (contextResponse.ok) break;
    }

    if (!contextResponse?.ok) {
      return NextResponse.json({ error: "Context check failed" }, { status: 503 });
    }

    const contextResult = await contextResponse.json();
    const contextRaw = contextResult?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const contextParsed = safeParseGeminiOutput(contextRaw);

    // ⚠ Stop completely if invalid or parsing fails
    if (!contextParsed?.isValid) {
      return NextResponse.json({
        mood: null,
        summary: null,
        advice: contextParsed?.message ?? "I don't understand what you mean. Could you share your feelings in a few sentences?",
      });
    }

    // Step 2: Only valid input → analysis
    const analysisPrompt = `
You are an empathetic emotional-support AI assistant.
Analyze the following journal entry and respond ONLY with valid JSON:
Make sure the JSON is complete and the advice field contains 5–7 full, detailed points.
{
  "mood": "one- or two-word emotion like happy, anxious, hopeful, calm, etc.",
  "summary": "a short, neutral summary of the user's thoughts.",
  "advice": "a long, compassionate message with 5–7 numbered or bulleted points giving practical emotional support, mindset tips, and self-care actions."
}
Journal entry:
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
        summary: "No summary provided.",
        advice: "Keep journaling — self-expression brings healing and clarity.",
      }
    );
  } catch (err: unknown) {
    let message = "AI analysis failed";
    if (err instanceof Error) message = err.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
