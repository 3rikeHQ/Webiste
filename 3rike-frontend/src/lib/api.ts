const TOKEN_KEY = "3rike.token";

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  verificationStatus: string;
  score: number;
  hasPin: boolean;
};

export type Payment = {
  id: string;
  type: "payment" | "autopay" | "deposit" | "withdrawal";
  amount: number;
  status: string;
  source: string | null;
  createdAt: string;
};

export type AutoPay = {
  amount: number;
  weekday: string;
  lastDebitedAt?: string | null;
  createdAt?: string;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

async function request<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, {
    method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  let data: { error?: string; code?: string } & Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) {
    throw new ApiError(data.error || "Request failed", res.status, data.code);
  }
  return data as T;
}

export function register(payload: {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  password: string;
  pin?: string;
}) {
  return request<{ token: string; user: User; balance: number }>("/api/auth/register", { body: payload });
}

export function login(identifier: string, password: string) {
  return request<{ token: string; user: User; balance: number }>("/api/auth/login", {
    body: { identifier, password },
  });
}

export function me() {
  return request<{ user: User; balance: number; autopay: AutoPay | null }>("/api/me");
}

export function setWithdrawalPin(pin: string) {
  return request<{ ok: boolean }>("/api/me/pin", { body: { pin } });
}

export function getBalance() {
  return request<{ balance: number; usdc: number }>("/api/balance");
}

export function depositAddress() {
  return request<{ address: string }>("/api/deposit/address");
}

export function deposit(amount: number, method: "bank" | "crypto") {
  return request<{ balance: number; transaction: { id: string }; live: boolean }>("/api/deposit", {
    body: { amount, method },
  });
}

export function withdraw(payload: {
  amount: number;
  method: "bank" | "crypto";
  destination: Record<string, unknown>;
  pin: string;
}) {
  return request<{ balance: number; transaction: { id: string }; live: boolean }>("/api/withdraw", {
    body: payload,
  });
}

export function listPayments() {
  return request<{ payments: Payment[] }>("/api/payments");
}

export function payNow(amount: number) {
  return request<{ balance: number; score: number; transaction: { id: string } }>("/api/payments/pay", {
    body: { amount },
  });
}

export function getAutoPay() {
  return request<{ autopay: AutoPay | null }>("/api/autopay");
}

export function saveAutoPay(amount: number, weekday: string) {
  return request<{ autopay: AutoPay }>("/api/autopay", { body: { amount, weekday } });
}

export function clearAutoPay() {
  return request<{ autopay: null }>("/api/autopay", { method: "DELETE" });
}
