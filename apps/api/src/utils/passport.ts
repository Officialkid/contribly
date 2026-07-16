import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import passport from "passport";
import { Profile, Strategy as GoogleStrategy, VerifyCallback } from "passport-google-oauth20";
import { generateToken } from "./jwt.js";

const prisma = new PrismaClient();
export const isGoogleOAuthConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

if (isGoogleOAuthConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
      },
      async (_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) => {
        try {
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName;
          const googleId = profile.id;

          if (!email) {
            return done(null, false, { message: "no_email_in_profile" });
          }

          let user = await prisma.user.findUnique({
            where: { email },
            include: {
              organizationMembers: {
                select: {
                  organizationId: true,
                  role: true,
                },
                take: 1,
              },
            },
          });

          let organizationId: string | undefined;

          if (user) {
            if (!user.providerUserId || user.authProvider !== "google") {
              user = await prisma.user.update({
                where: { id: user.id },
                data: {
                  authProvider: "google",
                  providerUserId: googleId,
                  name: user.name || name,
                },
                include: {
                  organizationMembers: {
                    select: {
                      organizationId: true,
                      role: true,
                    },
                    take: 1,
                  },
                },
              });
            }

            organizationId = user.organizationMembers[0]?.organizationId;
          } else {
            const result = await prisma.$transaction(async (tx) => {
              const newUser = await tx.user.create({
                data: {
                  email,
                  name: name || "Google User",
                  authProvider: "google",
                  providerUserId: googleId,
                  passwordHash: null,
                },
              });

              const organization = await tx.organization.create({
                data: {
                  id: crypto.randomUUID(),
                  name: name ? `${name}'s Organization` : "My Organization",
                  updatedAt: new Date(),
                  members: {
                    create: {
                      userId: newUser.id,
                      role: "CHIEF_ADMIN",
                    },
                  },
                },
              });

              return { user: newUser, organizationId: organization.id };
            });

            user = {
              ...result.user,
              organizationMembers: [
                {
                  organizationId: result.organizationId,
                  role: "CHIEF_ADMIN" as const,
                },
              ],
            };
            organizationId = result.organizationId;
          }

          const token = generateToken(user.id, user.email);
          return done(null, { user, token, organizationId });
        } catch (error) {
          console.error("Google OAuth strategy failed:", error);
          return done(null, false, { message: "google_oauth_failed" });
        }
      }
    )
  );
} else {
  console.warn("Google OAuth is disabled because GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set.");
}

export default passport;
