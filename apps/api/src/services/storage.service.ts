import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Initialize S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "";
const PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

/**
 * Upload a file to Cloudflare R2
 * @param fileBuffer - The file buffer to upload
 * @param fileName - The file name/key (e.g., "avatars/user123-1234567890.jpg")
 * @param mimeType - The MIME type of the file (e.g., "image/jpeg")
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: mimeType,
      // Make the file publicly accessible
      ACL: "public-read",
    });

    await s3Client.send(command);

    // Construct and return the public URL
    const publicUrl = `${PUBLIC_URL}/${fileName}`;
    console.log(`✅ File uploaded successfully: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error("❌ Error uploading file to R2:", error);
    throw new Error("Failed to upload file to storage");
  }
}

/**
 * Delete a file from Cloudflare R2
 * @param fileName - The file name/key to delete (e.g., "avatars/user123-1234567890.jpg")
 */
export async function deleteFile(fileName: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    await s3Client.send(command);
    console.log(`✅ File deleted successfully: ${fileName}`);
  } catch (error) {
    console.error("❌ Error deleting file from R2:", error);
    // Don't throw error - deletion failure shouldn't block the upload
    console.warn("⚠️ Continuing despite deletion failure");
  }
}

/**
 * Extract the file name from a full R2 URL
 * @param url - The full public URL (e.g., "https://pub-xxx.r2.dev/avatars/user123.jpg")
 * @returns The file name/key (e.g., "avatars/user123.jpg") or null if invalid
 */
export function extractFileNameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Remove leading slash
    return urlObj.pathname.substring(1);
  } catch {
    return null;
  }
}
