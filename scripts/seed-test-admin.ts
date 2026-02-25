import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "crypto";

const prisma = new PrismaClient();

// ANSI color codes
const colors = {
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

interface SeedResult {
  userId: string;
  organizationId: string;
  membershipId: string;
  onboardingId: string;
}

async function seedTestAdmin(): Promise<SeedResult> {
  console.log("\n");
  console.log(`${colors.cyan}${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}              SEEDING TEST ADMIN ACCOUNT              ${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log("\n");

  try {
    // Check if test admin already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: "admin@contribly.test" },
    });

    if (existingUser) {
      console.log(`${colors.yellow}⚠️  Test admin already exists (ID: ${existingUser.id})${colors.reset}`);
      
      // Get organization and membership
      const membership = await prisma.organizationMember.findFirst({
        where: { userId: existingUser.id },
        include: { organization: true },
      });

      if (membership) {
        console.log(`${colors.yellow}Organization: ${membership.organization.name} (ID: ${membership.organization.id})${colors.reset}`);
        console.log(`${colors.yellow}Role: ${membership.role}${colors.reset}\n`);
        
        return {
          userId: existingUser.id,
          organizationId: membership.organizationId,
          membershipId: membership.id,
          onboardingId: "existing",
        };
      }
    }

    // Hash password
    console.log(`${colors.cyan}Hashing password...${colors.reset}`);
    const passwordHash = await bcrypt.hash("Admin1234!", 10);
    console.log(`${colors.green}✓ Password hashed${colors.reset}\n`);

    // Create user
    console.log(`${colors.cyan}Creating user...${colors.reset}`);
    const user = await prisma.user.create({
      data: {
        email: "admin@contribly.test",
        passwordHash,
        name: "Test Admin",
        avatarUrl: null,
      },
    });
    console.log(`${colors.green}✓ Created User${colors.reset}`);
    console.log(`  ID: ${colors.cyan}${user.id}${colors.reset}`);
    console.log(`  Email: ${colors.cyan}${user.email}${colors.reset}`);
    console.log(`  Name: ${colors.cyan}${user.name}${colors.reset}\n`);

    // Create organization
    console.log(`${colors.cyan}Creating organization...${colors.reset}`);
    const organization = await prisma.organization.create({
      data: {
        id: crypto.randomUUID(),
        name: "Contribly Test Org",
        updatedAt: new Date(),
      },
    });
    console.log(`${colors.green}✓ Created Organization${colors.reset}`);
    console.log(`  ID: ${colors.cyan}${organization.id}${colors.reset}`);
    console.log(`  Name: ${colors.cyan}${organization.name}${colors.reset}\n`);

    // Create organization membership
    console.log(`${colors.cyan}Creating CHIEF_ADMIN membership...${colors.reset}`);
    const membership = await prisma.organizationMember.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: "CHIEF_ADMIN",
      },
    });
    console.log(`${colors.green}✓ Created OrganizationMember${colors.reset}`);
    console.log(`  ID: ${colors.cyan}${membership.id}${colors.reset}`);
    console.log(`  Role: ${colors.cyan}${membership.role}${colors.reset}\n`);

    // Create onboarding progress
    console.log(`${colors.cyan}Creating onboarding progress...${colors.reset}`);
    const onboarding = await prisma.onboardingProgress.create({
      data: {
        organizationId: organization.id,
        currentStep: 1,
        orgProfileDone: false,
        paymentSetupDone: false,
        deptCreatedDone: false,
        inviteSentDone: false,
        isComplete: false,
      },
    });
    console.log(`${colors.green}✓ Created OnboardingProgress${colors.reset}`);
    console.log(`  ID: ${colors.cyan}${onboarding.id}${colors.reset}`);
    console.log(`  Current Step: ${colors.cyan}${onboarding.currentStep}${colors.reset}\n`);

    // Print summary
    console.log(`${colors.cyan}${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.green}${colors.bold}✓ Test admin seeded successfully!${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log("\n");

    console.log(`${colors.bold}Test Admin Credentials:${colors.reset}`);
    console.log(`  ${colors.yellow}Email:${colors.reset}    ${colors.cyan}${colors.bold}admin@contribly.test${colors.reset}`);
    console.log(`  ${colors.yellow}Password:${colors.reset} ${colors.cyan}${colors.bold}Admin1234!${colors.reset}`);
    console.log("\n");

    console.log(`${colors.bold}Testing Instructions:${colors.reset}`);
    console.log(`  1. Visit ${colors.cyan}${process.env.FRONTEND_URL || "http://localhost:3000"}${colors.reset}`);
    console.log(`  2. Login with the credentials above`);
    console.log(`  3. You should see the Chief Admin dashboard`);
    console.log(`  4. Complete the onboarding wizard to set up the organization`);
    console.log("\n");

    console.log(`${colors.bold}Database Records Created:${colors.reset}`);
    console.log(`  • User ID: ${colors.cyan}${user.id}${colors.reset}`);
    console.log(`  • Organization ID: ${colors.cyan}${organization.id}${colors.reset}`);
    console.log(`  • Membership ID: ${colors.cyan}${membership.id}${colors.reset}`);
    console.log(`  • Onboarding ID: ${colors.cyan}${onboarding.id}${colors.reset}`);
    console.log("\n");

    return {
      userId: user.id,
      organizationId: organization.id,
      membershipId: membership.id,
      onboardingId: onboarding.id,
    };
  } catch (error) {
    console.error(`\n${colors.red}${colors.bold}Error seeding test admin:${colors.reset}`, error);
    
    if (error instanceof Error) {
      console.error(`${colors.red}Message: ${error.message}${colors.reset}`);
      
      // Check for common errors
      if (error.message.includes("Unique constraint")) {
        console.log(`\n${colors.yellow}Tip: Test admin may already exist. Check the database or use a different email.${colors.reset}\n`);
      } else if (error.message.includes("Foreign key constraint")) {
        console.log(`\n${colors.yellow}Tip: Foreign key constraint error. Ensure the database is properly reset.${colors.reset}\n`);
      }
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
seedTestAdmin()
  .then((result) => {
    console.log(`${colors.green}${colors.bold}✓ Script completed successfully${colors.reset}\n`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n${colors.red}${colors.bold}Fatal error:${colors.reset}`, error);
    prisma.$disconnect();
    process.exit(1);
  });
