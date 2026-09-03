import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import User, { ROLES } from "../models/User.js";
import Donor from "../models/Donor.js";
import Recipient from "../models/Recipient.js";
import { signAppToken, requireAuth } from "../middleware/auth.js";
import { recordAudit } from "../utils/audit.js";

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * POST /api/auth/google
 * body: { credential: <Google ID token from the client-side Google Sign-In button> }
 * Creates the user on first login (role defaults to "recipient" until they
 * complete onboarding, unless a role hint is supplied for demo purposes).
 */
router.post("/google", async (req, res) => {
  const { credential, roleHint } = req.body;
  if (!credential) {
    return res.status(400).json({ error: "Missing Google credential" });
  }
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(501).json({
      error: "Google OAuth is not configured on this server. Set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in .env.",
    });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      user = await User.findOne({ email: payload.email });
    }

    if (!user) {
      const role = ROLES.includes(roleHint) ? roleHint : "recipient";
      user = await User.create({
        name: payload.name,
        email: payload.email,
        googleId: payload.sub,
        avatarUrl: payload.picture,
        role,
      });
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      user.avatarUrl = user.avatarUrl || payload.picture;
      await user.save();
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signAppToken(user);
    await recordAudit({ actor: user, action: "auth.login.google", entityType: "User", entityId: user._id, req });
    res.json({ token, user: user.toSafeJSON() });
  } catch (err) {
    console.error("[auth] google verification failed:", err.message);
    res.status(401).json({ error: "Google authentication failed" });
  }
});

/**
 * POST /api/auth/register
 * Email/password fallback so the app is fully usable without Google OAuth
 * credentials configured (useful for local demo/grading).
 */
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email and password are required" });
  }
  if (!ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${ROLES.join(", ")}` });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const user = new User({ name, email: email.toLowerCase(), role });
  await user.setPassword(password);
  await user.save();

  const token = signAppToken(user);
  await recordAudit({ actor: user, action: "auth.register", entityType: "User", entityId: user._id, req });
  res.status(201).json({ token, user: user.toSafeJSON() });
});

/**
 * POST /api/auth/login
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signAppToken(user);
  await recordAudit({ actor: user, action: "auth.login.password", entityType: "User", entityId: user._id, req });
  res.json({ token, user: user.toSafeJSON() });
});

/** GET /api/auth/me */
router.get("/me", requireAuth, async (req, res) => {
  let profile = null;
  if (req.user.role === "donor") {
    profile = await Donor.findOne({ user: req.user._id });
  } else if (req.user.role === "recipient") {
    profile = await Recipient.findOne({ user: req.user._id }).populate("hospital", "name city state");
  }
  res.json({ user: req.user.toSafeJSON(), profile });
});

export default router;
