import type { ClientMessage, ServerMessage } from "../shared/protocol";

const WS_URL = "ws://localhost:4242";
const RECONNECT_DELAY = 3000;

type MessageHandler = (msg: ServerMessage) => void;
type StatusHandler = (status: "connected" | "disconnected" | "connecting") => void;

let ws: WebSocket | null = null;
let messageHandler: MessageHandler | null = null;
let statusHandler: StatusHandler | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let stopped = false;

function connect(): void {
  if (stopped) return;
  if (ws?.readyState === WebSocket.OPEN || ws?.readyState === WebSocket.CONNECTING) {
    return;
  }

  statusHandler?.("connecting");

  try {
    ws = new WebSocket(WS_URL);
  } catch {
    statusHandler?.("disconnected");
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    console.log("[ws] Connected to", WS_URL);
    statusHandler?.("connected");
  };

  ws.onmessage = (event) => {
    try {
      const msg: ServerMessage = JSON.parse(event.data);
      messageHandler?.(msg);
    } catch (err) {
      console.warn("[ws] Failed to parse message:", err);
    }
  };

  ws.onclose = () => {
    console.log("[ws] Disconnected");
    statusHandler?.("disconnected");
    ws = null;
    scheduleReconnect();
  };

  ws.onerror = () => {
    // onclose will fire after this, which handles reconnect
  };
}

function scheduleReconnect(): void {
  if (stopped || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, RECONNECT_DELAY);
}

export function initWebSocket(
  onMessage: MessageHandler,
  onStatus?: StatusHandler,
): void {
  messageHandler = onMessage;
  statusHandler = onStatus ?? null;
  stopped = false;
  connect();
}

export function sendMessage(msg: ClientMessage): void {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  } else {
    console.warn("[ws] Cannot send — not connected");
  }
}

export function isConnected(): boolean {
  return ws?.readyState === WebSocket.OPEN;
}

export function disconnectWebSocket(): void {
  stopped = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  ws?.close();
  ws = null;
}
