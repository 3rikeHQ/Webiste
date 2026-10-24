const API_KEY = process.env.PAYCREST_API_KEY;
const BASE_URL = process.env.PAYCREST_BASE_URL || "https://api.paycrest.io";
const SENDER_ID = process.env.PAYCREST_SENDER_ID;

export const PAYCREST_LIVE = !!API_KEY;

export const DEPOSIT_ADDRESS =
  process.env.DEPOSIT_ADDRESS || "0x295cCa3BD7C8C854b7c52Bd7a0dCB10CfFffc44e";

async function postOrder(payload) {
  const res = await fetch(`${BASE_URL}/v2/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...(SENDER_ID ? { "X-Sender-Id": SENDER_ID } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Paycrest order failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function createOnrampOrder({ amount, currency = "USD" }) {
  if (!PAYCREST_LIVE) {
    return {
      id: `mock_${Date.now().toString(36)}`,
      status: "completed",
      mode: "mock",
      direction: "onramp",
      amount,
      currency,
      usdc: amount,
    };
  }
  const order = await postOrder({
    direction: "onramp",
    amount,
    currency,
    asset: "USDC",
    network: "base",
  });
  return { ...order, mode: "live" };
}

export async function createOfframpOrder({ amount, destination }) {
  if (!PAYCREST_LIVE) {
    return {
      id: `mock_${Date.now().toString(36)}`,
      status: "completed",
      mode: "mock",
      direction: "offramp",
      amount,
      usdc: amount,
    };
  }
  const order = await postOrder({
    direction: "offramp",
    amount,
    asset: "USDC",
    network: "base",
    destination,
  });
  return { ...order, mode: "live" };
}
