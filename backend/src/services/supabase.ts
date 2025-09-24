import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL as string | undefined;
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY) as string | undefined;
const client = url && key ? createClient(url, key) : null;

export const db = {
	async upsertMerchant({ authority, display_name, merchant_pda }: { authority: string; display_name?: string | null; merchant_pda: string; }) {
		if (!client) return { authority, display_name, merchant_pda };
		await client.from("merchants").upsert({ authority, display_name, merchant_pda });
		return { authority, display_name, merchant_pda };
	},
	async createPaymentRequest({ merchant_owner, amount, mint, description, request_id }: { merchant_owner: string; amount: number; mint: string; description?: string; request_id: string; }) {
		const id = request_id || `req-${Date.now()}`;
		if (!client) return { request_id: id, merchant_owner, amount, mint, description };
		await client.from("payment_requests").insert({ request_id: id, merchant_owner, amount, mint, description });
		return { request_id: id, merchant_owner, amount, mint, description };
	},
	async createSession({ id, pubkey, ua }: { id: string; pubkey: string; ua?: string; }) {
		if (!client) return { id, pubkey, ua };
		await client.from("sessions").insert({ id, pubkey, ua });
		return { id, pubkey, ua };
	},
	async upsertReceipt(r: { receipt_id: string; payer: string; merchant: string; mint: string; amount: number; signature?: string }) {
		if (!client) return r;
		await client.from("receipts").upsert(r);
		return r;
	},
	async listReceipts({ merchant }: { merchant: string }) {
		if (!client) return [] as any[];
		const { data, error } = await client.from("receipts").select("*").eq("merchant", merchant).order("created_at", { ascending: false });
		if (error) throw error;
		return data || [];
	},
	async dashboardStats({ merchant }: { merchant: string }) {
		if (!client) return { revenue: 0, active: 0, pending: 0, failed: 0, split: 0 };
		const { data: rev } = await client.rpc("sum_revenue_by_merchant", { m: merchant });
		const { data: pending } = await client.from("receipts").select("count(*)", { count: "exact", head: true }).eq("merchant", merchant).is("signature", null);
		const { data: failed } = await client.from("receipts").select("count(*)", { count: "exact", head: true }).eq("merchant", merchant).eq("status", "failed");
		return { revenue: rev || 0, active: 0, pending: (pending as any)?.length || 0, failed: (failed as any)?.length || 0, split: 0 };
	},
};
