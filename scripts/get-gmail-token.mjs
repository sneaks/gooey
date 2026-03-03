/**
 * One-time Gmail OAuth setup script.
 *
 * Usage:
 *   node scripts/get-gmail-token.mjs path/to/client_secret.json
 *
 * What it does:
 *   1. Reads your downloaded OAuth credentials JSON from Google Cloud Console
 *   2. Starts a local server on port 3000 to catch the redirect
 *   3. Opens your browser to Google's consent screen
 *   4. Captures the auth code automatically
 *   5. Exchanges it for a refresh token
 *   6. Prints the GMAIL_CREDENTIALS value to paste into your .env
 */

import fs from "fs";
import http from "http";
import { exec } from "child_process";
import { google } from "googleapis";

const REDIRECT_URI = "http://localhost:3000";
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
];

// --- Read credentials file ---
const credsPath = process.argv[2];
if (!credsPath) {
  console.error("\n❌  Usage: node scripts/get-gmail-token.mjs path/to/client_secret.json\n");
  process.exit(1);
}

let raw;
try {
  raw = JSON.parse(fs.readFileSync(credsPath, "utf-8"));
} catch {
  console.error(`\n❌  Could not read ${credsPath} — make sure the path is correct.\n`);
  process.exit(1);
}

// Cloud Console downloads either { "installed": {...} } or { "web": {...} }
const creds = raw.installed ?? raw.web;
if (!creds?.client_id || !creds?.client_secret) {
  console.error("\n❌  Credentials file doesn't look right — download it fresh from Cloud Console.\n");
  process.exit(1);
}

const { client_id, client_secret } = creds;

// --- Build OAuth client ---
const oauth2Client = new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent", // force refresh_token even if previously authorised
});

// --- Start local server to catch the redirect ---
console.log("\n🌐  Starting local server on http://localhost:3000 ...");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost:3000");
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<h2 style="font-family:sans-serif;color:red">❌ ${error}</h2><p>You can close this tab.</p>`);
    console.error(`\n❌  Google returned an error: ${error}\n`);
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Waiting...");
    return;
  }

  // Exchange code for tokens
  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
      <h2 style="font-family:sans-serif;color:green">✅ Authorised!</h2>
      <p style="font-family:sans-serif">You can close this tab and check your terminal.</p>
    `);

    const result = JSON.stringify({
      client_id,
      client_secret,
      refresh_token: tokens.refresh_token,
    });

    console.log("\n✅  Success! Add this to your .env file:\n");
    console.log(`GMAIL_CREDENTIALS=${result}`);
    console.log("\n");

    server.close();
  } catch (err) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<h2 style="font-family:sans-serif;color:red">❌ Token exchange failed</h2><pre>${err.message}</pre>`);
    console.error("\n❌  Token exchange failed:", err.message, "\n");
    server.close();
    process.exit(1);
  }
});

server.listen(3000, () => {
  console.log("✅  Server ready.\n");
  console.log("🔑  Opening browser for Google sign-in...\n");

  // Open browser cross-platform
  const cmd =
    process.platform === "darwin" ? `open "${authUrl}"` :
    process.platform === "win32" ? `start "" "${authUrl}"` :
    `xdg-open "${authUrl}"`;

  exec(cmd, (err) => {
    if (err) {
      console.log("⚠️   Couldn't open browser automatically. Go here manually:\n");
      console.log(authUrl + "\n");
    }
  });
});
