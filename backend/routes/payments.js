import { Router } from "express";
import Joi from "joi";
import { generatePaymentBlink } from "../services/blink.js";
import { db } from "../services/supabase.js";
import { buildPayTransaction, buildPayWithSplitTransaction, buildPartialRefundTransaction } from "../services/solana.js";
import { v4 as uuidv4 } from "uuid";

export const router = Router();

const schema = Joi.object({
	merchantOwner: Joi.string().required(),
	amount: Joi.number().integer().min(1).required(),
	mint: Joi.string().required(),
	requestId: Joi.string().optional(),
	description: Joi.string().optional(),
	payer: Joi.string().optional(),
	returnTx: Joi.boolean().optional().default(false),
});

router.post("/create-blink", async (req, res) => {
	try {
		const { value, error } = schema.validate(req.body);
		if (error) return res.status(400).json({ error: error.message });
		const { merchantOwner, amount, mint, requestId, description, payer, returnTx } = value;
		const reqId = requestId || uuidv4();
		const request = await db.createPaymentRequest({ merchant_owner: merchantOwner, amount, mint, description, request_id: reqId });
		const { url, qrDataUrl } = await generatePaymentBlink({ merchantOwner, amount, mint, requestId: request.request_id });

		let tx;
		if (returnTx && payer) {
			const txBuild = await buildPayTransaction({ payer, merchantOwner, mint, amount, receiptId: `blink-${Date.now()}` });
			tx = txBuild;
		}
		res.json({ requestId: request.request_id, blinkUrl: url, qr: qrDataUrl, tx });
	} catch (e) {
		res.status(500).json({ error: String(e) });
	}
});

const splitSchema = Joi.object({
	merchantOwner: Joi.string().required(),
	amount: Joi.number().integer().min(1).required(),
	mint: Joi.string().required(),
	payer: Joi.string().required(),
	feeBps: Joi.number().integer().min(0).max(10000).required(),
	platform: Joi.string().required(),
	receiptId: Joi.string().optional(),
});

router.post("/build-pay-split", async (req, res) => {
	try {
		const { value, error } = splitSchema.validate(req.body);
		if (error) return res.status(400).json({ error: error.message });
		const { merchantOwner, amount, mint, payer, feeBps, platform, receiptId } = value;
		const tx = await buildPayWithSplitTransaction({ payer, merchantOwner, mint, amount, receiptId: receiptId || `split-${Date.now()}`, feeBps, platform });
		res.json(tx);
	} catch (e) {
		res.status(500).json({ error: String(e) });
	}
});

const refundSchema = Joi.object({
	merchantAuthority: Joi.string().required(),
	payer: Joi.string().required(),
	mint: Joi.string().required(),
	amount: Joi.number().integer().min(1).required(),
	receipt: Joi.string().required(),
});

router.post("/build-refund-partial", async (req, res) => {
	try {
		const { value, error } = refundSchema.validate(req.body);
		if (error) return res.status(400).json({ error: error.message });
		const tx = await buildPartialRefundTransaction(value);
		res.json(tx);
	} catch (e) {
		res.status(500).json({ error: String(e) });
	}
});
