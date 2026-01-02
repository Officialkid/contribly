import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { acceptInvite } from "../services/invite.service";

const router = Router();

// Accept invite (supports existing auth token or new user registration)
router.post("/invites/accept", async (req: AuthRequest, res: Response) => {
  const { code, email, password, name } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, error: "Invite code is required" });
  }

  const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");

  const result = await acceptInvite({ code, token, email, password, name });

  if (!result.success) {
    return res.status(400).json(result);
  }

  if (result.token) {
    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  return res.json(result);
});

export default router;
