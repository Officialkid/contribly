# R2_AVATAR_MIGRATION_GUIDE.md

# Profile Picture Migration: Base64 → Cloudflare R2

This guide documents the complete migration from storing profile pictures as Base64 strings in PostgreSQL to using Cloudflare R2 (S3-compatible object storage).

## 📋 Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Overview](#solution-overview)
3. [Prerequisites](#prerequisites)
4. [Installation Steps](#installation-steps)
5. [Configuration](#configuration)
6. [Database Migration](#database-migration)
7. [Testing](#testing)
8. [Migration Script](#migration-script)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Problem Statement

**Before:**
- Profile pictures stored as Base64 strings directly in PostgreSQL
- 10MB limit per image
- Performance impact: Large Base64 blobs slow down every query touching user records
- Scalability concern: Database bloat as user base grows

**After:**
- Profile pictures stored in Cloudflare R2 object storage
- Only URLs stored in database (~100 bytes vs ~1-10MB Base64)
- Fast, scalable CDN delivery
- Independent scaling of storage and database

---

## 🏗️ Solution Overview

### Architecture Changes

1. **Backend:**
   - New storage service (`storage.service.ts`) for R2 operations
   - New user routes (`user.routes.ts`) with avatar upload endpoint
   - Multer middleware for handling multipart file uploads
   - Prisma schema updated with `avatarUrl` field

2. **Frontend:**
   - Profile management updated to upload files directly (not Base64)
   - Real-time upload progress indicator
   - Avatar displayed from R2 URL instead of Base64 data
   - Sidebar updated to show avatar images

3. **Migration:**
   - One-time script to migrate existing Base64 avatars to R2
   - Preserves all existing profile pictures

---

## ✅ Prerequisites

1. **Cloudflare R2 Account:**
   - Sign up at [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Create an R2 bucket
   - Generate API tokens

2. **Node.js & Dependencies:**
   - Node.js 18+ installed
   - npm or pnpm package manager

3. **Database Access:**
   - PostgreSQL database with Prisma ORM
   - Ability to run migrations

---

## 📦 Installation Steps

### Step 1: Install Dependencies

Navigate to the API directory and install required packages:

```bash
cd apps/api
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer @types/multer
```

**Packages installed:**
- `@aws-sdk/client-s3` - AWS SDK S3 client (works with R2)
- `@aws-sdk/s3-request-presigner` - Generate pre-signed URLs (for future use)
- `multer` - Middleware for handling multipart/form-data file uploads
- `@types/multer` - TypeScript definitions for multer

### Step 2: Configure R2 Credentials

#### A. Create R2 Bucket

1. Go to Cloudflare Dashboard → R2
2. Click "Create bucket"
3. Name your bucket (e.g., `contribly-avatars`)
4. Choose a region (or use automatic)
5. Enable public access (for avatar URLs)

#### B. Generate API Tokens

1. Go to R2 → Manage R2 API Tokens
2. Click "Create API token"
3. Give it a name (e.g., "Contribly Avatar Upload")
4. Set permissions: **Object Read & Write**
5. Save the Access Key ID and Secret Access Key

#### C. Get Public URL

Your public R2 URL will be in this format:
```
https://pub-<random-id>.r2.dev
```

Or use a custom domain if configured.

### Step 3: Update Environment Variables

Add these to `apps/api/.env`:

```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=contribly-avatars
R2_PUBLIC_URL=https://pub-xxxxxxxxxx.r2.dev
```

**How to find Account ID:**
- Go to Cloudflare Dashboard → R2
- Your account ID is in the R2 overview page URL or sidebar

---

## 🗄️ Database Migration

### Step 4: Generate Prisma Migration

The schema has been updated to add the `avatarUrl` field. Generate and apply the migration:

```bash
cd packages/database
npx prisma migrate dev --name add_avatar_url
```

This will:
1. Create a new migration file
2. Add `avatarUrl String?` column to the User table
3. Apply the migration to your database

### Step 5: Regenerate Prisma Client

After schema changes, regenerate the Prisma client:

```bash
npx prisma generate
```

This updates the TypeScript types and resolves any compiler errors.

---

## 🚀 Testing

### Step 6: Restart the API Server

```bash
cd apps/api
npm run dev
```

Verify the server starts without errors and you see:
```
✓ User routes loaded
✓ All routes registered successfully
```

### Step 7: Test Avatar Upload

1. **Start the frontend:**
   ```bash
   cd apps/web
   npm run dev
   ```

2. **Login** and navigate to Profile Settings

3. **Upload a new avatar:**
   - Click "Upload Image" button
   - Select an image (JPG, PNG, or WebP, max 5MB)
   - Watch for upload progress indicator
   - Avatar should update immediately on success

4. **Verify in database:**
   ```sql
   SELECT id, email, "avatarUrl" FROM "User" WHERE "avatarUrl" IS NOT NULL;
   ```

5. **Check R2 bucket:**
   - Go to Cloudflare Dashboard → R2 → Your Bucket
   - You should see files in the `avatars/` folder
   - Format: `avatars/{userId}-{timestamp}.{ext}`

6. **Test avatar display:**
   - Avatar should appear in the sidebar
   - Avatar should be visible on the profile page
   - Clicking "Change Image" should work

---

## 🔄 Migration Script

### Step 8: Migrate Existing Base64 Avatars (If Applicable)

**⚠️ Important:** This script is only needed if you have existing users with Base64 profile pictures stored in the database.

If you **don't have a Base64 field** (e.g., `profilePicture`), skip this step.

#### A. Review the Script

Open `scripts/migrate-avatars.ts` and:
1. Uncomment the query section if you have a `profilePicture` field
2. Update the field name if different
3. Adjust the `UserWithAvatar` interface to match your schema

#### B. Run the Migration

```bash
cd apps/api
tsx ../scripts/migrate-avatars.ts
```

The script will:
1. Find all users with Base64 avatars
2. Convert each Base64 string to a Buffer
3. Upload to R2
4. Update `avatarUrl` in the database
5. Optionally clear the old Base64 field

**Output example:**
```
🚀 Starting avatar migration from Base64 to Cloudflare R2...

📊 Found 47 users with Base64 avatars

Processing user: john@example.com (cuid123)
  📤 Uploading 234.56 KB as image/jpeg
  ✅ Successfully migrated to: https://pub-xxx.r2.dev/avatars/cuid123-1709123456789.jpg

...

============================================================
📊 Migration Summary:
   Total users processed: 47
   ✅ Successful migrations: 47
   ❌ Failed migrations: 0
============================================================

🎉 Migration completed successfully!
```

---

## 🧪 API Endpoints

### New Endpoints

#### 1. Upload Avatar
```
POST /api/user/avatar
Authorization: JWT (HTTP-only cookie)
Content-Type: multipart/form-data

Body:
  avatar: <file> (JPEG, PNG, or WebP, max 5MB)

Response:
  {
    "success": true,
    "avatarUrl": "https://pub-xxx.r2.dev/avatars/user123-1709123456.jpg"
  }
```

#### 2. Update Profile
```
PATCH /api/user/profile
Authorization: JWT (HTTP-only cookie)
Content-Type: application/json

Body:
  {
    "name": "John Doe"
  }

Response:
  {
    "success": true,
    "user": {
      "id": "cuid123",
      "email": "john@example.com",
      "name": "John Doe",
      "avatarUrl": "https://pub-xxx.r2.dev/avatars/user123-1709123456.jpg"
    }
  }
```

#### 3. Delete Account
```
DELETE /api/user/account
Authorization: JWT (HTTP-only cookie)

Response:
  {
    "success": true,
    "message": "Account deleted successfully"
  }

Note: Automatically deletes avatar from R2 before deleting user
```

---

## 🐛 Troubleshooting

### 1. "CORS policy" error when uploading

**Cause:** R2 bucket doesn't allow CORS from your domain

**Solution:**
1. Go to R2 bucket settings
2. Add CORS policy:
   ```json
   [
     {
       "AllowedOrigins": ["http://localhost:3000", "https://yourapp.com"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

### 2. "Failed to upload file to storage" error

**Causes:**
- Invalid R2 credentials
- Bucket doesn't exist
- Insufficient permissions

**Solution:**
1. Verify `.env` variables are correct
2. Check R2 API token has Read & Write permissions
3. Verify bucket name matches exactly
4. Test R2 connection:
   ```bash
   curl -X PUT https://<account-id>.r2.cloudflarestorage.com/<bucket>/test.txt \
     -H "Authorization: Bearer <token>"
   ```

### 3. Prisma type errors

**Cause:** Prisma client not regenerated after schema change

**Solution:**
```bash
cd packages/database
npx prisma generate
```

### 4. "avatarUrl does not exist in type User"

**Cause:** Migration not applied

**Solution:**
```bash
cd packages/database
npx prisma migrate dev --name add_avatar_url
npx prisma generate
```

### 5. Upload works but image doesn't display

**Causes:**
- R2 bucket not set to public
- Incorrect R2_PUBLIC_URL
- CORS blocking image load

**Solution:**
1. Go to R2 bucket settings → Make public
2. Verify R2_PUBLIC_URL ends without trailing slash
3. Test direct URL access in browser
4. Check browser console for CORS errors

---

## 📊 Performance Comparison

### Before (Base64 in Database)

- **User query with avatar:** ~10-50ms
- **Database size (1000 users):** ~5GB (with 3MB avg avatars)
- **Query performance degradation:** Linear with avatar size

### After (R2 URLs)

- **User query with avatar:** ~2-5ms
- **Database size (1000 users):** ~100MB (just metadata)
- **Query performance:** Constant (regardless of avatar size)
- **Avatar delivery:** Blazing fast via Cloudflare CDN

---

## 🔐 Security Considerations

1. **File Type Validation:** Only JPEG, PNG, and WebP allowed
2. **File Size Limit:** 5MB maximum (configurable in multer settings)
3. **Authentication Required:** All avatar operations require valid JWT
4. **Old Avatar Cleanup:** Automatically deletes old avatar when uploading new one
5. **Account Deletion:** Removes avatar from R2 when account is deleted

---

## 🎉 Summary

You've successfully migrated from Base64 database storage to Cloudflare R2! Your application now benefits from:

- ✅ **Better performance** - Faster database queries
- ✅ **Scalability** - Independent storage scaling
- ✅ **Cost efficiency** - R2 is cheaper than database storage
- ✅ **Better UX** - Real-time uploads with progress indicators
- ✅ **CDN delivery** - Fast image loading worldwide

---

## 📝 Next Steps

1. **Monitor R2 usage** in Cloudflare Dashboard
2. **Set up custom domain** for R2 (optional but recommended)
3. **Add image optimization** (e.g., resize on upload, WebP conversion)
4. **Implement backup strategy** for R2 bucket
5. **Consider adding more file types** (GIF, SVG with sanitization)

---

## 🆘 Need Help?

- Check Cloudflare R2 docs: https://developers.cloudflare.com/r2/
- Review AWS S3 SDK docs: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/
- Inspect backend logs for detailed error messages

