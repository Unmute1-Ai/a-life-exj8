import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SynthesisInput = {
  input?: unknown;
  mjAssessment?: unknown;
  jakeAssessment?: unknown;
};

async function callModel(system: string, payload: string): Promise<string> {
  const key = process.env.MODEL_API_KEY;
  if (!key) throw new Error("MODEL_NOT_CONFIGURED");

  const base = (process.env.MODEL_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.MODEL_NAME || "gpt-4o-mini";
  const response = await fetch(base + "/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer " + key,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: payload },
      ],
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!response.ok) throw new Error("MODEL_PROVIDER_ERROR_" + response.status);
  const data = await response.json();
  const answer = data?.choices?.[0]?.message?.content;
  if (typeof answer !== "string" || !answer.trim()) throw new Error("EMPTY_MODEL_RESPONSE");
  return answer.trim();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SynthesisInput;
    const input = typeof body.input === "string" ? body.input.trim() : "";
    const mjAssessment = typeof body.mjAssessment === "string" ? body.mjAssessment.trim() : "";
    const jakeAssessment = typeof body.jakeAssessment === "string" ? body.jakeAssessment.trim() : "";

    if (!input || input.length > 6000 || !mjAssessment || mjAssessment.length > 12000 ||
        !jakeAssessment || jakeAssessment.length > 12000) {
      return NextResponse.json(
        { error: "invalid_request", message: "Input and both specialist assessments are required within their size limits." },
        { status: 400 },
      );
    }

    const answer = await callModel(
      [
        "You are the synthesis layer of U1 Instinctive Companion.",
        "You receive the user's original request plus two independent specialist assessments.",
        "MJ is the Instinctive Intelligence system: reasoning, pattern analysis, investigation, and planning.",
        "Jake is the Primer learning and interaction system: adaptive teaching and learner-centered communication.",
        "Integrate their useful contributions into one clear response.",
        "Preserve disagreement and uncertainty. Distinguish sourced evidence from inference.",
        "Do not invent facts, learner traits, mastery, diagnoses, or outcomes.",
        "Do not erase Jake's learner-centered guidance or allow MJ to override the learner's communication preferences.",
        "Do not execute, authorize, or imply approval of actions. Intelligence recommends; authority decides.",
        "Do not expose hidden chain-of-thought. Provide concise conclusions and reasons.",
      ].join(" "),
      JSON.stringify({ input, mjAssessment, jakeAssessment }),
    );

    return NextResponse.json({
      answer,
      contributors: ["mj", "jake"],
      authority: {
        state: "ADVISORY_ONLY",
        executionAllowed: false,
        note: "Synthesis is not authorization. No action was executed.",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    if (message === "MODEL_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: message, message: "The MJ model provider is not configured. No synthetic synthesis was generated." },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "SYNTHESIS_FAILED", message: "The two specialist outputs were retained separately. No action was executed." },
      { status: 502 },
    );
  }
}
