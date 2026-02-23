import { Router, Response } from "express";
import multer from "multer";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware.js";
import { uploadFile, deleteFile, extractFileNameFromUrl } from "../services/storage.service.js";

const router = Router();
const prisma = new PrismaClient();

// Configure multer for memory storage (5MB limit, images only)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    // Accept only image files
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
    }
  },
});

// POST /api/user/avatar - Upload user avatar
router.post("/avatar", authMiddleware, upload.single("avatar"), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    // Get user's current avatar URL
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Delete old avatar from R2 if it exists
    if (user.avatarUrl) {
      const oldFileName = extractFileNameFromUrl(user.avatarUrl);
      if (oldFileName) {
        await deleteFile(oldFileName);
      }
    }

    // Generate unique filename: avatars/{userId}-{timestamp}.{ext}
    const timestamp = Date.now();
    const extension = req.file.mimetype.split("/")[1]; // jpeg, png, webp
    const fileName = `avatars/${userId}-${timestamp}.${extension}`;

    // Upload to R2
    const avatarUrl = await uploadFile(req.file.buffer, fileName, req.file.mimetype);

    // Update user's avatarUrl in database
    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    console.log(`✅ Avatar updated for user ${userId}: ${avatarUrl}`);

    return res.json({
      success: true,
      avatarUrl,
    });
  } catch (error) {
    console.error("❌ Avatar upload error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload avatar",
    });
  }
});

// PATCH /api/user/profile - Update user profile (name)
router.patch("/profile", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { name } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ success: false, error: "Valid name is required" });
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
      },
    });

    console.log(`✅ Profile updated for user ${userId}`);

    return res.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("❌ Profile update error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update profile",
    });
  }
});

// DELETE /api/user/account - Delete user account
router.delete("/account", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    // Get user's avatar URL before deletion
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    // Delete avatar from R2 if it exists
    if (user?.avatarUrl) {
      const fileName = extractFileNameFromUrl(user.avatarUrl);
      if (fileName) {
        await deleteFile(fileName);
      }
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    console.log(`✅ User account deleted: ${userId}`);

    // Clear cookie
    res.clearCookie("token");

    return res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("❌ Account deletion error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to delete account",
    });
  }
});

export default router;
