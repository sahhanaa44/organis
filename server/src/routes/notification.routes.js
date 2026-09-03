import { Router } from "express";
import Notification from "../models/Notification.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

/** GET /api/notifications */
router.get("/", async (req, res) => {
  const notifications = await Notification.find({ recipientUser: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30);
  const unreadCount = await Notification.countDocuments({ recipientUser: req.user._id, isRead: false });
  res.json({ notifications, unreadCount });
});

/** POST /api/notifications/:id/read */
router.post("/:id/read", async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipientUser: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) return res.status(404).json({ error: "Notification not found" });
  res.json({ notification });
});

/** POST /api/notifications/read-all */
router.post("/read-all", async (req, res) => {
  await Notification.updateMany({ recipientUser: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true });
});

export default router;
