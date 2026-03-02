import "dotenv/config";
import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import fs from "fs/promises";
import path from "path";
import { GraphRunner } from "./graphRunner";
import type { ClientMessage } from "../shared/protocol";

const PORT = parseInt(process.env.GOOEY_PORT ?? "4242", 10);
const GRAPHS_DIR = path.resolve(process.env.GOOEY_GRAPHS_DIR ?? "./graphs");

const app = express();

// CORS for dev (Vite on :5173 → server on :4242)
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.use(express.json({ limit: "5mb" }));

// Ensure graphs directory exists
fs.mkdir(GRAPHS_DIR, { recursive: true }).catch(() => {});

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// --- Graph persistence endpoints ---

// List saved graphs
app.get("/api/graphs", async (_req, res) => {
  try {
    const files = await fs.readdir(GRAPHS_DIR);
    const graphs = files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""));
    res.json({ graphs });
  } catch {
    res.json({ graphs: [] });
  }
});

// Save graph
app.put("/api/graphs/:name", async (req, res) => {
  const name = req.params.name.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filePath = path.join(GRAPHS_DIR, `${name}.json`);
  await fs.writeFile(filePath, JSON.stringify(req.body, null, 2), "utf-8");
  res.json({ saved: name });
});

// Load graph
app.get("/api/graphs/:name", async (req, res) => {
  const name = req.params.name.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filePath = path.join(GRAPHS_DIR, `${name}.json`);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    res.json(JSON.parse(content));
  } catch {
    res.status(404).json({ error: "Graph not found" });
  }
});

// Delete graph
app.delete("/api/graphs/:name", async (req, res) => {
  const name = req.params.name.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filePath = path.join(GRAPHS_DIR, `${name}.json`);
  try {
    await fs.unlink(filePath);
    res.json({ deleted: name });
  } catch {
    res.status(404).json({ error: "Graph not found" });
  }
});

const server = app.listen(PORT, () => {
  console.log(`[gooey-server] HTTP on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });
console.log(`[gooey-server] WebSocket on ws://localhost:${PORT}`);

wss.on("connection", (ws: WebSocket) => {
  console.log("[gooey-server] Client connected");

  let runner: GraphRunner | null = null;

  ws.on("message", async (raw: Buffer) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      ws.send(JSON.stringify({ type: "error", nodeId: "", message: "Invalid JSON" }));
      return;
    }

    switch (msg.type) {
      case "run": {
        if (runner) {
          runner.stop();
        }
        runner = new GraphRunner(msg.graph, (serverMsg) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(serverMsg));
          }
        });
        try {
          await runner.run();
        } catch (err: any) {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "error", nodeId: "", message: err.message ?? String(err) }));
          }
        }
        break;
      }

      case "stop": {
        runner?.stop();
        runner = null;
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "done" }));
        }
        break;
      }

      case "gate_response": {
        runner?.resolveGate(msg.commandId, msg.approved);
        break;
      }
    }
  });

  ws.on("close", () => {
    console.log("[gooey-server] Client disconnected");
    runner?.stop();
    runner = null;
  });
});
