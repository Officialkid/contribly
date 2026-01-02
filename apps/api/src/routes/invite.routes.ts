import { Router, Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { acceptInvite } from "../services/invite.service.js";

const router = Router();

// Accept invite (supports existing auth token or new user registration)
const acceptInviteSchema = z.object({
  code: z.string().min(1, "Invite code is required"),
  email: z.string().email().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  name: z.string().min(1, "Name is required").optional(),
});

router.post("/invites/accept", async (req: AuthRequest, res: Response) => {
  const parsed = acceptInviteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || "Invalid payload" });
  }

  const { code, email, password, name } = parsed.data;
  const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");

  const result = await acceptInvite({ code, token, email, password, name });

  if (!result.success) {
    return res.status(400).json(result);
  }

  if (result.token) {
    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  return res.json(result);
});

export default router;
