#!/usr/bin/env tsx
/**
 * Test Setup Verification Script
 * 
 * Verifies that the test environment is properly configured before running tests.
 * Run this before your first test run to catch configuration issues early.
 * 
 * Usage:
 *   npx tsx scripts/verify-test-setup.ts
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

interface CheckResult {
  name: string;
  status: "PASS" | "FAIL" | "WARN";
  message: string;
  fix?: string;
}

const results: CheckResult[] = [];

function addResult(name: string, status: "PASS" | "FAIL" | "WARN", message: string, fix?: string) {
  results.push({ name, status, message, fix });
}

async function checkEnvironmentVariable() {
  console.log("1. Checking TEST_DATABASE_URL environment variable...");
  
  // Try to load from .env.test
  const envTestPath = join(process.cwd(), ".env.test");
  if (existsSync(envTestPath)) {
    const envContent = readFileSync(envTestPath, "utf-8");
    const match = envContent.match(/TEST_DATABASE_URL\s*=\s*(.+)/);
    if (match && match[1] && !match[1].includes("password@localhost")) {
      process.env.TEST_DATABASE_URL = match[1].trim();
      addResult(
        "Environment Variable",
        "PASS",
        ".env.test file found with TEST_DATABASE_URL"
      );
    } else {
      addResult(
        "Environment Variable",
        "FAIL",
        ".env.test file exists but TEST_DATABASE_URL is not configured or uses placeholder",
        "Edit .env.test and set your actual test database URL"
      );
    }
  } else {
    addResult(
      "Environment Variable",
      "FAIL",
      ".env.test file not found",
      "Copy .env.test.example to .env.test and configure TEST_DATABASE_URL"
    );
  }
}

async function checkDatabaseConnection() {
  console.log("2. Testing database connection...");
  
  if (!process.env.TEST_DATABASE_URL) {
    addResult(
      "Database Connection",
      "FAIL",
      "Cannot test connection without TEST_DATABASE_URL",
      "Fix the environment variable issue first"
    );
    return;
  }

  try {
    // Temporarily set DATABASE_URL for Prisma
    const originalUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    
    const prisma = new PrismaClient();
    await prisma.$connect();
    await prisma.$disconnect();
    
    process.env.DATABASE_URL = originalUrl;
    
    addResult(
      "Database Connection",
      "PASS",
      "Successfully connected to test database"
    );
  } catch (error) {
    addResult(
      "Database Connection",
      "FAIL",
      `Failed to connect: ${error instanceof Error ? error.message : String(error)}`,
      "Check your database is running and TEST_DATABASE_URL is correct. Try: psql $TEST_DATABASE_URL"
    );
  }
}

async function checkDatabaseSchema() {
  console.log("3. Checking database schema...");
  
  if (!process.env.TEST_DATABASE_URL) {
    addResult(
      "Database Schema",
      "FAIL",
      "Cannot check schema without TEST_DATABASE_URL"
    );
    return;
  }

  try {
    const originalUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    
    const prisma = new PrismaClient();
    await prisma.$connect();
    
    // Try to query a table that should exist
    const userCount = await prisma.user.count();
    
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalUrl;
    
    addResult(
      "Database Schema",
      "PASS",
      `Schema is migrated (found ${userCount} users in test DB)`
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("relation") && error.message.includes("does not exist")) {
      addResult(
        "Database Schema",
        "FAIL",
        "Database schema not migrated",
        "Run: cd packages/database && DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy"
      );
    } else {
      addResult(
        "Database Schema",
        "WARN",
        `Could not verify schema: ${error instanceof Error ? error.message : String(error)}`,
        "This might be okay if the database is empty"
      );
    }
  }
}

async function checkJestInstallation() {
  console.log("4. Checking Jest installation...");
  
  try {
    const packageJsonPath = join(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    
    const hasJest = packageJson.devDependencies?.jest;
    const hasTsJest = packageJson.devDependencies?.["ts-jest"];
    const hasSupertest = packageJson.devDependencies?.supertest;
    
    if (hasJest && hasTsJest && hasSupertest) {
      addResult(
        "Jest Installation",
        "PASS",
        "Jest, ts-jest, and supertest are installed"
      );
    } else {
      const missing = [];
      if (!hasJest) missing.push("jest");
      if (!hasTsJest) missing.push("ts-jest");
      if (!hasSupertest) missing.push("supertest");
      
      addResult(
        "Jest Installation",
        "FAIL",
        `Missing dependencies: ${missing.join(", ")}`,
        "Run: npm install --save-dev jest ts-jest supertest @types/jest @types/supertest"
      );
    }
  } catch (error) {
    addResult(
      "Jest Installation",
      "FAIL",
      "Could not read package.json",
      "Make sure you're running this from apps/api directory"
    );
  }
}

async function checkTestFiles() {
  console.log("5. Checking test files...");
  
  const testFilePath = join(process.cwd(), "src", "__tests__", "payment-lifecycle.test.ts");
  const helpersPath = join(process.cwd(), "src", "__tests__", "helpers.ts");
  const setupPath = join(process.cwd(), "src", "__tests__", "setup.ts");
  
  const testsExist = existsSync(testFilePath);
  const helpersExist = existsSync(helpersPath);
  const setupExists = existsSync(setupPath);
  
  if (testsExist && helpersExist && setupExists) {
    addResult(
      "Test Files",
      "PASS",
      "All test files are present"
    );
  } else {
    const missing = [];
    if (!testsExist) missing.push("payment-lifecycle.test.ts");
    if (!helpersExist) missing.push("helpers.ts");
    if (!setupExists) missing.push("setup.ts");
    
    addResult(
      "Test Files",
      "FAIL",
      `Missing test files: ${missing.join(", ")}`,
      "Make sure all test files are created in src/__tests__/"
    );
  }
}

function printResults() {
  console.log("\n" + "=".repeat(80));
  console.log("TEST SETUP VERIFICATION RESULTS");
  console.log("=".repeat(80) + "\n");

  const passCount = results.filter((r) => r.status === "PASS").length;
  const failCount = results.filter((r) => r.status === "FAIL").length;
  const warnCount = results.filter((r) => r.status === "WARN").length;

  results.forEach((result) => {
    const icon = result.status === "PASS" ? "✅" : result.status === "FAIL" ? "❌" : "⚠️ ";
    console.log(`${icon} ${result.status.padEnd(6)} | ${result.name}`);
    console.log(`   ${result.message}`);
    
    if (result.fix) {
      console.log(`   FIX: ${result.fix}`);
    }
    console.log();
  });

  console.log("=".repeat(80));
  console.log("SUMMARY");
  console.log("=".repeat(80));
  console.log(`✅ PASS: ${passCount}`);
  console.log(`❌ FAIL: ${failCount}`);
  console.log(`⚠️  WARN: ${warnCount}`);
  console.log();

  if (failCount === 0 && warnCount === 0) {
    console.log("🎉 Your test environment is ready! Run: npm test");
    process.exit(0);
  } else if (failCount === 0) {
    console.log("⚠️  Setup is mostly complete but has warnings. You can try running tests.");
    process.exit(0);
  } else {
    console.log("❌ Fix the issues above before running tests.");
    console.log("\nQuick start checklist:");
    console.log("  1. Copy .env.test.example to .env.test");
    console.log("  2. Set TEST_DATABASE_URL in .env.test");
    console.log("  3. Run: cd packages/database && DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy");
    console.log("  4. Run: npm install");
    console.log("  5. Run this script again: npx tsx scripts/verify-test-setup.ts");
    process.exit(1);
  }
}

async function main() {
  console.log("🔍 Verifying Test Environment Setup\n");

  await checkEnvironmentVariable();
  await checkDatabaseConnection();
  await checkDatabaseSchema();
  await checkJestInstallation();
  await checkTestFiles();
  
  printResults();
}

main().catch((error) => {
  console.error("❌ Unexpected error during verification:");
  console.error(error);
  process.exit(1);
});
