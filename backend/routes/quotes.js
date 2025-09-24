import { Router } from "express";
import Joi from "joi";
import { createQuote } from "../services/quotes.js";

export const router = Router();

const schema = Joi.object({
	fiatCurrency: Joi.string().valid("USD").default("USD"),
	fiatAmount: Joi.number().positive().required(),
	tokenMint: Joi.string().required(),
	tokenDecimals: Joi.number().integer().min(0).max(12).default(6),
	ttlSeconds: Joi.number().integer().min(15).max(600).default(60),
});

router.post("/create", async (req, res) => {
	try {
		const { value, error } = schema.validate(req.body);
		if (error) return res.status(400).json({ error: error.message });
		const quote = await createQuote(value);
		res.json(quote);
	} catch (e) {
		res.status(500).json({ error: String(e) });
	}
});
