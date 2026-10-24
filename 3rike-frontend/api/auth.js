import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { HttpError } from "./lib.js";

const JWT_SECRET = process.env.JWT_SECRET || "3rike-dev-secret-change-me";
const TOKEN_TTL = "30d";

export function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function userIdFromRequest(request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const payload = token ? verifyToken(token) : null;
  if (!payload || !payload.sub) {
    throw new HttpError("Unauthorized", 401, "unauthorized");
  }
  return payload.sub;
}

export function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    email: row.email,
    verificationStatus: row.verification_status,
    score: Number(row.eligible_score ?? 0),
    hasPin: !!row.withdrawal_pin,
  };
}
