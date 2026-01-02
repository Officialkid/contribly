import passport from "passport";
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
        console.log("🔵 Profile ID:", profile.id);
        console.log("🔵 Profile Display Name:", profile.displayName);
        console.log("🔵 Profile Emails:", JSON.stringify(profile.emails));

        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const googleId = profile.id;

        if (!email) {
          console.error("❌ No email found in Google profile");
          return done(new Error("No email found in Google profile"), undefined);
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

        let organizationId: string | undefined;

        if (user) {
          console.log("🔵 Existing user found:", user.id);
          
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
          }
          
          organizationId = user.organizationMembers[0]?.organizationId;
          console.log("🔵 User organization ID:", organizationId);
        } else {
          console.log("🔵 New user - creating user and organization");
          
          // Create new user and organization in transaction
          const result = await prisma.$transaction(async (tx) => {
            console.log("🔵 Creating new user...");
            const newUser = await tx.user.create({
              data: {
                email,
                name: name || "Google User",
                authProvider: "google",
                providerUserId: googleId,
                passwordHash: null,
              },
            });
            console.log("✅ User created:", newUser.id);

            // Create default organization for new user
            console.log("🔵 Creating default organization...");
            const organization = await tx.organization.create({
              data: {
                name: name ? `${name}'s Organization` : "My Organization",
                members: {
                  create: {
                    userId: newUser.id,
                    role: "CHIEF_ADMIN",
                  },
                },
              },
            });
            console.log("✅ Organization created:", organization.id);

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
          console.log("✅ Transaction completed successfully");
        }

        // Generate JWT token
        console.log("🔵 Generating JWT token for user:", user.id);
        const token = generateToken(user.id, user.email);

        // Pass user data and token to the callback
        console.log("✅ Google OAuth verification complete");
        return done(null, { user, token, organizationId });
      } catch (error) {
        console.error("❌ Google OAuth Strategy Error:", error);
        console.error("❌ Error details:", error instanceof Error ? error.message : String(error));
        console.error("❌ Stack trace:", error instanceof Error ? error.stack : "No stack trace");
        return done(error as Error, undefined);
      }
    }
  )
);

export default passport;
