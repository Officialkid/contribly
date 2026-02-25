import { PrismaClient } from "@prisma/client";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
import nodemailer from "nodemailer";

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
  timestamp: string;
}

// Create email transporter
const transporter = process.env.SMTP_HOST ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
}) : null;

async function sendAuditEmail(
  results: DeletionResult[],
  totalRecords: number,
  duration: string,
  executorEmail?: string
): Promise<void> {
  if (!transporter) {
    console.log(`${colors.yellow}⚠️  Email not configured, skipping audit email${colors.reset}`);
    return;
  }

  const auditEmail = process.env.AUDIT_EMAIL || executorEmail || process.env.SMTP_USER;
  if (!auditEmail) {
    console.log(`${colors.yellow}⚠️  No audit email configured, skipping audit email${colors.reset}`);
    return;
  }

  const timestamp = new Date().toISOString();
  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;

  const resultsTable = results
    .map(
      (r) =>
        `<tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${r.model}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${r.count}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${r.success ? "✓ Success" : "✗ Failed"}</td>
          <td style="padding: 8px; border: 1px solid #ddd; font-size: 12px;">${r.timestamp}</td>
        </tr>`
    )
    .join("");

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Contribly Audit" <noreply@contribly.com>',
    to: auditEmail,
    subject: `⚠️ CONTRIBLY: Production Data Reset Executed - ${timestamp}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">⚠️ PRODUCTION DATA RESET</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Audit Log</p>
            </div>
            <div style="padding: 40px 30px;">
              <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 16px 20px; margin: 0 0 30px 0; border-radius: 6px;">
                <p style="margin: 0; font-size: 16px; color: #991b1b;"><strong>⚠️ CRITICAL OPERATION EXECUTED</strong></p>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #991b1b;">All user and organization data has been permanently deleted from the production database.</p>
              </div>

              <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Execution Summary</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
                <tr style="background-color: #f7f7f7;">
                  <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Timestamp</td>
                  <td style="padding: 12px; border: 1px solid #ddd;">${timestamp}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Total Records Deleted</td>
                  <td style="padding: 12px; border: 1px solid #ddd; color: #dc2626; font-weight: bold;">${totalRecords}</td>
                </tr>
                <tr style="background-color: #f7f7f7;">
                  <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Successful Operations</td>
                  <td style="padding: 12px; border: 1px solid #ddd; color: #059669;">${successCount}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Failed Operations</td>
                  <td style="padding: 12px; border: 1px solid #ddd; color: ${failureCount > 0 ? "#dc2626" : "#059669"};">${failureCount}</td>
                </tr>
                <tr style="background-color: #f7f7f7;">
                  <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Duration</td>
                  <td style="padding: 12px; border: 1px solid #ddd;">${duration}s</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Environment</td>
                  <td style="padding: 12px; border: 1px solid #ddd;">${process.env.NODE_ENV || "unknown"}</td>
                </tr>
              </table>

              <h2 style="color: #333; margin: 30px 0 20px 0; font-size: 24px;">Detailed Results</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
                <thead>
                  <tr style="background-color: #f7f7f7;">
                    <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Model</th>
                    <th style="padding: 12px; border: 1px solid #ddd; text-align: right;">Records</th>
                    <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Status</th>
                    <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  ${resultsTable}
                </tbody>
              </table>

              <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 16px 20px; margin: 30px 0; border-radius: 6px;">
                <p style="margin: 0; font-size: 14px; color: #1e40af;"><strong>📋 Log File:</strong> A detailed log has been saved to <code>logs/reset-${new Date().toISOString().replace(/:/g, "-")}.log</code></p>
              </div>

              ${
                failureCount > 0
                  ? `
              <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 16px 20px; margin: 20px 0; border-radius: 6px;">
                <p style="margin: 0; font-size: 14px; color: #991b1b;"><strong>⚠️ ERRORS DETECTED:</strong> Some deletion operations failed. Please review the log file and database state immediately.</p>
              </div>
              `
                  : ""
              }
            </div>
            <div style="background: #f7f7f7; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; font-size: 12px; color: #999;">© ${new Date().getFullYear()} Contribly. All rights reserved.</p>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #999;">This is an automated audit notification.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
⚠️ CONTRIBLY: PRODUCTION DATA RESET EXECUTED

Timestamp: ${timestamp}
Total Records Deleted: ${totalRecords}
Successful Operations: ${successCount}
Failed Operations: ${failureCount}
Duration: ${duration}s
Environment: ${process.env.NODE_ENV || "unknown"}

DETAILED RESULTS:
${results.map((r) => `${r.model}: ${r.count} records - ${r.success ? "Success" : "Failed"} (${r.timestamp})`).join("\n")}

Log file: logs/reset-${new Date().toISOString().replace(/:/g, "-")}.log

${failureCount > 0 ? "⚠️ ERRORS DETECTED: Some operations failed. Review log immediately." : ""}

© ${new Date().getFullYear()} Contribly
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`${colors.green}✓ Audit email sent to ${auditEmail}${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}✗ Failed to send audit email:${colors.reset}`, error);
  }
}

async function writeLogFile(results: DeletionResult[], totalRecords: number, duration: string): Promise<string> {
  const logsDir = path.join(process.cwd(), "logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/:/g, "-");
  const logFile = path.join(logsDir, `reset-${timestamp}.log`);

  const logContent = `
CONTRIBLY PRODUCTION DATA RESET - AUDIT LOG
============================================

Execution Timestamp: ${new Date().toISOString()}
Environment: ${process.env.NODE_ENV || "unknown"}
Database: ${process.env.DATABASE_URL ? "[REDACTED]" : "NOT SET"}

SUMMARY
-------
Total Records Deleted: ${totalRecords}
Successful Operations: ${results.filter((r) => r.success).length}
Failed Operations: ${results.filter((r) => !r.success).length}
Duration: ${duration}s

DETAILED RESULTS
----------------
${results
  .map(
    (r) => `
[${r.timestamp}] ${r.model}
  Records: ${r.count}
  Status: ${r.success ? "SUCCESS" : "FAILED"}
  ${r.error ? `Error: ${r.error}` : ""}
`
  )
  .join("\n")}

END OF LOG
==========
`;

  fs.writeFileSync(logFile, logContent);
  return logFile;
}

async function resetAuthDataProduction(): Promise<void> {
  console.log("\n");
  console.log(`${colors.red}${colors.bold}⚠️  ⚠️  ⚠️   PRODUCTION DATA RESET   ⚠️  ⚠️  ⚠️${colors.reset}`);
  console.log(`${colors.red}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.yellow}${colors.bold}THIS WILL PERMANENTLY DELETE ALL DATA IN PRODUCTION!${colors.reset}`);
  console.log(`${colors.yellow}Database schema and structure will be preserved.${colors.reset}`);
  console.log("\n");
  console.log(`${colors.cyan}Environment: ${colors.bold}${process.env.NODE_ENV || "unknown"}${colors.reset}`);
  console.log("\n");
  console.log(`${colors.red}${colors.bold}This operation CANNOT be undone!${colors.reset}`);
  console.log(`${colors.red}An audit email and log file will be generated.${colors.reset}`);
  console.log(`${colors.red}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log("\n");

  // Check environment
  if (process.env.NODE_ENV !== "production") {
    console.log(`${colors.yellow}⚠️  WARNING: NODE_ENV is not "production"${colors.reset}`);
    console.log(`${colors.yellow}Current environment: ${process.env.NODE_ENV || "not set"}${colors.reset}\n`);
  }

  // Create readline interface for confirmations
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = (question: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  };

  // First confirmation: Type "RESET"
  const firstAnswer = await askQuestion(
    `${colors.yellow}${colors.bold}FIRST CONFIRMATION - Type the word RESET to acknowledge this is production: ${colors.reset}`
  );

  if (firstAnswer.trim() !== "RESET") {
    console.log(`\n${colors.green}✓ Operation cancelled. No data was deleted.${colors.reset}\n`);
    rl.close();
    await prisma.$disconnect();
    process.exit(0);
  }

  // Count organizations for second confirmation
  const orgCount = await prisma.organization.count();
  console.log(`\n${colors.cyan}Current organization count: ${colors.bold}${orgCount}${colors.reset}\n`);

  // Second confirmation: Type organization count
  const secondAnswer = await askQuestion(
    `${colors.yellow}${colors.bold}SECOND CONFIRMATION - Type the organization count (${orgCount}) to proceed (or 0 if unsure): ${colors.reset}`
  );

  const expectedCount = parseInt(secondAnswer.trim());
  if (isNaN(expectedCount) || (expectedCount !== orgCount && expectedCount !== 0)) {
    console.log(`\n${colors.green}✓ Operation cancelled due to count mismatch. No data was deleted.${colors.reset}\n`);
    rl.close();
    await prisma.$disconnect();
    process.exit(0);
  }

  rl.close();

  console.log(`\n${colors.cyan}${colors.bold}Starting production data deletion...${colors.reset}\n`);

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
      const timestamp = new Date().toISOString();
      results.push({
        model,
        count: result.count,
        success: true,
        timestamp,
      });
      console.log(`${colors.green}✓${colors.reset} [${timestamp}] Cleared ${colors.bold}${model}${colors.reset} — ${colors.cyan}${result.count}${colors.reset} records`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const timestamp = new Date().toISOString();
      results.push({
        model,
        count: 0,
        success: false,
        error: errorMessage,
        timestamp,
      });
      console.error(`${colors.red}✗${colors.reset} [${timestamp}] Failed to clear ${model}: ${errorMessage}`);

      // Stop on first error to prevent data inconsistency
      console.log(`\n${colors.red}${colors.bold}⚠️  Stopping deletion process due to error${colors.reset}\n`);
      break;
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Write log file
  console.log(`\n${colors.cyan}Writing audit log...${colors.reset}`);
  const logFile = await writeLogFile(results, results.reduce((sum, r) => sum + r.count, 0), duration);
  console.log(`${colors.green}✓ Log file: ${logFile}${colors.reset}\n`);

  // Send audit email
  console.log(`${colors.cyan}Sending audit email...${colors.reset}`);
  await sendAuditEmail(results, results.reduce((sum, r) => sum + r.count, 0), duration);

  // Print summary
  const totalRecords = results.reduce((sum, r) => sum + r.count, 0);
  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;

  console.log("\n");
  console.log(`${colors.cyan}${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}                    DELETION SUMMARY                           ${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log("\n");

  console.log(`${"Model".padEnd(25)} ${"Records Deleted".padEnd(20)} ${"Status".padEnd(10)}`);
  console.log(`${colors.cyan}${"─".repeat(65)}${colors.reset}`);

  for (const result of results) {
    const modelName = result.model.padEnd(25);
    const count = result.count.toString().padEnd(20);
    const status = result.success ? `${colors.green}✓ Success${colors.reset}` : `${colors.red}✗ Failed${colors.reset}`;
    console.log(`${modelName} ${count} ${status}`);
    if (result.error) {
      console.log(`  ${colors.red}Error: ${result.error}${colors.reset}`);
    }
  }

  console.log(`${colors.cyan}${"─".repeat(65)}${colors.reset}`);
  console.log(`${"TOTAL".padEnd(25)} ${totalRecords.toString().padEnd(20)}`);
  console.log("\n");

  console.log(`${colors.bold}Statistics:${colors.reset}`);
  console.log(`  • Total records deleted: ${colors.cyan}${totalRecords}${colors.reset}`);
  console.log(`  • Successful operations: ${colors.green}${successCount}${colors.reset}`);
  console.log(`  • Failed operations: ${failureCount > 0 ? colors.red : colors.green}${failureCount}${colors.reset}`);
  console.log(`  • Duration: ${colors.cyan}${duration}s${colors.reset}`);
  console.log(`  • Log file: ${colors.cyan}${logFile}${colors.reset}`);
  console.log("\n");

  if (failureCount === 0) {
    console.log(`${colors.green}${colors.bold}✓ Production data reset completed successfully!${colors.reset}`);
    console.log(`${colors.yellow}Next steps:${colors.reset}`);
    console.log(`  1. Verify schema integrity: ${colors.cyan}cd packages/database && npx prisma db push${colors.reset}`);
    console.log(`  2. Create test admin: ${colors.cyan}npx tsx scripts/seed-test-admin.ts${colors.reset}`);
    console.log(`  3. Review audit email and log file`);
  } else {
    console.log(`${colors.red}${colors.bold}⚠️  Production data reset completed with errors!${colors.reset}`);
    console.log(`${colors.yellow}IMMEDIATE ACTION REQUIRED:${colors.reset}`);
    console.log(`  1. Review the log file: ${colors.cyan}${logFile}${colors.reset}`);
    console.log(`  2. Check audit email for detailed error information`);
    console.log(`  3. Verify database state and integrity`);
  }

  console.log("\n");

  await prisma.$disconnect();
}

// Run the script
resetAuthDataProduction()
  .catch((error) => {
    console.error(`\n${colors.red}${colors.bold}Fatal error:${colors.reset}`, error);
    prisma.$disconnect();
    process.exit(1);
  });
