import type { ExecutionStep } from "../../shared/execution/types";
import type { ExecutionContext } from "./index";

/**
 * Gmail node executor.
 * Uses the googleapis SDK with OAuth2 refresh-token auth.
 *
 * Credentials env var must contain a JSON string:
 *   { "client_id": "...", "client_secret": "...", "refresh_token": "..." }
 *
 * Actions:
 *   list  — fast metadata fetch (id, threadId, snippet, subject, from, date)
 *   read  — full message including decoded plain-text body
 *   send  — compose and send an email
 */
export async function executeGmail(
  step: ExecutionStep,
  ctx: ExecutionContext,
): Promise<Record<string, any>> {
  const { google } = await import("googleapis");

  // --- Auth ---
  const credEnvVar = step.config.credentialsEnvVar ?? "GMAIL_CREDENTIALS";
  const credRaw = process.env[credEnvVar];
  if (!credRaw) {
    throw new Error(
      `Gmail: env var "${credEnvVar}" is not set. ` +
      `Set it to a JSON string: {"client_id":"...","client_secret":"...","refresh_token":"..."}`
    );
  }

  let creds: { client_id: string; client_secret: string; refresh_token: string };
  try {
    creds = JSON.parse(credRaw);
  } catch {
    throw new Error(`Gmail: "${credEnvVar}" is not valid JSON.`);
  }

  if (!creds.client_id || !creds.client_secret || !creds.refresh_token) {
    throw new Error(`Gmail: credentials JSON must have client_id, client_secret, and refresh_token.`);
  }

  const auth = new google.auth.OAuth2(creds.client_id, creds.client_secret);
  auth.setCredentials({ refresh_token: creds.refresh_token });

  const gmail = google.gmail({ version: "v1", auth });

  const action = step.config.action ?? "list";

  // --- Resolve input port (used as body for send, or as query override for read/list) ---
  const inputRef = step.inputs["input"];
  const inputValue = inputRef
    ? ctx.nodeOutputs.get(inputRef.sourceNodeId)?.[inputRef.sourcePortId]
    : undefined;

  ctx.send({
    type: "stream_token",
    nodeId: step.nodeId,
    token: `📧 Gmail: ${action}...\n`,
  });

  // --- LIST ---
  if (action === "list") {
    const query = String(inputValue ?? step.config.query ?? "is:unread");
    const maxResults = Number(step.config.maxResults ?? 10);

    const listRes = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults,
    });

    const messages = listRes.data.messages ?? [];
    if (messages.length === 0) {
      ctx.send({ type: "stream_token", nodeId: step.nodeId, token: "  ↳ No messages found\n" });
      return { result: [], trigger: true };
    }

    // Fetch minimal metadata for each message (much faster than full get)
    const metaPromises = messages.map((m) =>
      gmail.users.messages.get({
        userId: "me",
        id: m.id!,
        format: "metadata",
        metadataHeaders: ["Subject", "From", "Date"],
      })
    );
    const metaResults = await Promise.all(metaPromises);

    const result = metaResults.map((r) => {
      const headers = r.data.payload?.headers ?? [];
      const get = (name: string) => headers.find((h) => h.name === name)?.value ?? "";
      return {
        id: r.data.id,
        threadId: r.data.threadId,
        snippet: r.data.snippet,
        subject: get("Subject"),
        from: get("From"),
        date: get("Date"),
      };
    });

    ctx.send({ type: "stream_token", nodeId: step.nodeId, token: `  ↳ ${result.length} messages\n` });
    return { result, trigger: true };
  }

  // --- READ ---
  if (action === "read") {
    const query = String(inputValue ?? step.config.query ?? "is:unread");
    const maxResults = Number(step.config.maxResults ?? 10);

    const listRes = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults,
    });

    const messages = listRes.data.messages ?? [];
    if (messages.length === 0) {
      ctx.send({ type: "stream_token", nodeId: step.nodeId, token: "  ↳ No messages found\n" });
      return { result: [], trigger: true };
    }

    const fullPromises = messages.map((m) =>
      gmail.users.messages.get({ userId: "me", id: m.id!, format: "full" })
    );
    const fullResults = await Promise.all(fullPromises);

    const result = fullResults.map((r) => {
      const headers = r.data.payload?.headers ?? [];
      const get = (name: string) => headers.find((h) => h.name === name)?.value ?? "";
      const body = extractPlainText(r.data.payload);
      return {
        id: r.data.id,
        threadId: r.data.threadId,
        snippet: r.data.snippet,
        subject: get("Subject"),
        from: get("From"),
        date: get("Date"),
        body,
      };
    });

    ctx.send({ type: "stream_token", nodeId: step.nodeId, token: `  ↳ ${result.length} messages (full body)\n` });
    return { result, trigger: true };
  }

  // --- SEND ---
  if (action === "send") {
    const to = String(step.config.to ?? "").trim();
    const subject = String(step.config.subject ?? "").trim();
    const bodyText = String(inputValue ?? step.config.body ?? "").trim();

    if (!to) throw new Error("Gmail send: 'To' address is required.");
    if (!subject) throw new Error("Gmail send: 'Subject' is required.");

    // Compose RFC 2822 message
    const raw = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset=utf-8`,
      `MIME-Version: 1.0`,
      ``,
      bodyText,
    ].join("\r\n");

    const encoded = Buffer.from(raw).toString("base64url");

    const sendRes = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encoded },
    });

    const messageId = sendRes.data.id;
    ctx.send({ type: "stream_token", nodeId: step.nodeId, token: `  ↳ Sent (id: ${messageId})\n` });
    return { result: { messageId, to, subject }, trigger: true };
  }

  throw new Error(`Gmail: unknown action "${action}"`);
}

/**
 * Recursively extract plain text from a Gmail message payload.
 * Handles multipart messages by preferring text/plain parts.
 */
function extractPlainText(payload: any): string {
  if (!payload) return "";

  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf-8");
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractPlainText(part);
      if (text) return text;
    }
  }

  return "";
}
