import QRCode from "qrcode";

const FRONTEND_BASE = process.env.FRONTEND_BASE_URL || "http://localhost:3000";

export async function generateBlinkLogin({ sessionId, pubkey }) {
	const url = `${FRONTEND_BASE}/login?sessionId=${encodeURIComponent(sessionId)}&pubkey=${encodeURIComponent(pubkey)}`;
	const qrDataUrl = await QRCode.toDataURL(url);
	return { url, qrDataUrl };
}

export async function generatePaymentBlink({ merchantOwner, amount, mint, requestId }) {
	const url = `${FRONTEND_BASE}/pay?merchant=${encodeURIComponent(merchantOwner)}&amount=${amount}&mint=${encodeURIComponent(mint)}&requestId=${encodeURIComponent(requestId)}`;
	const qrDataUrl = await QRCode.toDataURL(url);
	return { url, qrDataUrl };
}
