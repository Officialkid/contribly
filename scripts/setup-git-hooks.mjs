import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, "..");
const gitDir = join(root, ".git");
const hooksDir = join(root, ".githooks");

if (!existsSync(gitDir) || !existsSync(hooksDir)) {
  process.exit(0);
}

try {
  execFileSync("git", ["config", "core.hooksPath", ".githooks"], {
    cwd: root,
    stdio: "ignore",
  });
  console.log("Configured git hooks to use .githooks/");
} catch (error) {
  console.warn("Could not configure git hooks automatically.");
  console.warn("Run: git config core.hooksPath .githooks");
}
