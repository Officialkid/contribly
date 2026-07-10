import { copyFileSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import net from "net";
import { spawn } from "child_process";

const root = process.cwd();
const apiEnvPath = join(root, "apps", "api", ".env.local");
const legacyDbEnvPaths = [
  join(root, ".env"),
  join(root, "packages", "database", ".env.local"),
];

function ensureEnvFile(targetPath, examplePath) {
  if (existsSync(targetPath)) return { created: false };
  copyFileSync(examplePath, targetPath);
  return { created: true };
}

function checkPortAvailable({ host, port, name }) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", () => {
      reject(new Error(`${name} port ${port} is already in use. Free it, then run npm run dev again.`));
    });
    server.once("listening", () => {
      server.close(() => resolve());
    });
    server.listen(port, host);
  });
}

function readDatabaseUrl(envPath) {
  if (!existsSync(envPath)) return null;
  const envContents = readFileSync(envPath, "utf-8");
  const match = envContents.match(/^DATABASE_URL=(.+)$/m);
  if (!match) return null;
  return match[1].trim().replace(/^"|"$/g, "");
}

function warnLegacyDbEnvConflicts() {
  const apiDatabaseUrl = readDatabaseUrl(apiEnvPath);
  if (!apiDatabaseUrl) return;

  for (const envPath of legacyDbEnvPaths) {
    const legacyDatabaseUrl = readDatabaseUrl(envPath);
    if (!legacyDatabaseUrl || legacyDatabaseUrl === apiDatabaseUrl) continue;

    console.warn(
      `Warning: ${envPath} has a different DATABASE_URL than apps/api/.env.local.`,
    );
    console.warn("Native local dev uses apps/api/.env.local as the source of truth.");
  }
}

const apiEnv = ensureEnvFile(
  join(root, "apps", "api", ".env.local"),
  join(root, "apps", "api", ".env.example"),
);
const webEnv = ensureEnvFile(
  join(root, "apps", "web", ".env.local"),
  join(root, "apps", "web", ".env.example"),
);

if (apiEnv.created || webEnv.created) {
  console.log("Created missing local env files from examples.");
  console.log("Review apps/api/.env.local and apps/web/.env.local, then re-run npm run dev.");
  process.exit(1);
}

try {
  warnLegacyDbEnvConflicts();
  await checkPortAvailable({ host: "127.0.0.1", port: 3000, name: "Frontend" });
  await checkPortAvailable({ host: "127.0.0.1", port: 3001, name: "API" });
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  console.error("Confirm ports 3000/3001 are free, then retry.");
  console.error("If you are preparing a Neon-backed environment, run npm run db:doctor and npm run db:setup.");
  process.exit(1);
}

const child = spawn("npm", ["run", "dev:workspaces"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
