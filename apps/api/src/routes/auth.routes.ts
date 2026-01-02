import { Router, Response } from "express";
import { registerUser, loginUser, googleOAuthUser } from "../services/auth.service.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware.js";

const router = Router();

// REGISTER
router.post("/auth/register", async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password required" });
    }

    const result = await registerUser(email, password, name);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Set HTTP-only cookie
    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(201).json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Registration failed" });
  }
});

// LOGIN
router.post("/auth/login", async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password required" });
    }

    const result = await loginUser(email, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    // Set HTTP-only cookie
    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Login failed" });
  }
});

// GOOGLE OAuth CALLBACK
router.post("/auth/google", async (req: AuthRequest, res: Response) => {
  try {
    const { id, email, name, picture } = req.body;

    if (!id || !email) {
      return res.status(400).json({ success: false, error: "Invalid Google OAuth payload" });
    }

    const result = await googleOAuthUser({ id, email, name, picture });

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Set HTTP-only cookie
    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Google OAuth failed" });
  }
});

// GET CURRENT USER
router.get("/auth/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    return res.json({
      success: true,
      user: {
        id: req.user?.userId,
        email: req.user?.email,
        organizations: req.user?.organizations,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to fetch user" });
  }
});

// LOGOUT
router.post("/auth/logout", (req: AuthRequest, res: Response) => {
  res.clearCookie("token");
  return res.json({ success: true });
});

export default router;
