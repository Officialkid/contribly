#!/usr/bin/env tsx
/**
 * One-time migration script to move profile pictures from Base64 database storage
 * to Cloudflare R2 object storage.
 * 
 * Usage: tsx scripts/migrate-avatars.ts
 * 
 * Prerequisites:
 * - Environment variables configured (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL)
 * - Database connection available
 * - AWS SDK and required dependencies installed
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { uploadFile } from "../apps/api/src/services/storage.service.js";

const prisma = new PrismaClient();

interface UserWithAvatar {
  id: string;
  email: string;
  name: string | null;
  profilePicture?: string; // Base64 field (if it exists in your schema)
}

/**
 * Convert Base64 string to Buffer
 */
function base64ToBuffer(base64String: string): { buffer: Buffer; mimeType: string } {
  // Remove data URL prefix if present (e.g., "data:image/png;base64,")
  const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  
  if (matches && matches.length === 3) {
    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");
    return { buffer, mimeType };
  }
  
  // If no data URL prefix, assume it's just base64 (default to JPEG)
  const buffer = Buffer.from(base64String, "base64");
  return { buffer, mimeType: "image/jpeg" };
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[mimeType] || "jpg";
}

async function migrateAvatars() {
  console.log("🚀 Starting avatar migration from Base64 to Cloudflare R2...\n");

  // Check environment variables
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME || !process.env.R2_PUBLIC_URL) {
    console.error("❌ Missing required R2 environment variables!");
    console.error("   Required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL");
    process.exit(1);
  }

  try {
    // IMPORTANT: Adjust this query based on your actual schema
    // If you have a `profilePicture` field with Base64 data, uncomment and use this:
    /*
    const usersWithAvatars = await prisma.user.findMany({
      where: {
        profilePicture: { not: null },
      },
      select: {
        id: true,
        email: true,
        name: true,
        profilePicture: true,
      },
    });
    */

    // If you don't have a Base64 field yet, this is a no-op (safe to run)
    const usersWithAvatars: UserWithAvatar[] = [];

    console.log(`📊 Found ${usersWithAvatars.length} users with Base64 avatars\n`);

    if (usersWithAvatars.length === 0) {
      console.log("✅ No avatars to migrate. Migration complete!");
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const user of usersWithAvatars) {
      try {
        console.log(`Processing user: ${user.email} (${user.id})`);

        // Skip if no profile picture
        if (!user.profilePicture) {
          console.log("  ⏭️  No profile picture, skipping");
          continue;
        }

        // Convert Base64 to Buffer
        const { buffer, mimeType } = base64ToBuffer(user.profilePicture);
        const extension = getExtensionFromMimeType(mimeType);

        console.log(`  📤 Uploading ${(buffer.length / 1024).toFixed(2)} KB as ${mimeType}`);

        // Generate filename
        const timestamp = Date.now();
        const fileName = `avatars/${user.id}-${timestamp}.${extension}`;

        // Upload to R2
        const avatarUrl = await uploadFile(buffer, fileName, mimeType);

        // Update user record
        await prisma.user.update({
          where: { id: user.id },
          data: {
            avatarUrl: avatarUrl,
            // Optionally clear the old Base64 field:
            // profilePicture: null,
          },
        });

        console.log(`  ✅ Successfully migrated to: ${avatarUrl}`);
        successCount++;

      } catch (error) {
        console.error(`  ❌ Failed to migrate avatar for ${user.email}:`, error);
        errorCount++;
      }

      console.log(""); // Empty line for readability
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Migration Summary:");
    console.log(`   Total users processed: ${usersWithAvatars.length}`);
    console.log(`   ✅ Successful migrations: ${successCount}`);
    console.log(`   ❌ Failed migrations: ${errorCount}`);
    console.log("=".repeat(60));

    if (errorCount === 0) {
      console.log("\n🎉 Migration completed successfully!");
    } else {
      console.log("\n⚠️  Migration completed with some errors. Review the logs above.");
    }

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateAvatars().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
