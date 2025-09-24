import { createClient } from "supabase";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!url || !key) {
	console.warn("Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
}
const client = url && key ? createClient(url, key) : null;

export const db = {
	async upsertMerchant({ authority, display_name, merchant_pda }) {
		if (!client) return { authority, display_name, merchant_pda };
		await client.from("merchants").upsert({ authority, display_name, merchant_pda });
		return { authority, display_name, merchant_pda };
	},
	async createPaymentRequest({ merchant_owner, amount, mint, description, request_id }) {
		const id = request_id || `req-${Date.now()}`;
		if (!client) return { request_id: id, merchant_owner, amount, mint, description };
		await client.from("payment_requests").insert({ request_id: id, merchant_owner, amount, mint, description });
		return { request_id: id, merchant_owner, amount, mint, description };
	},
	async createSession({ id, pubkey, ua }) {
		if (!client) return { id, pubkey, ua };
		await client.from("sessions").insert({ id, pubkey, ua });
		return { id, pubkey, ua };
	},
};
