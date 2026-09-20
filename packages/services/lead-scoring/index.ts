import db, { eq, asc } from "@repo/database";
import { responseAnswersTable, responsesTable, formFieldsTable } from "@repo/database/schema";
import { invalidateKeys, CacheKeys } from "../redis";

export interface LeadScoreResult {
  score: number;
  intent: "high" | "warm" | "low";
  reason: string;
}

const SYSTEM_PROMPT = `You are an expert sales and lead intelligence AI analyzing form submissions.
Your goal is to accurately score the quality and intent of this lead from 1 to 100 and explain why.

Evaluation Criteria:
1. Intent & Urgency (High Weight): Urgent requirement, immediate timeline, clear pain point, ready to buy.
2. Budget & Scope: Stated budget, company size, scale, enterprise/business requirement.
3. Authority & Seriousness: Coherent, professional responses, specific details vs spam, gibberish, or test submissions.

Scoring Rules:
- Score 70 to 100: "high" intent (Strong buying signals, clear budget, urgency, ideal customer profile).
- Score 40 to 69: "warm" intent (Moderate interest, researching, reasonable fit, early stage).
- Score 1 to 39: "low" intent (Casual browser, student, test data, spam, zero budget/urgency, single-word junk).

Output Format:
You MUST respond ONLY with a raw JSON object (no markdown, no code fences):
{
  "score": <number between 1 and 100>,
  "intent": "high" | "warm" | "low",
  "reason": "<one crisp, professional sentence in English explaining why this lead received this score>"
}`;

function extractJsonPayload(text: string): string {
  const trimmed = text.trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}

function parseLeadScoringJson(rawJson: string): LeadScoreResult | null {
  try {
    const parsed = JSON.parse(rawJson) as { score?: number; reason?: string };
    if (typeof parsed.score !== "number" || Number.isNaN(parsed.score)) {
      return null;
    }

    const score = Math.max(1, Math.min(100, Math.round(parsed.score)));

    let intent: "high" | "warm" | "low" = "low";
    if (score >= 70) {
      intent = "high";
    } else if (score >= 40) {
      intent = "warm";
    }

    let defaultReason = "Low purchase intent or insufficient engagement.";
    if (intent === "high") {
      defaultReason = "High commercial intent and strong engagement detected.";
    } else if (intent === "warm") {
      defaultReason = "Moderate interest with potential opportunity.";
    }

    const reason = parsed.reason?.trim() || defaultReason;
    return { score, intent, reason };
  } catch {
    return null;
  }
}

async function executeChatCompletion(
  url: string,
  headers: Record<string, string>,
  body: Record<string, unknown>,
): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

async function callOpenRouter(prompt: string, apiKey: string): Promise<LeadScoreResult | null> {
  const models = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemini-2.0-flash-exp:free",
    "openai/gpt-4o-mini",
  ];

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://my-form.mrmadhukar.in",
    "X-Title": "My-Form Lead Scorer",
  };

  for (const model of models) {
    const content = await executeChatCompletion(
      "https://openrouter.ai/api/v1/chat/completions",
      headers,
      {
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 200,
      },
    );

    if (!content) continue;
    const result = parseLeadScoringJson(extractJsonPayload(content));
    if (result) return result;
  }

  return null;
}

async function callGroq(prompt: string, apiKey: string): Promise<LeadScoreResult | null> {
  const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  for (const model of models) {
    const content = await executeChatCompletion(
      "https://api.groq.com/openai/v1/chat/completions",
      headers,
      {
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 200,
        response_format: { type: "json_object" },
      },
    );

    if (!content) continue;
    const result = parseLeadScoringJson(extractJsonPayload(content));
    if (result) return result;
  }

  return null;
}

function formatAnswerValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "No answer";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(formatAnswerValue).join(", ");
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "[Object]";
    }
  }
  return "";
}

export async function scoreLeadResponse(
  formId: string,
  responseId: string,
  formTitle = "Form",
): Promise<LeadScoreResult | null> {
  try {
    const answers = await db
      .select({
        value: responseAnswersTable.value,
        label: formFieldsTable.label,
        type: formFieldsTable.type,
      })
      .from(responseAnswersTable)
      .innerJoin(formFieldsTable, eq(formFieldsTable.id, responseAnswersTable.fieldId))
      .where(eq(responseAnswersTable.responseId, responseId))
      .orderBy(asc(formFieldsTable.order));

    if (answers.length === 0) {
      return null;
    }

    // Format Q&A for the model
    const answersText = answers
      .map((a) => `- ${a.label}: ${formatAnswerValue(a.value)}`)
      .join("\n");

    const prompt = `Form: "${formTitle}"\n\nSubmitted Answers:\n${answersText}\n\nEvaluate and score this lead:`;

    const openAiKey = process.env.OPENAI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    let result: LeadScoreResult | null = null;

    // 1. Try Groq first if available (fastest, 100% free, zero queue delay)
    if (groqKey) {
      result = await callGroq(prompt, groqKey);
    }

    // 2. If Groq wasn't available or failed, try OpenRouter / OpenAI
    if (!result && openAiKey) {
      result = await callOpenRouter(prompt, openAiKey);
    }

    if (!result) {
      console.warn("[LeadScoring] LLM scoring did not return a valid result for response:", responseId);
      return null;
    }

    // Fetch existing metadata to merge
    const [existing] = await db
      .select({ metadata: responsesTable.metadata })
      .from(responsesTable)
      .where(eq(responsesTable.id, responseId))
      .limit(1);

    const prev = (existing?.metadata ?? {}) as Record<string, unknown>;

    await db
      .update(responsesTable)
      .set({
        metadata: {
          ...prev,
          leadScore: result.score,
          leadIntent: result.intent,
          leadReason: result.reason,
          leadScoredAt: new Date().toISOString(),
        },
      })
      .where(eq(responsesTable.id, responseId));

    // Invalidate Redis cache so responses page and dashboard immediately see the new score
    try {
      await invalidateKeys(CacheKeys.formResponses(formId));
    } catch {
      // Cache invalidation failure is non-fatal
    }

    return result;
  } catch (error) {
    console.error("[LeadScoring] Error scoring response:", responseId, error);
    return null;
  }
}
