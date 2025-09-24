import crypto from "crypto";

const DEFAULT_DECIMALS = 6;

export async function createQuote({ fiatCurrency = "USD", fiatAmount, tokenMint, tokenDecimals = DEFAULT_DECIMALS, ttlSeconds = 60 }: { fiatCurrency?: string; fiatAmount: number; tokenMint: string; tokenDecimals?: number; ttlSeconds?: number; }) {
	if (fiatCurrency !== "USD") throw new Error("Only USD supported in demo");
	const rate = 1.0;
	const amountTokens = fiatAmount * rate;
	const amountBaseUnits = Math.round(amountTokens * Math.pow(10, tokenDecimals));
	const now = Math.floor(Date.now() / 1000);
	const expiry = now + ttlSeconds;
	const quoteId = `q_${crypto.randomUUID()}`;
	return { quoteId, fiatCurrency, fiatAmount, tokenMint, tokenDecimals, rate, amountBaseUnits, expiry };
}
