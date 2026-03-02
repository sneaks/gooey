/**
 * Tracks active agent sessions by runId for cleanup.
 * Phase 1: simple map. Will grow with multi-agent support.
 */

export interface ManagedSession {
  runId: string;
  abort: () => void;
  createdAt: number;
}

const sessions = new Map<string, ManagedSession>();

export function registerSession(session: ManagedSession): void {
  sessions.set(session.runId, session);
}

export function removeSession(runId: string): void {
  sessions.delete(runId);
}

export function abortSession(runId: string): void {
  const session = sessions.get(runId);
  if (session) {
    session.abort();
    sessions.delete(runId);
  }
}

export function abortAll(): void {
  for (const session of sessions.values()) {
    session.abort();
  }
  sessions.clear();
}

export function getActiveCount(): number {
  return sessions.size;
}
