export const WEEKLY_PAYMENT = 65;
export const TOTAL_WEEKS = 70;
export const MAX_SCORE = 700;
export const STARTING_SCORE = 200;

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function round6(n) {
  return Math.round((Number(n) + Number.EPSILON) * 1e6) / 1e6;
}

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, x-cron-secret",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      ...extraHeaders,
    },
  });
}

export function error(message, status = 400, code) {
  return json({ error: message, code }, status);
}

export function parseBody(request) {
  if (request.method === "GET" || request.method === "DELETE") return {};
  return request.json().catch(() => ({}));
}

export class HttpError extends Error {
  constructor(message, status = 400, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function require(condition, message, status = 400, code) {
  if (!condition) throw new HttpError(message, status, code);
}

export function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
