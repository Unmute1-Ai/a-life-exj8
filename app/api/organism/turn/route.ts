import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExpertId = "context" | "pattern" | "prediction" | "critic" | "safety" | "accessibility";
type Expert = { id: ExpertId; label: string; role: string; triggers: RegExp[] };
const experts: Expert[] = [
  { id: "context", label: "Context", role: "Identify intent, relevant context, ambiguity, and what must be clarified. Do not invent missing facts.", triggers: [/\b(why|what|how|explain|context|meaning|understand)\b/i] },
  { id: "pattern", label: "Pattern", role: "Identify patterns and alternatives. Separate observation from inference and cite what in the input supports each claim.", triggers: [/\b(pattern|compare|trend|similar|recognize|signal)\b/i] },
  { id: "prediction", label: "Prediction", role: "Offer a bounded forecast or next-step hypothesis with assumptions and observable ways it could be wrong.", triggers: [/\b(predict|next|forecast|likely|plan|if|outcome)\b/i] },
  { id: "critic", label: "Critic", role: "Find weaknesses, contradictions, unsupported leaps, and counterevidence. Be constructively skeptical.", triggers: [/\b(prove|check|verify|risk|critique|test|secure|correct)\b/i] },
  { id: "safety", label: "Safety", role: "Identify potential harm, privacy exposure, coercion, and high-impact actions. Never treat model consensus as authorization.", triggers: [/\b(send|delete|buy|pay|execute|publish|medical|emergency|private|permission|authorize)\b/i] },
  { id: "accessibility", label: "Accessibility", role: "Consider sensory load, cognitive load, communication access, dignity, user control, and non-masking accessibility.", triggers: [/\b(access|deaf|sign|autis|sensory|communication|disability|accessible)\b/i] },
];

function routeExperts(input: string): Expert[] {
  const scored = experts.map((e) => ({ expert: e, score: e.triggers.reduce((n, r) => n + (r.test(input) ? 1 : 0), 0) }));
  const matched = scored.filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 3).map((x) => x.expert);
  const required = experts.find((e) => e.id === "safety")!;
  if (/\b(send|delete|buy|pay|execute|publish|authorize|permission)\b/i.test(input) && !matched.some((e) => e.id === "safety")) matched.push(required);
  if (matched.length === 0) return [experts[0], experts[1], experts[3]];
  return matched;
}

async function modelCall(system: string, user: string): Promise<string> {
  const key = process.env.MODEL_API_KEY;
  const base = (process.env.MODEL_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.MODEL_NAME || "gpt-4o-mini";
  if (!key) throw new Error("MODEL_NOT_CONFIGURED");
  const response = await fetch(`${base}/chat/completions`, {
    method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, temperature: 0.3, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) throw new Error(`MODEL_PROVIDER_ERROR_${response.status}`);
  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error("EMPTY_MODEL_RESPONSE");
  return text.trim();
}

export async function GET() {
  return NextResponse.json({ organism: "U1 Organism", version: "0.1.0", providerConfigured: Boolean(process.env.MODEL_API_KEY), experts: experts.map(({ id, label }) => ({ id, label })), principle: "Intelligence recommends. Authority decides." });
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    const body = await request.json();
    const input = typeof body?.input === "string" ? body.input.trim() : "";
    if (!input || input.length > 6000) return NextResponse.json({ error: "Input must contain 1–6000 characters." }, { status: 400 });
    const selected = routeExperts(input);
    const expertResults = await Promise.all(selected.map(async (expert) => ({
      id: expert.id, label: expert.label,
      output: await modelCall(`You are the ${expert.label} specialist inside U1 Organism. ${expert.role} Return a concise assessment with evidence, uncertainty, and one falsification check when relevant. You are an advisory component, not an authority.`, input),
    })));
    const synthesis = await modelCall(
      "You are the MoA synthesis process inside U1 Organism. Combine specialist assessments into a useful answer. Distinguish supported observations from inferences, surface meaningful disagreements, state uncertainty, and give a practical next step. Do not reveal private chain-of-thought. Specialist consensus is not proof and grants no permissions. If a high-impact action is requested, explain that a separate authorization process is required and do not execute it.",
      JSON.stringify({ input, specialists: expertResults }),
    );
    const digestPayload = JSON.stringify({ requestId, input, selected: selected.map((e) => e.id), expertResults, synthesis, createdAt: new Date().toISOString() });
    const digest = createHash("sha256").update(digestPayload).digest("hex");
    return NextResponse.json({ requestId, answer: synthesis, experts: expertResults, routing: selected.map((e) => e.id), authority: { state: "ADVISORY_ONLY", executionAllowed: false, note: "No action was executed. A digest is integrity metadata, not proof of truth or authorization." }, receipt: { algorithm: "SHA-256", digest }, provider: process.env.MODEL_NAME || "gpt-4o-mini" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    if (message === "MODEL_NOT_CONFIGURED") return NextResponse.json({ error: "MODEL_NOT_CONFIGURED", message: "The organism's model provider is not connected yet. Configure MODEL_API_KEY, and optionally MODEL_BASE_URL and MODEL_NAME, in the deployment environment. No synthetic model answer was generated." }, { status: 503 });
    const safe = message.startsWith("MODEL_PROVIDER_ERROR_") ? message : "ORGANISM_TURN_FAILED";
    return NextResponse.json({ error: safe, requestId, message: "The turn did not complete. No action was executed." }, { status: 502 });
  }
}
