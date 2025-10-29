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
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 4096,
    },
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

    if (!text) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const prompt = `
You are an empathetic emotional-support AI assistant.
Analyze the following journal entry and respond ONLY with valid JSON.
Make sure the JSON is complete and the advice field contains 5–7 full, detailed points.

{
  "mood": "one- or two-word emotion like happy, anxious, hopeful, calm, etc.",
  "summary": "a short, neutral summary of the user's thoughts.",
  "advice": "a long, compassionate message with 5–7 numbered or bulleted points giving practical emotional support, mindset tips, and self-care actions."
}

Journal entry:
"""${text}"""
`.trim();

    let response: Response | null = null;
    for (const model of GEMINI_MODELS) {
      response = await callGemini(model, prompt);
      if (!response.ok) continue;
      break;
    }

    if (!response || !response.ok) {
      return NextResponse.json({ error: "All models failed" }, { status: 503 });
    }

    const resultJson = await response.json();
    const rawText =
      resultJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    const parsed = safeParseGeminiOutput(rawText);

    return NextResponse.json(
      parsed ?? {
        mood: "Neutral",
        summary: "No summary provided.",
        advice:
          "Keep journaling — self-expression brings healing and clarity.",
      }
    );
  } catch (error: unknown) {
    let message = "AI analysis failed";
    if (error instanceof Error) message = error.message;

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
