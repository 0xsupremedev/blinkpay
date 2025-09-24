import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export async function createBlinkLogin() {
	const { data } = await axios.post(`${BASE}/auth/blink-login`);
	return data;
}

export async function createPaymentBlink(params: { merchantOwner: string; amount: number; mint: string; requestId?: string; description?: string; payer?: string; returnTx?: boolean }) {
	const { data } = await axios.post(`${BASE}/payments/create-blink`, params);
	return data;
}

export async function registerMerchant(params: { merchantAuthority: string; displayName?: string | null }) {
	const { data } = await axios.post(`${BASE}/merchants/register`, params);
	return data;
}

export async function createQuoteUSD(params: { fiatAmount: number; tokenMint: string; tokenDecimals?: number; ttlSeconds?: number }) {
	const { data } = await axios.post(`${BASE}/quotes/create`, { fiatCurrency: "USD", ...params });
	return data as { quoteId: string; amountBaseUnits: number; expiry: number };
}

export async function sendWebhook(params: { url: string; secret: string; idempotencyKey: string; payload: any }) {
	const { data } = await axios.post(`${BASE}/webhooks/send`, params);
	return data;
}
