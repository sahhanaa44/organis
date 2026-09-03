import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { askAssistant } from "../services/assistantService.js";

const router = Router();
router.use(requireAuth);

/**
 * POST /api/assistant/ask
 * body: { question: string, history?: [{role, content}] }
 * The Anthropic API key (if any) lives only in this server's environment —
 * it is never sent to or accessible from the React client.
 */
router.post("/ask", async (req, res) => {
  const { question, history } = req.body;
  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "question is required" });
  }

  const { answer, mode } = await askAssistant(question, Array.isArray(history) ? history : []);
  res.json({ answer, mode });
});

export default router;
