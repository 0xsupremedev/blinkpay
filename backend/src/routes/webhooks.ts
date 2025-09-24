import { Router } from "express";
import Joi from "joi";
import crypto from "crypto";

export const router = Router();

const pending = new Set<string>();
const used = new Set<string>();

function sign(body: any, secret: string) {
	return crypto.createHmac("sha256", secret).update(JSON.stringify(body)).digest("hex");
}

const schema = Joi.object({
	url: Joi.string().uri().required(),
	secret: Joi.string().required(),
	idempotencyKey: Joi.string().required(),
	payload: Joi.object().required(),
});

router.post("/send", async (req, res) => {
	try {
		const { value, error } = schema.validate(req.body);
		if (error) return res.status(400).json({ error: error.message });
		const { url, secret, idempotencyKey, payload } = value as any;
		if (used.has(idempotencyKey) || pending.has(idempotencyKey)) return res.json({ status: "ignored" });
		pending.add(idempotencyKey);
		const signature = sign(payload, secret);
		const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json", "x-blinkpay-signature": signature, "idempotency-key": idempotencyKey }, body: JSON.stringify(payload) });
		pending.delete(idempotencyKey);
		used.add(idempotencyKey);
		res.json({ status: r.ok ? "sent" : "failed", code: r.status });
	} catch (e: any) {
		res.status(500).json({ error: String(e) });
	}
});
