import fs from "node:fs";
import path from "node:path";

function isPnpmUserAgent() {
  const ua = process.env.npm_config_user_agent || "";
  return ua.startsWith("pnpm/");
}

function removeIfExists(relPath) {
  const p = path.resolve(process.cwd(), relPath);
  try {
    fs.rmSync(p, { force: true });
  } catch {
    // ignore
  }
}

removeIfExists("package-lock.json");
removeIfExists("yarn.lock");

if (!isPnpmUserAgent()) {
  console.error("Use pnpm instead.");
  process.exit(1);
}

