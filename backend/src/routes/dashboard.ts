import { Router } from "express";
import Joi from "joi";
import { db } from "../services/supabase";

export const router = Router();

router.get("/stats", async (req, res) => {
	try {
		const merchant = (req.query.merchant as string) || "";
		if (!merchant) return res.status(400).json({ error: "merchant required" });
		const stats = await db.dashboardStats({ merchant });
		res.json(stats);
	} catch (e: any) {
		res.status(500).json({ error: String(e) });
	}
});

router.get("/recent", async (req, res) => {
	try {
		const merchant = (req.query.merchant as string) || "";
		if (!merchant) return res.status(400).json({ error: "merchant required" });
		const rows = await db.listReceipts({ merchant });
		res.json(rows.slice(0, 10));
	} catch (e: any) {
		res.status(500).json({ error: String(e) });
	}
});

const saveSchema = Joi.object({
	receipt_id: Joi.string().required(),
	payer: Joi.string().required(),
	merchant: Joi.string().required(),
	mint: Joi.string().required(),
	amount: Joi.number().integer().required(),
	signature: Joi.string().optional(),
});

router.post("/save-receipt", async (req, res) => {
	try {
		const { value, error } = saveSchema.validate(req.body);
		if (error) return res.status(400).json({ error: error.message });
		const saved = await db.upsertReceipt(value);
		res.json(saved);
	} catch (e: any) {
		res.status(500).json({ error: String(e) });
	}
});
