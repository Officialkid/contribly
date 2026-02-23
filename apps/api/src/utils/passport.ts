import passport from "passport";
import crypto from "crypto";
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import { PrismaClient } from "@prisma/client";
import { generateToken } from "./jwt.js";

const prisma = new PrismaClient();

// DEBUG: Log the callback URL being used
console.log("🔴 GOOGLE_CALLBACK_URL IN USE:", process.env.GOOGLE_CALLBACK_URL);
console.log("🔴 GOOGLE_CLIENT_ID IN USE:", process.env.GOOGLE_CLIENT_ID ? "SET" : "NOT SET");
console.log("🔴 NODE_ENV:", process.env.NODE_ENV);

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      // Use absolute callback URL if provided (avoids redirect_uri_mismatch behind proxies)
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ) => {
      try {
        console.log("🔵 Google OAuth Strategy - Starting verification");
        console.log("🔵 Google Profile ID:", profile.id);
        console.log("🔵 Google Profile Display Name:", profile.displayName);
        console.log("🔵 Google Profile Emails:", JSON.stringify(profile.emails));

        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const googleId = profile.id;

        if (!email) {
          console.error("❌ No email found in Google profile");
          return done(null, false, { message: "no_email_in_profile" });
        }

        console.log("🔵 Looking up user by email:", email);

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

        console.log("🔵 Prisma lookup result:", user ? `Found user ${user.id}` : "No user found, will create new");

        let organizationId: string | undefined;

        if (user) {
          console.log("✅ Existing user found:", user.id);
          
          // Update existing user with Google auth info if needed
          if (!user.providerUserId || user.authProvider !== "google") {
            console.log("🔵 Updating user with Google auth provider");
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
            console.log("✅ User updated with Google auth");
          }
          
          organizationId = user.organizationMembers[0]?.organizationId;
          console.log("✅ User organization ID:", organizationId);
        } else {
          console.log("🔵 New user - creating user and organization in transaction");
          
          // Create new user and organization in transaction
          const result = await prisma.$transaction(async (tx) => {
            console.log("🔵 Creating new user with email:", email);
            const newUser = await tx.user.create({
              data: {
                email,
                name: name || "Google User",
                authProvider: "google",
                providerUserId: googleId,
                passwordHash: null,
              },
            });
            console.log("✅ User created successfully:", newUser.id);

            // Create default organization for new user
            console.log("🔵 Creating default organization for user:", newUser.id);
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
            console.log("✅ Organization created successfully:", organization.id);

            return { user: newUser, organizationId: organization.id };
          });

          user = { 
            ...result.user, 
            organizationMembers: [{ 
              organizationId: result.organizationId, 
              role: "CHIEF_ADMIN" as const 
            }] 
          };
          organizationId = result.organizationId;
          console.log("✅ Transaction completed successfully - user and org created");
        }

        // Generate JWT token
        console.log("🔵 Generating JWT token for user:", user.id);
        const token = generateToken(user.id, user.email);
        console.log("✅ JWT token generated");

        // Pass user data and token to the callback
        console.log("✅ Google OAuth Strategy verification complete - passing to callback");
        return done(null, { user, token, organizationId });
      } catch (error) {
        console.error("❌ Google OAuth Strategy Error:", error);
        if (error instanceof Error) {
          console.error("❌ Error message:", error.message);
          console.error("❌ Error stack:", error.stack);
        } else {
          console.error("❌ Error details:", String(error));
        }
        // Avoid throwing to Express; fail gracefully so failureRedirect is used
        return done(null, false, { message: "google_oauth_failed" });
      }
    }
  )
);

export default passport;
