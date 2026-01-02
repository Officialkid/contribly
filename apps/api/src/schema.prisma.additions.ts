// Prisma schema additions for OTP, withdrawal security, and audit logging
// Add to packages/database/prisma/schema.prisma

/*
// ============================================================================
// OTP & 2FA
// ============================================================================

model WithdrawalOTP {
  id            String   @id @default(cuid())
  withdrawalId  String
  userId        String
  code          String
  expiresAt     DateTime
  isUsed        Boolean  @default(false)
  usedAt        DateTime?
  
  createdAt     DateTime @default(now())
  
  withdrawal    Withdrawal @relation(fields: [withdrawalId], references: [id], onDelete: Cascade)
  user          User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([withdrawalId, userId])
  @@index([userId])
  @@index([code])
  @@index([expiresAt])
}

// ============================================================================
// CHIEF ADMIN PIN
// ============================================================================

model ChiefAdminPIN {
  id              String   @id @default(cuid())
  userId          String
  organizationId  String
  pinHash         String   // Never store plain text
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@unique([userId, organizationId])
  @@index([organizationId])
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

model AuditLog {
  id              String   @id @default(cuid())
  organizationId  String
  userId          String
  action          String   // WITHDRAWAL_REQUESTED, WITHDRAWAL_APPROVED, OTP_VERIFIED, etc.
  resourceType    String   // "withdrawal", "payment", "account", etc.
  resourceId      String
  details         String?  // JSON string of additional details
  
  createdAt       DateTime @default(now())
  
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([organizationId])
  @@index([userId])
  @@index([action])
  @@index([createdAt])
}

// ============================================================================
// UPDATE WITHDRAWAL MODEL
// ============================================================================

// Modify existing Withdrawal model:

model Withdrawal {
  id                String   @id @default(cuid())
  departmentId      String
  creatorId         String
  
  amount            Decimal
  reason            String
  status            WithdrawalStatus @default(PENDING_APPROVAL)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  department        Department @relation(fields: [departmentId], references: [id], onDelete: Cascade)
  creator           User     @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  otps              WithdrawalOTP[]

  @@index([departmentId])
  @@index([creatorId])
  @@index([status])
  @@index([createdAt])
}

enum WithdrawalStatus {
  PENDING_APPROVAL
  APPROVED
  PENDING_OTP
  COMPLETED
  REJECTED
}

// ============================================================================
// UPDATE USER MODEL
// ============================================================================

// Add to User model:

model User {
  // ... existing fields ...
  
  withdrawalOTPs    WithdrawalOTP[]
  chiefAdminPIN     ChiefAdminPIN?
  auditLogs         AuditLog[]
}

// ============================================================================
// UPDATE ORGANIZATION MODEL
// ============================================================================

// Add to Organization model:

model Organization {
  // ... existing fields ...
  
  chiefAdminPINs    ChiefAdminPIN[]
  auditLogs         AuditLog[]
}
*/
