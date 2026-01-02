import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { generateToken } from "../utils/jwt.js";

const prisma = new PrismaClient();

export interface AuthPayload {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
  error?: string;
}

export interface GoogleOAuthPayload {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

// REGISTER - Email + Password
export async function registerUser(
  email: string,
  password: string,
  name?: string
): Promise<AuthPayload> {
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.passwordHash) {
      return { success: false, error: "Email already registered with password" };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        authProvider: "email",
        name: name || undefined,
      },
      create: {
        email,
        passwordHash,
        name,
        authProvider: "email",
      },
    });

    const token = generateToken(user.id, user.email);

    return {
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name },
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// LOGIN - Email + Password
export async function loginUser(email: string, password: string): Promise<AuthPayload> {
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      return { success: false, error: "Invalid email or password" };
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return { success: false, error: "Invalid email or password" };
    }

    const token = generateToken(user.id, user.email);

    return {
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name },
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// GOOGLE OAuth - Login or Register
export async function googleOAuthUser(payload: GoogleOAuthPayload): Promise<AuthPayload> {
  try {
    let user = await prisma.user.findUnique({ where: { email: payload.email } });

    if (user) {
      // Link Google to existing account if not already linked
      if (user.authProvider !== "google") {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            authProvider: "google",
            providerUserId: payload.id,
            name: user.name || payload.name,
          },
        });
      }
    } else {
      // Create new user with Google OAuth
      user = await prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name,
          authProvider: "google",
          providerUserId: payload.id,
          passwordHash: null,
        },
      });
    }

    const token = generateToken(user.id, user.email);

    return {
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name },
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// GET USER BY ID
export async function getUserById(userId: string) {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        organizationMembers: {
          select: {
            organizationId: true,
            role: true,
            organization: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  } catch {
    return null;
  }
}
