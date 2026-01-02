import { PrismaClient } from "@prisma/client";
import { hashPIN, verifyPIN, validatePIN } from "../utils/pin";

const prisma = new PrismaClient();

export interface PINResponse {
  success: boolean;
  error?: string;
}

// SET CHIEF ADMIN PIN
export async function setChiefAdminPIN(
  userId: string,
  organizationId: string,
  pin: string
): Promise<PINResponse> {
  try {
    const validation = validatePIN(pin);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Verify user is Chief Admin in this organization
    const member = await prisma.organizationMember.findFirst({
      where: {
        userId,
        organizationId,
        role: "CHIEF_ADMIN",
      },
    });

    if (!member) {
      return { success: false, error: "User must be Chief Admin to set PIN" };
    }

    const pinHash = await hashPIN(pin);

    await prisma.chiefAdminPIN.upsert({
      where: { userId_organizationId: { userId, organizationId } },
      create: {
        userId,
        organizationId,
        pinHash,
      },
      update: {
        pinHash,
        updatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// VERIFY CHIEF ADMIN PIN
export async function verifyChiefAdminPIN(
  userId: string,
  organizationId: string,
  pin: string
): Promise<PINResponse> {
  try {
    const pinRecord = await prisma.chiefAdminPIN.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    });

    if (!pinRecord) {
      return { success: false, error: "PIN not set for this user/organization" };
    }

    const isValid = await verifyPIN(pin, pinRecord.pinHash);
    if (!isValid) {
      return { success: false, error: "Invalid PIN" };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// CHECK IF PIN IS SET
export async function hasPINSet(userId: string, organizationId: string): Promise<boolean> {
  try {
    const pinRecord = await prisma.chiefAdminPIN.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    });

    return !!pinRecord;
  } catch {
    return false;
  }
}
