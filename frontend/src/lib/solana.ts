import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";

export const RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || clusterApiUrl("devnet");
export const connection = new Connection(RPC, "confirmed");

export function parseQueryParam(name: string): string | null {
	if (typeof window === "undefined") return null;
	const params = new URLSearchParams(window.location.search);
	return params.get(name);
}

export function isValidPubkey(s: string): boolean {
	try {
		new PublicKey(s);
		return true;
	} catch {
		return false;
	}
}
