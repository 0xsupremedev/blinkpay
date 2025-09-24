import { Router } from "express";
import Joi from "joi";
import { initMerchantOnChain } from "../services/solana";
import { db } from "../services/supabase";

export const router = Router();

const schema = Joi.object({
	merchantAuthority: Joi.string().required(),
	displayName: Joi.string().allow(null, "").optional(),
});

router.post("/register", async (req, res) => {
	try {
		const { value, error } = schema.validate(req.body);
		if (error) return res.status(400).json({ error: error.message });
		const { merchantAuthority, displayName } = value as any;
		const onchain = await initMerchantOnChain({ merchantAuthority, displayName });
		await db.upsertMerchant({ authority: merchantAuthority, display_name: displayName, merchant_pda: onchain.merchantPda });
		res.json({ merchantPda: onchain.merchantPda, tx: onchain.tx });
	} catch (e: any) {
		res.status(500).json({ error: String(e) });
	}
});
