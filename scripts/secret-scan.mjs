import { readdirSync, readFileSync, existsSync, statSync } from "fs";
import { join, relative, resolve } from "path";

const root = process.cwd();
const cliFiles = process.argv.slice(2).filter(Boolean);

const blockedEnvFilePattern =
  /(^|[\\/])\.env($|[.][^.]+$)|(^|[\\/])\.env\.(?!example$|local\.example$|test\.example$).+/i;

const allowedEnvSuffixes = [".env.example", ".env.local.example", ".env.test.example"];
const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  ".turbo",
  "dist",
  "build",
  ".next",
  "postgres_data",
]);
const ignoredContentExtensions = new Set([".md", ".txt"]);

const sensitiveKeyPattern =
  /(^|\n)\s*(DATABASE_URL|DIRECT_URL|MONGODB_URI|JWT_SECRET|GOOGLE_CLIENT_SECRET|SMTP_PASSWORD|SMTP_USER|R2_SECRET_ACCESS_KEY|R2_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|AWS_ACCESS_KEY_ID|STRIPE_SECRET_KEY|SENDGRID_API_KEY|TWILIO_AUTH_TOKEN)\s*=\s*(?!your-|example|changeme|replace_me|test-|placeholder|postgresql:\/\/user:password)(.+)/i;

const credentialUrlPattern = /(^|\n)\s*[A-Z0-9_]*URL\s*=\s*.+:\/\/[^:\s]+:[^@\s]+@/i;

function isBlockedEnvFile(filePath) {
  if (!filePath.toLowerCase().includes(".env")) {
    return false;
  }

  return blockedEnvFilePattern.test(filePath) && !allowedEnvSuffixes.some((suffix) => filePath.endsWith(suffix));
}

function collectRepoFiles(currentDir = root) {
  const entries = readdirSync(currentDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) {
        continue;
      }
      files.push(...collectRepoFiles(join(currentDir, entry.name)));
      continue;
    }

    const absolutePath = join(currentDir, entry.name);
    const relativePath = relative(root, absolutePath);
    if (cliFiles.length === 0 && isBlockedEnvFile(relativePath)) {
      continue;
    }
    files.push(relativePath);
  }

  return files;
}

function getCandidateFiles() {
  if (cliFiles.length > 0) {
    return cliFiles;
  }

  return collectRepoFiles();
}

function readContent(filePath) {
  const absolutePath = resolve(root, filePath);
  if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
    return "";
  }
  return readFileSync(absolutePath, "utf8");
}

function shouldScanContent(filePath) {
  const normalizedPath = filePath.replace(/\\/g, "/");
  const extension = normalizedPath.includes(".")
    ? normalizedPath.slice(normalizedPath.lastIndexOf(".")).toLowerCase()
    : "";

  if (ignoredContentExtensions.has(extension)) {
    return false;
  }

  return true;
}

const findings = [];
const files = getCandidateFiles();

for (const filePath of files) {
  if (isBlockedEnvFile(filePath)) {
    findings.push(
      `${filePath}: tracked env files with real values are blocked. Commit only *.example templates.`
    );
    continue;
  }

  if (allowedEnvSuffixes.some((suffix) => filePath.endsWith(suffix))) {
    continue;
  }

  if (!shouldScanContent(filePath)) {
    continue;
  }

  let content = "";
  try {
    content = readContent(filePath);
  } catch (error) {
    findings.push(`${filePath}: could not inspect file contents for secret scanning.`);
    continue;
  }

  if (!content) {
    continue;
  }

  if (sensitiveKeyPattern.test(content)) {
    findings.push(`${filePath}: contains a sensitive-looking environment variable assignment.`);
  }

  if (credentialUrlPattern.test(content)) {
    findings.push(`${filePath}: contains an embedded username/password URL.`);
  }
}

if (findings.length > 0) {
  console.error("Secret scan failed:");
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  console.error("");
  console.error("Move real secrets into local .env.local or .env.test files that stay gitignored.");
  console.error("Commit only .env.example-style templates with placeholder values.");
  process.exit(1);
}

console.log(cliFiles.length > 0 ? "Secret scan passed for selected files." : "Secret scan passed.");
