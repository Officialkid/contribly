# How to Fix Migration Drift

## Problem
Prisma detected that your database has columns (MFA fields) that weren't added through migrations. This is called "drift" and happens when changes are made directly to the database.

## DO NOT RESET - You'll lose all production data!

## Solution: Create a baseline migration

### Step 1: Answer NO to the current prompt
```
Type: N
```

### Step 2: Pull current database schema into Prisma
This synchronizes your schema.prisma with the actual database:
```bash
npx prisma db pull
```

### Step 3: Review the changes
Check if any fields were overwritten in schema.prisma. You may need to manually add back the `avatarUrl` field if it gets removed.

### Step 4: Create migration for avatarUrl only
```bash
npx prisma migrate dev --name add_avatar_url --create-only
```

### Step 5: Review and apply the migration
```bash
# Check the generated migration file in prisma/migrations/
# Then apply it:
npx prisma migrate deploy
```

### Alternative: Manual migration approach

If db pull causes issues, manually create a migration:

1. Create migration directory:
```bash
mkdir -p prisma/migrations/$(date +'%Y%m%d%H%M%S')_add_avatar_url
```

2. Create migration.sql with only the new field:
```sql
-- Add avatarUrl column to User table
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
```

3. Apply it:
```bash
npx prisma migrate resolve --applied add_avatar_url
npx prisma generate
```

## Quick Command Sequence (Recommended)

```bash
# 1. Answer N to the prompt first!

# 2. Pull current schema
npx prisma db pull

# 3. Verify avatarUrl is still in schema.prisma, if not, add it back

# 4. Create migration (create-only flag to review first)
npx prisma migrate dev --name add_avatar_url --create-only

# 5. Review the generated SQL file

# 6. Apply it
npx prisma migrate deploy

# 7. Regenerate client
npx prisma generate
```
