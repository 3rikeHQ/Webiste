// "Own a 3rike" state for the driver app. Money (balance, payments, Auto-Pay)
// now lives in the backend; the KYC stage is cached here and synced to the API.

import { setVerificationStatus as syncVerificationStatus } from "./api";

export type VerificationStatus = "not_started" | "in_progress" | "approved" | "3riker";

export const VERIFICATION_STAGES: VerificationStatus[] = ["not_started", "in_progress", "approved", "3riker"];

export const WEEKLY_PAYMENT = 65;
export const TOTAL_WEEKS = 70;
export const MAX_SCORE = 700;
export const PLATE = "3rike T88-545";

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export type Payment = {
  id: string;
  amount: number;
  date: string;
  source: "manual" | "auto";
};

export type AutoPay = {
  amount: number;
  day: Weekday;
};

const STATUS_KEY = "verificationStatus";
const SCORE_KEY = "eligibleScore";
const BALANCE_KEY = "3rike.mainBalance";
const PAYMENTS_KEY = "3rike.payments";
const AUTOPAY_KEY = "3rike.autoPay";

// Demo money so Pay Now has something to draw from.
const STARTING_BALANCE = 500;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getVerificationStatus(): VerificationStatus {
  const status = localStorage.getItem(STATUS_KEY) as VerificationStatus | null;
  return status && VERIFICATION_STAGES.includes(status) ? status : "not_started";
}

export function setVerificationStatus(status: VerificationStatus) {
  localStorage.setItem(STATUS_KEY, status);
  void syncVerificationStatus(status).catch(() => {});
}

export function hydrateVerificationStatus(status: VerificationStatus) {
  localStorage.setItem(STATUS_KEY, status);
}

export function getScore() {
  const score = parseInt(localStorage.getItem(SCORE_KEY) ?? "", 10);
  return Number.isNaN(score) ? 200 : score;
}

export function setScore(score: number) {
  localStorage.setItem(SCORE_KEY, String(score));
}

export const getMainBalance = () => readJson(BALANCE_KEY, STARTING_BALANCE);
export const getPayments = () => readJson<Payment[]>(PAYMENTS_KEY, []);
export const getAutoPay = () => readJson<AutoPay | null>(AUTOPAY_KEY, null);

export function saveAutoPay(autoPay: AutoPay | null) {
  if (autoPay) writeJson(AUTOPAY_KEY, autoPay);
  else localStorage.removeItem(AUTOPAY_KEY);
}

// Debits the main account and records the payment. Every full week covered
// nudges the eligible score up.
export function payTowards3rike(amount: number, source: Payment["source"]): Payment {
  const balance = getMainBalance();
  if (!(amount > 0) || amount > balance) {
    throw new Error("Insufficient balance");
  }
  const payment: Payment = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    amount,
    date: new Date().toISOString(),
    source,
  };
  writeJson(BALANCE_KEY, Math.round((balance - amount) * 100) / 100);
  writeJson(PAYMENTS_KEY, [payment, ...getPayments()]);

  const weeksCovered = Math.floor(amount / WEEKLY_PAYMENT);
  if (weeksCovered > 0) setScore(Math.min(MAX_SCORE, getScore() + weeksCovered * 10));
  return payment;
}

// The next occurrence of `day`, never today, so a schedule set on a Monday
// for Mondays starts next week.
export function nextDebitDate(day: Weekday, from = new Date()) {
  const target = (WEEKDAYS.indexOf(day) + 1) % 7; // Date#getDay() counts from Sunday
  const date = new Date(from);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + ((target - date.getDay() + 7) % 7 || 7));
  return date;
}

export const formatUsd = (amount: number) =>
  `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatShortDate = (date: Date | string) =>
  new Date(date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
