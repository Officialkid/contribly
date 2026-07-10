import { config } from "dotenv";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = join(__dirname, "..");
const localEnvPath = join(appRoot, ".env.local");

if (existsSync(localEnvPath)) {
  config({ path: localEnvPath, override: true });
}
