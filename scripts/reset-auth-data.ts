import { PrismaClient } from "@prisma/client";
import * as readline from "readline";

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

interface DeletionResult {
  model: string;
  count: number;
  success: boolean;
  error?: string;
}

async function resetAuthData(): Promise<void> {
  console.log("\n");
  console.log(`${colors.red}${colors.bold}⚠️  WARNING: DESTRUCTIVE OPERATION ⚠️${colors.reset}`);
  console.log(`${colors.red}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.yellow}This script will PERMANENTLY DELETE all user and organization data.${colors.reset}`);
  console.log(`${colors.yellow}Database schema and structure will be preserved.${colors.reset}`);
  console.log("\n");
  console.log(`${colors.cyan}The following data will be deleted:${colors.reset}`);
  console.log(`  • All users and their authentication data`);
  console.log(`  • All organizations and departments`);
  console.log(`  • All payments, claims, and withdrawals`);
  console.log(`  • All invites and onboarding progress`);
  console.log(`  • All payment accounts and audit logs`);
  console.log("\n");
  console.log(`${colors.red}${colors.bold}This operation CANNOT be undone!${colors.reset}`);
  console.log(`${colors.red}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log("\n");

  // Create readline interface for confirmation
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise<string>((resolve) => {
    rl.question(
      `${colors.yellow}${colors.bold}Type "CONFIRM" to proceed with data deletion: ${colors.reset}`,
      (answer) => {
        rl.close();
        resolve(answer);
      }
    );
  });

  if (answer.trim() !== "CONFIRM") {
    console.log(`\n${colors.green}✓ Operation cancelled. No data was deleted.${colors.reset}\n`);
    await prisma.$disconnect();
    process.exit(0);
  }

  console.log(`\n${colors.cyan}Starting data deletion...${colors.reset}\n`);

  const results: DeletionResult[] = [];
  const startTime = Date.now();

  // Delete in specific order to respect foreign key constraints
  const deletionOrder = [
    { model: "AuditLog", fn: () => prisma.auditLog.deleteMany({}) },
    { model: "WithdrawalOTP", fn: () => prisma.withdrawalOTP.deleteMany({}) },
    { model: "Withdrawal", fn: () => prisma.withdrawal.deleteMany({}) },
    { model: "PaymentClaim", fn: () => prisma.paymentClaim.deleteMany({}) },
    { model: "Payment", fn: () => prisma.payment.deleteMany({}) },
    { model: "DepartmentMember", fn: () => prisma.departmentMember.deleteMany({}) },
    { model: "Department", fn: () => prisma.department.deleteMany({}) },
    { model: "InviteLink", fn: () => prisma.inviteLink.deleteMany({}) },
    { model: "OnboardingProgress", fn: () => prisma.onboardingProgress.deleteMany({}) },
    { model: "PaymentAccount", fn: () => prisma.paymentAccount.deleteMany({}) },
    { model: "OrganizationMember", fn: () => prisma.organizationMember.deleteMany({}) },
    { model: "Organization", fn: () => prisma.organization.deleteMany({}) },
    { model: "ChiefAdminPIN", fn: () => prisma.chiefAdminPIN.deleteMany({}) },
    { model: "User", fn: () => prisma.user.deleteMany({}) },
  ];

  // Execute deletions
  for (const { model, fn } of deletionOrder) {
    try {
      const result = await fn();
      results.push({
        model,
        count: result.count,
        success: true,
      });
      console.log(`${colors.green}✓${colors.reset} Cleared ${colors.bold}${model}${colors.reset} — ${colors.cyan}${result.count}${colors.reset} records`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({
        model,
        count: 0,
        success: false,
        error: errorMessage,
      });
      console.error(`${colors.red}✗ Failed to clear ${model}: ${errorMessage}${colors.reset}`);
      
      // Stop on first error to prevent data inconsistency
      console.log(`\n${colors.red}${colors.bold}⚠️  Stopping deletion process due to error${colors.reset}\n`);
      break;
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Print summary
  console.log("\n");
  console.log(`${colors.cyan}${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}                    DELETION SUMMARY                    ${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log("\n");

  // Calculate totals
  const totalRecords = results.reduce((sum, r) => sum + r.count, 0);
  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;

  // Print table
  console.log(`${"Model".padEnd(25)} ${"Records Deleted".padEnd(20)} ${"Status".padEnd(10)}`);
  console.log(`${colors.cyan}${"─".repeat(60)}${colors.reset}`);
  
  for (const result of results) {
    const modelName = result.model.padEnd(25);
    const count = result.count.toString().padEnd(20);
    const status = result.success 
      ? `${colors.green}✓ Success${colors.reset}` 
      : `${colors.red}✗ Failed${colors.reset}`;
    console.log(`${modelName} ${count} ${status}`);
    if (result.error) {
      console.log(`  ${colors.red}Error: ${result.error}${colors.reset}`);
    }
  }

  console.log(`${colors.cyan}${"─".repeat(60)}${colors.reset}`);
  console.log(`${"TOTAL".padEnd(25)} ${totalRecords.toString().padEnd(20)}`);
  console.log("\n");

  // Print stats
  console.log(`${colors.bold}Statistics:${colors.reset}`);
  console.log(`  • Total records deleted: ${colors.cyan}${totalRecords}${colors.reset}`);
  console.log(`  • Successful operations: ${colors.green}${successCount}${colors.reset}`);
  console.log(`  • Failed operations: ${failureCount > 0 ? colors.red : colors.green}${failureCount}${colors.reset}`);
  console.log(`  • Duration: ${colors.cyan}${duration}s${colors.reset}`);
  console.log("\n");

  if (failureCount === 0) {
    console.log(`${colors.green}${colors.bold}✓ Data reset completed successfully!${colors.reset}`);
    console.log(`${colors.yellow}Next steps:${colors.reset}`);
    console.log(`  1. Verify schema integrity: ${colors.cyan}cd packages/database && npx prisma db push${colors.reset}`);
    console.log(`  2. Create test admin: ${colors.cyan}npx tsx scripts/seed-test-admin.ts${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bold}⚠️  Data reset completed with errors!${colors.reset}`);
    console.log(`${colors.yellow}Please review the errors above and fix any issues.${colors.reset}`);
  }
  
  console.log("\n");

  await prisma.$disconnect();
}

// Run the script
resetAuthData()
  .catch((error) => {
    console.error(`\n${colors.red}${colors.bold}Fatal error:${colors.reset}`, error);
    prisma.$disconnect();
    process.exit(1);
  });
