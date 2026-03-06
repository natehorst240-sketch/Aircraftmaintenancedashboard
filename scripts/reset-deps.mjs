import { rmSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const targets = ["node_modules", "package-lock.json"];
for (const target of targets) {
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
    console.log(`Removed ${target}`);
  }
}

const verify = spawnSync("npm", ["cache", "verify"], { stdio: "inherit", shell: true });
if (verify.status !== 0) process.exit(verify.status ?? 1);

const install = spawnSync("npm", ["install"], { stdio: "inherit", shell: true });
process.exit(install.status ?? 1);
