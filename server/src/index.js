import "dotenv/config";
import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { connectDB } from "./config/db.js";
import { checkAIServiceHealth } from "./services/aiService.js";

import authRoutes from "./routes/auth.routes.js";
import donorRoutes from "./routes/donor.routes.js";
import recipientRoutes from "./routes/recipient.routes.js";
import hospitalRoutes from "./routes/hospital.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import organRoutes from "./routes/organ.routes.js";
import matchRoutes from "./routes/match.routes.js";
import allocationRoutes from "./routes/allocation.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import assistantRoutes from "./routes/assistant.routes.js";

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(helmet());
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/api/health", async (req, res) => {
  const ai = await checkAIServiceHealth();
  res.json({ status: "ok", aiService: ai });
});

app.use("/api/auth", authRoutes);
app.use("/api/donor", donorRoutes);
app.use("/api/recipient", recipientRoutes);
app.use("/api/hospital", hospitalRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/organs", organRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/allocations", allocationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/assistant", assistantRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
});

// Centralized error handler (catches errors from express-async-errors too)
app.use((err, req, res, next) => {
  console.error("[error]", err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[server] Organis API listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("[server] failed to start:", err);
  process.exit(1);
});

export default app;
