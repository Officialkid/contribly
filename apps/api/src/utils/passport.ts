import passport from "passport";
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import { PrismaClient } from "@prisma/client";
import { generateToken } from "./jwt.js";

const prisma = new PrismaClient();

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: "/api/auth/google/callback",
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const googleId = profile.id;

        if (!email) {
          return done(new Error("No email found in Google profile"), undefined);
        }

        // Find or create user
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
          // Update existing user with Google auth
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
          // Create new user and organization
          const result = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
              data: {
                email,
                name,
                authProvider: "google",
                providerUserId: googleId,
                passwordHash: null,
              },
            });

            // Create default organization for new user
            const organization = await tx.organization.create({
              data: {
                name: `${name}'s Organization` || "My Organization",
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

          user = { ...result.user, organizationMembers: [{ organizationId: result.organizationId, role: "CHIEF_ADMIN" as const }] };
          organizationId = result.organizationId;
        }

        // Generate JWT token
        const token = generateToken(user.id, user.email);

        // Pass user data and token to the callback
        return done(null, { user, token, organizationId });
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

export default passport;
