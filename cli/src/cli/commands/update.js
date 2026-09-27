/**
 * `9router update` / `aris update` — Update 9router / Aris to the latest version.
 *
 * Supports:
 * - Git repository auto-detection: pulls latest changes and rebuilds CLI bundle.
 * - Global npm installation: updates via `npm i -g 9router@latest`.
 * - `--check` flag to query version without installing.
 */

const { execSync, spawnSync } = require("child_process");
const https = require("https");
const path = require("path");
const fs = require("fs");

const pkg = require("../../../package.json");

const NPM_PACKAGE_NAME = "9router";

function fetchLatestNpmVersion(packageName = NPM_PACKAGE_NAME, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const req = https.get(
      `https://registry.npmjs.org/${packageName}/latest`,
      { timeout: timeoutMs },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed.version || null);
          } catch {
            resolve(null);
          }
        });
      }
    );
    req.on("error", () => resolve(null));
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
  });
}

function compareVersions(a, b) {
  if (!a || !b) return 0;
  const pa = a.replace(/^v/, "").split(".").map(Number);
  const pb = b.replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

function isGitRepo(dir) {
  try {
    const gitDir = path.join(dir, ".git");
    return fs.existsSync(gitDir);
  } catch {
    return false;
  }
}

function findProjectRoot() {
  let curr = __dirname;
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(path.join(curr, "package.json")) && fs.existsSync(path.join(curr, ".git"))) {
      return curr;
    }
    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  return null;
}

const HELP = `
Usage: ${pkg.name || "9router"} update [options]

Update ${pkg.name || "9router"} to the latest version.

Options:
  -c, --check    Check if an update is available without installing
  -f, --force    Force update even if already up to date
  --git          Force update using git pull and rebuild (in repo)
  --npm          Force update using npm global install
  -h, --help     Show this help message
`;

async function run(args = []) {
  if (args.includes("-h") || args.includes("--help")) {
    console.log(HELP.trim());
    return 0;
  }

  const checkOnly = args.includes("-c") || args.includes("--check");
  const force = args.includes("-f") || args.includes("--force");
  const forceGit = args.includes("--git");
  const forceNpm = args.includes("--npm");

  const currentVersion = pkg.version || "0.0.0";
  console.log(`\n🔍 Checking for updates... (current: v${currentVersion})`);

  const latestVersion = await fetchLatestNpmVersion(NPM_PACKAGE_NAME);
  const hasNpmUpdate = latestVersion ? compareVersions(latestVersion, currentVersion) > 0 : false;

  const projectRoot = findProjectRoot();
  const hasGit = Boolean(projectRoot && isGitRepo(projectRoot));

  if (latestVersion) {
    console.log(`📦 Latest published version on npm: v${latestVersion}`);
  }

  if (checkOnly) {
    if (hasNpmUpdate) {
      console.log(`\n⬆️  A new version is available: v${latestVersion} (current: v${currentVersion})`);
      console.log(`   Run '\x1b[33m${pkg.name || "9router"} update\x1b[0m' or '\x1b[33mnpm i -g 9router@latest\x1b[0m' to update.\n`);
    } else {
      console.log(`\n✅ You are running the latest npm version (v${currentVersion}).\n`);
    }
    return 0;
  }

  // Update strategy:
  // 1. If in git repository and not explicitly requested --npm:
  if (hasGit && !forceNpm) {
    console.log(`\n📁 Detected source repository at: ${projectRoot}`);
    console.log(`⬇️  Pulling latest changes from git...`);

    try {
      execSync("git pull origin master", {
        cwd: projectRoot,
        stdio: "inherit",
      });
    } catch (err) {
      try {
        console.log("Retrying with default git pull...");
        execSync("git pull", { cwd: projectRoot, stdio: "inherit" });
      } catch (pullErr) {
        console.error(`\n❌ git pull failed: ${pullErr.message}`);
        console.log(`Please resolve any git conflicts or use '--npm' to update via npm.`);
        return 1;
      }
    }

    console.log(`\n📦 Installing dependencies...`);
    try {
      execSync("npm install", {
        cwd: projectRoot,
        stdio: "inherit",
      });
    } catch (err) {
      console.warn(`⚠️ npm install had warnings: ${err.message}`);
    }

    console.log(`\n🔨 Building CLI distribution bundle...`);
    try {
      execSync("npm run build:cli", {
        cwd: projectRoot,
        stdio: "inherit",
      });
      console.log(`\n✅ Update completed successfully!`);
      console.log(`You can now run '\x1b[32m${pkg.name || "aris"}\x1b[0m' to start the server.\n`);
      return 0;
    } catch (buildErr) {
      console.error(`\n❌ Failed to build CLI bundle: ${buildErr.message}`);
      return 1;
    }
  }

  // 2. Global npm installation update
  const installCmd = `npm i -g ${NPM_PACKAGE_NAME}@latest --prefer-online`;
  console.log(`\n⬇️  Running npm global update:`);
  console.log(`   \x1b[33m${installCmd}\x1b[0m\n`);

  try {
    const isWin = process.platform === "win32";
    const res = spawnSync(isWin ? "npm.cmd" : "npm", ["i", "-g", `${NPM_PACKAGE_NAME}@latest`, "--prefer-online"], {
      stdio: "inherit",
      shell: isWin,
    });

    if (res.status === 0) {
      console.log(`\n✅ Successfully updated ${pkg.name || "9router"}!`);
      console.log(`Run '\x1b[32m${pkg.name || "aris"}\x1b[0m' to start.\n`);
      return 0;
    } else {
      console.error(`\n❌ npm update exited with code ${res.status}.`);
      if (process.platform !== "win32") {
        console.log(`Tip: If permission was denied, try running with sudo:`);
        console.log(`   \x1b[33msudo ${installCmd}\x1b[0m\n`);
      }
      return res.status || 1;
    }
  } catch (err) {
    console.error(`\n❌ Error running update: ${err.message}`);
    console.log(`You can manually update with:`);
    console.log(`   \x1b[33m${installCmd}\x1b[0m\n`);
    return 1;
  }
}

module.exports = {
  run,
  fetchLatestNpmVersion,
  compareVersions,
};
