import { Router, Response } from "express";
import { setChiefAdminPIN, hasPINSet } from "../services/pin.service";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { organizationContextMiddleware, requireChiefAdmin } from "../middleware/context.middleware";
import { getUserContext } from "../utils/context";

const router = Router();

// SET CHIEF ADMIN PIN
router.post(
  "/security/pin",
  authMiddleware,
  organizationContextMiddleware,
  requireChiefAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const context = getUserContext(req);
      if (!context) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const { pin } = req.body;

      if (!pin) {
        return res.status(400).json({ success: false, error: "PIN is required" });
      }

      const result = await setChiefAdminPIN(context.userId, context.organizationId, pin);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json({ success: true, message: "PIN set successfully" });
    } catch (error) {
      return res.status(500).json({ success: false, error: String(error) });
    }
  }
);

// CHECK IF PIN IS SET
router.get(
  "/security/pin/status",
  authMiddleware,
  organizationContextMiddleware,
  requireChiefAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const context = getUserContext(req);
      if (!context) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const isSet = await hasPINSet(context.userId, context.organizationId);

      return res.json({ success: true, pinSet: isSet });
    } catch (error) {
      return res.status(500).json({ success: false, error: String(error) });
    }
  }
);

export default router;
