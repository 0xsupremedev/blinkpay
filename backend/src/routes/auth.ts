import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { createSessionKeypair } from "../services/solana";
import { generateBlinkLogin } from "../services/blink";
import { db } from "../services/supabase";

export const router = Router();

router.post("/blink-login", async (req, res) => {
	try {
		const userAgent = (req.headers["user-agent"] as string) || "unknown";
		const { publicKey } = createSessionKeypair();
		const sessionId = uuidv4();
		await db.createSession({ id: sessionId, pubkey: publicKey, ua: userAgent });
		const { url, qrDataUrl } = await generateBlinkLogin({ sessionId, pubkey: publicKey });
		res.json({ sessionId, pubkey: publicKey, blinkUrl: url, qr: qrDataUrl });
	} catch (e: any) {
		res.status(500).json({ error: String(e) });
	}
});
