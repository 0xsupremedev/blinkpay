import crypto from "crypto";

// For USDC we assume 1 USD ~= 1 USDC; for extensibility, allow override via env or external pricing later.
const DEFAULT_DECIMALS = 6;

export async function createQuote({ fiatCurrency = "USD", fiatAmount, tokenMint, tokenDecimals = DEFAULT_DECIMALS, ttlSeconds = 60 }) {
	if (fiatCurrency !== "USD") throw new Error("Only USD supported in demo");
	// 1 USD = 1 USDC for demo. In production, integrate CoinGecko or on-chain oracles.
	const rate = 1.0;
	const amountTokens = fiatAmount * rate;
	const amountBaseUnits = Math.round(amountTokens * Math.pow(10, tokenDecimals));
	const now = Math.floor(Date.now() / 1000);
	const expiry = now + ttlSeconds;
	const quoteId = `q_${crypto.randomUUID()}`;
	return { quoteId, fiatCurrency, fiatAmount, tokenMint, tokenDecimals, rate, amountBaseUnits, expiry };
}
