import { existsSync, readFileSync } from "fs";
import { join } from "path";
import net from "net";
import { spawn } from "child_process";

const root = process.cwd();
const apiEnvPath = join(root, "apps", "api", ".env.local");
const schemaPath = join(root, "packages", "database", "prisma", "schema.prisma");
const legacyEnvPaths = [
  join(root, ".env"),
  join(root, "packages", "database", ".env.local"),
];

function normalizeEnvValue(value) {
  return value.trim().replace(/^['"]|['"]$/g, "");
}

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};

  const env = {};
  const lines = readFileSync(filePath, "utf-8").split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = normalizeEnvValue(line.slice(separatorIndex + 1));
    env[key] = value;
  }

  return env;
}

function describeDatabaseHost(databaseUrl) {
  try {
    return new URL(databaseUrl).host;
  } catch {
    return "unknown";
  }
}

function warnLegacyEnvConflicts(canonicalDatabaseUrl) {
  for (const legacyPath of legacyEnvPaths) {
    const legacyEnv = parseEnvFile(legacyPath);
    const legacyDatabaseUrl = legacyEnv.DATABASE_URL;
    if (!legacyDatabaseUrl || legacyDatabaseUrl === canonicalDatabaseUrl) continue;

    console.warn(
      `Warning: ${legacyPath} has a different DATABASE_URL than apps/api/.env.local.`,
    );
    console.warn("Native local DB scripts will ignore that file and use apps/api/.env.local.");
  }
}

function getCanonicalEnv() {
  if (!existsSync(apiEnvPath)) {
    console.error("Missing apps/api/.env.local.");
    console.error("Create it from apps/api/.env.example before running local DB commands.");
    process.exit(1);
  }

  const env = parseEnvFile(apiEnvPath);
  if (!env.DATABASE_URL) {
    console.error("apps/api/.env.local is missing DATABASE_URL.");
    process.exit(1);
  }

  if (!env.DIRECT_URL) {
    console.error("apps/api/.env.local is missing DIRECT_URL.");
    console.error("Use the pooled Neon connection string for DATABASE_URL and the direct connection string for DIRECT_URL.");
    process.exit(1);
  }

  warnLegacyEnvConflicts(env.DATABASE_URL);
  return env;
}

async function runPrisma(args, env) {
  const prismaCliPath = join(root, "node_modules", "prisma", "build", "index.js");
  const prismaArgs = [prismaCliPath, ...args];
  if (!args.includes("--schema")) {
    prismaArgs.push("--schema", schemaPath);
  }

  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, prismaArgs, {
      cwd: root,
      stdio: "inherit",
      env,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Prisma exited with code ${code ?? "unknown"}`));
    });
    child.on("error", reject);
  });
}

async function main() {
  const commandArgs = process.argv.slice(2);
  const subcommand = commandArgs[0];

  if (!subcommand) {
    console.error("Usage: node scripts/prisma-local.mjs <doctor|setup|prisma args...>");
    process.exit(1);
  }

  const canonicalEnv = getCanonicalEnv();
  const databaseUrl = canonicalEnv.DATABASE_URL;
  const env = {
    ...process.env,
    ...canonicalEnv,
    DATABASE_URL: databaseUrl,
    DIRECT_URL: canonicalEnv.DIRECT_URL,
    NODE_ENV: canonicalEnv.NODE_ENV || process.env.NODE_ENV || "development",
  };

  if (subcommand === "doctor") {
    console.log("Using DATABASE_URL from apps/api/.env.local");
    console.log(`Schema: ${schemaPath}`);
    console.log(`Runtime database host: ${describeDatabaseHost(canonicalEnv.DATABASE_URL)}`);
    console.log(`Migration database host: ${describeDatabaseHost(canonicalEnv.DIRECT_URL)}`);
    console.log("DATABASE_URL and DIRECT_URL are both configured.");

    return;
  }

  if (subcommand === "setup") {
    await runPrisma(["generate"], env);
    await runPrisma(["migrate", "deploy"], env);
    return;
  }

  await runPrisma(commandArgs, env);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
