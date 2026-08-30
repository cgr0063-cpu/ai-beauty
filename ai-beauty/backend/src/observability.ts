import crypto from "node:crypto";
import type express from "express";

function safeError(error: unknown) {
  if (error instanceof Error) return { name: error.name, message: error.message };
  return { name: "UnknownError", message: String(error) };
}

export function logEvent(level: "info" | "warn" | "error", event: string, fields: Record<string, unknown> = {}) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    ...fields,
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export function logError(event: string, error: unknown, fields: Record<string, unknown> = {}) {
  logEvent("error", event, { ...fields, error: safeError(error) });
}

export function requestTelemetry(req: express.Request, res: express.Response, next: express.NextFunction) {
  const incoming = req.header("x-request-id")?.trim() || "";
  const requestId = /^[A-Za-z0-9._:-]{8,128}$/.test(incoming) ? incoming : crypto.randomUUID();
  const started = Date.now();
  res.locals.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  res.on("finish", () => {
    logEvent(res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info", "http_request", {
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - started,
      userId: typeof res.locals.userId === "string" ? res.locals.userId : undefined,
    });
  });
  next();
}

export function notFoundHandler(req: express.Request, res: express.Response) {
  res.status(404).json({ error: "not_found", requestId: res.locals.requestId });
}

export function errorHandler(error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) {
  logError("unhandled_request_error", error, { requestId: res.locals.requestId });
  if (res.headersSent) return;
  res.status(500).json({ error: "internal_error", requestId: res.locals.requestId });
}
