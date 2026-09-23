import crypto from "crypto";
import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

let cachedCookieHeader = null;
let lastExtractTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

/**
 * Decrypt a single Chrome cookie buffer on macOS (AES-128-CBC with PBKDF2).
 */
function decryptChromeCookie(encryptedBuf, password) {
  if (!encryptedBuf || encryptedBuf.length < 3) return "";
  const prefix = encryptedBuf.slice(0, 3).toString();
  let raw = encryptedBuf;
  if (prefix === "v10" || prefix === "v11") {
    raw = encryptedBuf.slice(3);
  }

  const salt = "saltysalt";
  const key = crypto.pbkdf2Sync(password, salt, 1003, 16, "sha1");
  const iv = Buffer.alloc(16, " ");

  const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
  decipher.setAutoPadding(true);
  try {
    let decrypted = decipher.update(raw);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    const str = decrypted.toString("utf8");
    // Chrome v130+ on macOS has a 32-byte header before JSON payload
    const jsonIdx = str.indexOf("eyJ");
    if (jsonIdx !== -1) {
      return str.slice(jsonIdx);
    }

    // Filter non-printable characters
    for (let i = 0; i < decrypted.length; i++) {
      if (decrypted[i] >= 32 && decrypted[i] <= 126) {
        return decrypted.slice(i).toString("utf8");
      }
    }
    return str;
  } catch {
    return "";
  }
}

/**
 * Extract OxAlpha cookies directly from Chrome on macOS.
 * @returns {string|null} Cookie header string, or null if unavailable.
 */
export function extractChromeOxAlphaCookies(force = false) {
  if (process.platform !== "darwin") {
    return null;
  }

  const now = Date.now();
  if (!force && cachedCookieHeader && now - lastExtractTime < CACHE_TTL_MS) {
    return cachedCookieHeader;
  }

  const chromeCookiePath = path.join(
    os.homedir(),
    "Library/Application Support/Google/Chrome/Default/Cookies"
  );

  if (!fs.existsSync(chromeCookiePath)) {
    return null;
  }

  try {
    let password = "";
    try {
      password = execSync('security find-generic-password -w -s "Chrome Safe Storage"', {
        encoding: "utf8",
        timeout: 3000,
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      return null;
    }

    if (!password) return null;

    // Copy to temp directory to avoid database locking issues if Chrome is running
    const tmpCopy = path.join(os.tmpdir(), `ox_chrome_cookies_${now}.sqlite`);
    try {
      fs.copyFileSync(chromeCookiePath, tmpCopy);

      const query = `SELECT name, hex(encrypted_value) FROM cookies WHERE host_key LIKE '%oxalpha.com%';`;
      const output = execSync(`sqlite3 "${tmpCopy}" "${query}"`, {
        encoding: "utf8",
        timeout: 3000,
        stdio: ["ignore", "pipe", "ignore"],
      });

      const cookies = {};
      for (const line of output.trim().split("\n")) {
        if (!line) continue;
        const [name, hexVal] = line.split("|");
        if (!hexVal) continue;
        const buf = Buffer.from(hexVal, "hex");
        const val = decryptChromeCookie(buf, password);
        if (val) {
          cookies[name] = val;
        }
      }

      if (cookies["ox_alpha_session"]) {
        const header = Object.entries(cookies)
          .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
          .join("; ");
        cachedCookieHeader = header;
        lastExtractTime = now;
        return header;
      }
    } finally {
      try {
        fs.unlinkSync(tmpCopy);
      } catch {}
    }
  } catch {
    // Fail-open: do not crash caller if extraction fails
  }

  return null;
}

export default { extractChromeOxAlphaCookies };
