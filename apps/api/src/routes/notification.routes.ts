import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware.js";
import {
  listNotificationsForUser,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notification.service.js";

const router = Router();

router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const result = await listNotificationsForUser(userId);
    return res.json(result);
  } catch (error) {
    console.error("Failed to list notifications:", error);
    return res.status(500).json({ success: false, error: "Failed to load notifications" });
  }
});

router.post("/:notificationId/read", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const result = await markNotificationAsRead(req.params.notificationId, userId);
    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return res.status(500).json({ success: false, error: "Failed to update notification" });
  }
});

router.post("/read-all", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const result = await markAllNotificationsAsRead(userId);
    return res.json(result);
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return res.status(500).json({ success: false, error: "Failed to update notifications" });
  }
});

export default router;
