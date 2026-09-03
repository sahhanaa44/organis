/**
 * Organis Assistant backend logic.
 *
 * If ANTHROPIC_API_KEY is present in the server's environment, questions are
 * answered by a real Claude API call (the key never touches the client).
 * Otherwise, a deterministic local knowledge base answers common questions
 * so the assistant still works out of the box in a demo/offline setup.
 *
 * The assistant is strictly educational: it explains how the platform works
 * and never claims to make or influence a real allocation decision.
 */
import { GoogleGenAI } from "@google/genai";
const SYSTEM_PROMPT = `You are the Organis Assistant, embedded in an organ donation and allocation
platform prototype. You help donors, recipients, hospital staff and admins understand:
- how AI compatibility matching works (blood/organ/medical compatibility, urgency, waiting time, distance)
- the allocation workflow stages (eligibility check -> AI matching -> candidate ranking -> human review -> allocation pending -> approved -> transplant scheduled -> completed)
- platform policies and what statuses mean
You give general educational information only. You are not a medical professional and you never make,
influence, or imply a real clinical or allocation decision. Always defer specific medical or allocation
questions to the person's care team or hospital coordinator. Keep answers concise and plain-spoken.`;

const LOCAL_KB = [
  {
    match: /(how|what).*(matching|match).*(work|works)/i,
    answer:
      "When an organ becomes available, Organis identifies eligible recipients (correct organ type and compatible blood group) and scores each one with a transparent formula: blood compatibility, organ compatibility, medical compatibility, urgency, waiting time, distance, and tissue/size fit. Every score comes with a breakdown of exactly how it was calculated — nothing is hidden. A qualified human reviewer always makes the final call.",
  },
  {
    match: /compatib/i,
    answer:
      "Compatibility combines several factors: ABO/Rh blood group compatibility, whether the organ type matches what the recipient needs, medical risk factors, tissue markers (HLA), body size fit, urgency, waiting time, and geographic distance. Each factor is weighted and shown separately so hospital staff can see exactly why a candidate ranked where they did.",
  },
  {
    match: /(allocation|workflow|process|stages?)/i,
    answer:
      "The allocation workflow has clear stages: Eligibility Check → AI-Assisted Matching → Candidate Ranking → Human Review → Allocation Pending → Approved → Transplant Scheduled → Completed. Every stage transition is logged in an audit trail. The AI never allocates an organ on its own — a licensed reviewer must approve every step.",
  },
  {
    match: /(urgency)/i,
    answer:
      "Urgency reflects clinical severity as recorded by the recipient's care team (low, medium, high, critical). It's one of several inputs into the compatibility score, not an automatic override — a highly urgent but clinically incompatible match is never recommended.",
  },
  {
    match: /(waitlist|waiting list|wait time)/i,
    answer:
      "Recipients move through: Registration → Medical Review → Waiting List → Potential Match → Human Review → Allocation. Waiting time is one of several scoring factors, so it matters, but it doesn't guarantee priority — compatibility and urgency matter too.",
  },
  {
    match: /(privacy|data|security)/i,
    answer:
      "Organis uses role-based access control, JWT-authenticated sessions, and Google OAuth for sign-in. Medical data is only visible to the relevant care team, hospital, and platform administrators. All sensitive actions are recorded in an audit log.",
  },
  {
    match: /(who (decides|approves)|final decision|does ai decide)/i,
    answer:
      "The AI never makes a final decision. It produces a ranked, explainable shortlist for the hospital coordination team. A qualified clinical or authorized allocation reviewer must approve every allocation before it proceeds.",
  },
];

const FALLBACK_ANSWER =
  "I can help explain how compatibility scoring, the allocation workflow, or waitlist stages work on Organis. Could you rephrase your question, focusing on one of those areas? For anything about your specific medical case, please contact your care team or hospital coordinator directly.";

function localAnswer(question) {
  const hit = LOCAL_KB.find((entry) => entry.match.test(question));
  return hit ? hit.answer : FALLBACK_ANSWER;
}

export async function askAssistant(question, history = []) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { answer: localAnswer(question), mode: "local_demo" };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const conversation = [
      SYSTEM_PROMPT,
      ...history.map((h) => `${h.role}: ${h.content}`),
      `user: ${question}`,
    ].join("\n\n");

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: conversation,
    });

    return {
      answer: response.text?.trim() || FALLBACK_ANSWER,
      mode: "llm",
    };
  } catch (err) {
    console.error("[assistant] Gemini call failed:", err.message);

    return {
      answer: localAnswer(question),
      mode: "local_demo_fallback",
    };
  }
}