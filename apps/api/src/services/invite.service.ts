import bcrypt from "bcrypt";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { generateToken, verifyToken } from "../utils/jwt.js";

const prisma = new PrismaClient();

async function generateUniquePaymentReference(departmentId: string): Promise<string> {
  while (true) {
    const ref = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const existing = await prisma.departmentMember.findFirst({
      where: { departmentId, paymentReference: ref },
      select: { id: true },
    });
    if (!existing) return ref;
  }
}

export async function createInviteLink(
  departmentId: string,
  createdByUserId: string,
  expiresAt?: Date | null,
  maxUses?: number | null
) {
  const code = crypto.randomUUID();
  const invite = await prisma.inviteLink.create({
    data: {
      code,
      departmentId,
      createdByUserId,
      expiresAt: expiresAt || null,
      maxUses: maxUses || null,
    },
  });

  return { success: true, invite };
}

export async function acceptInvite(params: {
  code: string;
  token?: string;
  email?: string;
  password?: string;
  name?: string;
}) {
  const { code, token, email, password, name } = params;

  const invite = await prisma.inviteLink.findUnique({
    where: { code },
    include: {
      department: {
        select: { id: true, organizationId: true },
      },
    },
  });

  if (!invite || !invite.isActive) {
    return { success: false, error: "Invalid or inactive invite" };
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return { success: false, error: "Invite expired" };
  }

  if (invite.maxUses !== null && invite.usedCount >= invite.maxUses) {
    return { success: false, error: "Invite has been fully used" };
  }

  let userId: string | null = null;
  let userEmail: string | undefined;
  let issuedToken: string | undefined;

  // If token provided, validate and use that user
  if (token) {
    const payload = verifyToken(token);
    if (!payload) {
      return { success: false, error: "Invalid token" };
    }
    userId = payload.userId;
    userEmail = payload.email;
  }

  if (!userId) {
    if (!email || !password) {
      return { success: false, error: "Email and password required for new users" };
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { success: false, error: "User already exists. Please log in and retry." };
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash,
        authProvider: "email",
      },
    });

    userId = user.id;
    userEmail = user.email;
    issuedToken = generateToken(user.id, user.email);
  }

  if (!userId || !userEmail) {
    return { success: false, error: "Unable to resolve user for invite" };
  }

  // Ensure organization membership
  await prisma.organizationMember.upsert({
    where: {
      userId_organizationId: {
        userId,
        organizationId: invite.department.organizationId,
      },
    },
    update: {},
    create: {
      userId,
      organizationId: invite.department.organizationId,
      role: "MEMBER",
    },
  });

  // Ensure department membership with unique payment reference
  const existingDeptMember = await prisma.departmentMember.findFirst({
    where: {
      userId,
      departmentId: invite.department.id,
    },
  });

  if (!existingDeptMember) {
    const paymentReference = await generateUniquePaymentReference(invite.department.id);
    await prisma.departmentMember.create({
      data: {
        userId,
        departmentId: invite.department.id,
        role: "MEMBER",
        paymentReference,
      },
    });
  }

  // Increment usage
  await prisma.inviteLink.update({
    where: { id: invite.id },
    data: {
      usedCount: invite.usedCount + 1,
      isActive: invite.maxUses !== null && invite.usedCount + 1 >= invite.maxUses ? false : invite.isActive,
    },
  });

  return {
    success: true,
    organizationId: invite.department.organizationId,
    departmentId: invite.department.id,
    token: issuedToken,
    user: { id: userId, email: userEmail, organizationId: invite.department.organizationId },
  };
}
