import { useCallback, useMemo, useState, useEffect } from "react";
import BlinkButton from "../components/BlinkButton";
import PaymentSuccess from "../components/PaymentSuccess";
import { createPaymentBlink, createQuoteUSD, sendWebhook } from "../lib/api";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Transaction, PublicKey, SystemProgram } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { usePaymentStatus } from "../hooks/usePaymentStatus";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import * as anchor from "@coral-xyz/anchor";

const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID || "BLiNkPay11111111111111111111111111111111111";
const DEFAULT_USDC = process.env.NEXT_PUBLIC_USDC_MINT || "So11111111111111111111111111111111111111112";
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

const TOKENS = [
	{ symbol: "USDC", name: "USD Coin", mint: DEFAULT_USDC, decimals: 6 },
	{ symbol: "SOL", name: "Wrapped SOL", mint: "So11111111111111111111111111111111111111112", decimals: 9 },
];

export default function Pay() {
	const router = useRouter();
	const { connection } = useConnection();
	const { wallet, connect, connecting, connected, publicKey, select, wallets, ready } = useWallet();
	const [qr, setQr] = useState<string | undefined>();
	const [url, setUrl] = useState<string | undefined>();
	const [receiptPda, setReceiptPda] = useState<string | null>(null);
	const { status, signature } = usePaymentStatus(PROGRAM_ID, receiptPda);
	const [usd, setUsd] = useState<number>(1);
	const [quote, setQuote] = useState<{ quoteId: string; amountBaseUnits: number; expiry: number } | null>(null);
	const [token, setToken] = useState(TOKENS[0]);
	const [mounted, setMounted] = useState(false);

	// Fix hydration error by only rendering wallet-dependent content on client
	useEffect(() => {
		setMounted(true);
	}, []);

	// Debug wallet state
	useEffect(() => {
		console.log('Wallet state:', { 
			ready, 
			connected, 
			connecting, 
			wallet: wallet?.adapter?.name,
			publicKey: publicKey?.toBase58(),
			walletsCount: wallets.length
		});
	}, [ready, connected, connecting, wallet, publicKey, wallets.length]);

	// Deep link params
	const [dl, setDl] = useState<{ merchant?: string; amount?: number; mint?: string; requestId?: string } | null>(null);
	const [ttl, setTtl] = useState<number>(300);

	useEffect(() => {
		if (!router.isReady) return;
		const { merchant, amount, mint, requestId } = router.query as Record<string, string>;
		if (merchant && amount && mint) {
			const amt = parseInt(amount, 10);
			setDl({ merchant, amount: amt, mint, requestId });
			const tok = TOKENS.find(t => t.mint === mint) || TOKENS[0];
			setToken(tok);
		}
	}, [router.isReady]);

	useEffect(() => {
		let t: any;
		if (!quote) return;
		const now = Math.floor(Date.now() / 1000);
		const left = Math.max(0, quote.expiry - now);
		if (left === 0) setQuote(null);
		else t = setTimeout(() => setQuote(null), left * 1000);
		return () => t && clearTimeout(t);
	}, [quote]);

	useEffect(() => {
		if (!dl) return;
		const id = setInterval(() => setTtl(s => (s > 0 ? s - 1 : 0)), 1000);
		return () => clearInterval(id);
	}, [dl]);

	const requestQuote = useCallback(async () => {
		const q = await createQuoteUSD({ fiatAmount: usd, tokenMint: token.mint, tokenDecimals: token.decimals, ttlSeconds: 60 });
		setQuote(q);
		toast.success("Quote ready");
	}, [usd, token]);

	// Direct wallet payment function
	const payWithWallet = useCallback(async (merchantPubkey: string, amount: number, mint: string, requestId?: string) => {
		if (!publicKey || !wallet?.adapter?.signTransaction) {
			toast.error("Wallet not connected");
			return;
		}

		try {
			toast.loading("Building transaction...", { id: "wallet-pay" });
			
			// Get program and derive PDAs
			const programId = new PublicKey(PROGRAM_ID);
			const [merchantPda] = await PublicKey.findProgramAddress(
				[Buffer.from("merchant"), new PublicKey(merchantPubkey).toBuffer()],
				programId
			);
			
			const receiptId = requestId || `wallet-${Date.now()}`;
			const [receiptPda] = await PublicKey.findProgramAddress(
				[Buffer.from("receipt"), publicKey.toBuffer(), Buffer.from(receiptId)],
				programId
			);

			// Get ATAs
			const payerAta = await getAssociatedTokenAddress(new PublicKey(mint), publicKey);
			const merchantAta = await getAssociatedTokenAddress(new PublicKey(mint), new PublicKey(merchantPubkey));

			// Create transaction using backend
			const response = await axios.post(`${BACKEND}/payments/create-blink`, {
				merchantOwner: merchantPubkey,
				amount,
				mint,
				description: `Wallet payment ${receiptId}`,
				payer: publicKey.toBase58(),
				returnTx: true,
				requestId: receiptId
			});

			if (response.data.tx?.transactionBase64) {
				toast.loading("Signing transaction...", { id: "wallet-pay" });
				
				const txBuf = Buffer.from(response.data.tx.transactionBase64, "base64");
				const tx = Transaction.from(txBuf);
				const signed = await wallet.adapter.signTransaction(tx);
				
				toast.loading("Sending transaction...", { id: "wallet-pay" });
				const signature = await connection.sendRawTransaction(signed.serialize());
				await connection.confirmTransaction(signature, "confirmed");
				
				setReceiptPda(response.data.tx.receiptPda);
				toast.success("Payment successful!", { id: "wallet-pay" });
			}
		} catch (error) {
			console.error("Wallet payment failed:", error);
			toast.error("Payment failed: " + (error as Error).message, { id: "wallet-pay" });
		}
	}, [publicKey, wallet, connection]);

	const payFromDeepLink = useCallback(async () => {
		if (!dl) return;
		try {
		// If wallet is connected, use direct payment
		if (publicKey) {
			await payWithWallet(dl.merchant!, dl.amount!, dl.mint!, dl.requestId);
			return;
		}

		// If Phantom is installed but not connected, prompt connect for 1-click
		if (typeof window !== "undefined" && (window as any).solana?.isPhantom && connect) {
			await connect();
			if (publicKey) {
				await payWithWallet(dl.merchant!, dl.amount!, dl.mint!, dl.requestId);
				return;
			}
		}

			// Fallback to Blink payment
			const payer = wallet.publicKey?.toBase58();
			const body = { merchantOwner: dl.merchant!, amount: dl.amount!, mint: dl.mint!, description: `DeepLink ${dl.requestId || ''}`, payer, returnTx: !!payer, requestId: dl.requestId } as any;
			const res = await toast.promise(axios.post(`${BACKEND}/payments/create-blink`, body).then(r => r.data), { loading: "Preparing payment…", success: "Open wallet or scan QR", error: "Failed" });
			setUrl(res.blinkUrl);
			setQr(res.qr);
			if (payer && res.tx?.transactionBase64) {
				const txBuf = Buffer.from(res.tx.transactionBase64, "base64");
				const tx = Transaction.from(txBuf);
				const signed = await wallet.signTransaction?.(tx);
				if (signed) {
					const sig = await connection.sendRawTransaction(signed.serialize());
					setReceiptPda(res.tx.receiptPda);
					await connection.confirmTransaction(sig, "confirmed");
					toast.success("Payment sent");
				}
			}
		} catch (e) {
			toast.error("Payment failed to start");
		}
	}, [dl, publicKey, payWithWallet, connection]);

	// Auto-start when deep link present and wallet is connected
	useEffect(() => {
		if (dl && publicKey && !receiptPda) {
			payFromDeepLink();
		}
	}, [dl, publicKey]);

	const onClick = useCallback(async () => {
		const amount = quote?.amountBaseUnits || Math.pow(10, token.decimals);
		const merchantPubkey = dl?.merchant || "11111111111111111111111111111111";
		
		// If wallet is connected, use direct payment
		if (publicKey) {
			await payWithWallet(merchantPubkey, amount, token.mint, `coffee-${Date.now()}`);
			return;
		}

		// Fallback to Blink payment
		const payer = publicKey?.toBase58();
		const res = await createPaymentBlink({ merchantOwner: merchantPubkey, amount, mint: token.mint, description: `Coffee $${usd}`, payer, returnTx: !!payer });
		setUrl(res.blinkUrl);
		setQr(res.qr);
		if (payer && res.tx?.transactionBase64) {
			const txBuf = Buffer.from(res.tx.transactionBase64, "base64");
			const tx = Transaction.from(txBuf);
			const signed = await wallet.signTransaction?.(tx);
			if (signed) {
				const sig = await connection.sendRawTransaction(signed.serialize());
				setReceiptPda(res.tx.receiptPda);
				await connection.confirmTransaction(sig, "confirmed");
			}
		}
		return res;
	}, [publicKey, quote, usd, token, dl, payWithWallet, connection]);

	useEffect(() => {
		(async () => {
			if (status !== "confirmed" || !receiptPda) return;
			toast.success("Payment confirmed");
			try {
				await sendWebhook({
					url: process.env.NEXT_PUBLIC_WEBHOOK_URL || "http://localhost:8787/echo",
					secret: process.env.NEXT_PUBLIC_WEBHOOK_SECRET || "demo-secret",
					idempotencyKey: receiptPda,
					payload: { type: "PaymentCompleted", receipt: receiptPda, signature },
				});
			} catch {}
		})();
	}, [status, receiptPda, signature]);

	function copyLink() {
		if (!url) return;
		navigator.clipboard.writeText(url);
		toast.success("Blink link copied");
	}
	function saveQr() {
		if (!qr) return;
		const a = document.createElement("a");
		a.href = qr;
		a.download = `blinkpay-qr.png`;
		a.click();
	}

	const deepAmountHuman = useMemo(() => {
		if (!dl) return null;
		const dec = TOKENS.find(t => t.mint === dl.mint)?.decimals || 6;
		return (dl.amount! / Math.pow(10, dec)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 9 });
	}, [dl]);

	// Show payment success page when payment is confirmed
	if (status === "confirmed" && signature && receiptPda) {
		return (
			<PaymentSuccess
				merchant={dl?.merchant || "11111111111111111111111111111111"}
				amount={dl?.amount || quote?.amountBaseUnits || 0}
				mint={dl?.mint || token.mint}
				requestId={dl?.requestId}
				signature={signature}
				expiresAt={dl ? Math.floor(Date.now() / 1000) + ttl : undefined}
				onPayAgain={() => {
					setReceiptPda(null);
					setUrl(undefined);
					setQr(undefined);
					setQuote(null);
				}}
			/>
		);
	}

	return (
		<div className="max-w-5xl mx-auto p-6">
			<div className="container-card mt-10">
				<h1 className="text-3xl font-bold mb-2">{dl ? "Checkout" : "Buy Coffee"}</h1>
				{dl && (
					<div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<div className="text-slate-400 text-sm">Merchant</div>
							<div className="font-semibold break-all">{dl.merchant}</div>
							<div className="text-slate-400 text-sm mt-3">Amount</div>
							<div className="font-semibold">{deepAmountHuman} {TOKENS.find(t => t.mint === dl.mint)?.symbol || "TOKEN"}</div>
							<div className="text-slate-400 text-sm mt-3">Request</div>
							<div className="font-mono text-xs break-all">{dl.requestId || "-"}</div>
							{ttl > 0 && <div className="mt-3 text-sm">Expires in {Math.floor(ttl/60)}:{String(ttl%60).padStart(2,'0')}</div>}
						</div>
						<div className="flex flex-col items-start gap-3">
							{mounted ? (
								wallet.connected ? (
									<button 
										onClick={payFromDeepLink} 
										className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
									>
										<span>💳 Pay with {wallet.wallet?.adapter.name}</span>
									</button>
								) : (
									<button 
										onClick={payFromDeepLink} 
										className="btn-primary"
									>
										{typeof window !== 'undefined' && (window as any).solana?.isPhantom ? "Connect & Pay" : "Generate Blink"}
									</button>
								)
							) : (
								<button 
									onClick={payFromDeepLink} 
									className="btn-primary"
								>
									Generate Blink
								</button>
							)}
							{url && <button onClick={copyLink} className="btn-secondary">Copy Link</button>}
							{qr && <button onClick={saveQr} className="btn-secondary">Save QR</button>}
							{url && <a className="text-indigo-400 underline" href={url} target="_blank" rel="noreferrer">Open Blink</a>}
							{qr && <img src={qr} className="mt-2 w-60 h-60 rounded-lg border border-slate-800" />}
						</div>
					</div>
				)}

				{!dl && (
					<>
						<p className="text-slate-300 mb-6">Pay in one tap with Solana Blinks, or connect your wallet to sign directly.</p>
						<div className="flex items-end gap-3 mb-4 flex-wrap">
							<div>
								<label className="label">USD</label>
								<input type="number" value={usd} onChange={(e) => setUsd(parseFloat(e.target.value || "0"))} className="input w-32" />
							</div>
							<div>
								<label className="label">Token</label>
								<select value={token.symbol} onChange={(e) => setToken(TOKENS.find(t => t.symbol === e.target.value) || TOKENS[0])} className="input w-44">
									{TOKENS.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
								</select>
							</div>
							<button onClick={requestQuote} className="btn-secondary">Get Quote</button>
							{quote && <span className="text-sm text-slate-400">Quote: {quote.amountBaseUnits} base units · expires {new Date(quote.expiry*1000).toLocaleTimeString()}</span>}
						</div>
						<p className="mb-4">{status === "confirmed" ? "Payment confirmed!" : "Click to pay or scan QR."}</p>
						<div className="flex gap-3 items-center flex-wrap">
							{mounted ? (
								!ready ? (
									<div className="flex items-center space-x-2 text-gray-400">
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
										<span>Loading wallets...</span>
									</div>
								) : connected ? (
									<button
										onClick={onClick}
										className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
									>
										<span>💳 Pay with {wallet?.adapter.name}</span>
									</button>
								) : wallet ? (
									<>
										<BlinkButton label="Pay with Blink" onClick={onClick} />
										<button
											onClick={async () => {
												try {
													if (!ready) {
														toast.error("Wallet not ready. Please try again.");
														return;
													}
													if (connect) {
														await connect();
													} else {
														toast.error("Wallet not available");
													}
												} catch (error) {
													console.error("Wallet connection error:", error);
													toast.error("Failed to connect wallet");
												}
											}}
											disabled={connecting || !connect || !ready}
											className="bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-indigo-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											<span>
												{!ready ? "⏳ Wallet Loading..." : 
												 connecting ? "🔄 Connecting..." : 
												 "🔗 Connect Wallet"}
											</span>
										</button>
									</>
								) : (
									<>
										<BlinkButton label="Pay with Blink" onClick={onClick} />
										<button
											onClick={() => {
												if (!ready) {
													toast.error("Wallets not ready. Please try again.");
													return;
												}
												if (wallets.length > 0) {
													select(wallets[0].adapter.name);
												} else {
													toast.error("No wallets available");
												}
											}}
											disabled={!ready}
											className="bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-indigo-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											<span>{!ready ? "⏳ Loading Wallets..." : "🔗 Select Wallet"}</span>
										</button>
									</>
								)
							) : (
								<BlinkButton label="Pay with Blink" onClick={onClick} />
							)}
						</div>
						{url && <a className="text-indigo-400 underline block mt-4" href={url} target="_blank" rel="noreferrer">Open Blink</a>}
						{qr && <img src={qr} className="mt-4 w-60 h-60 rounded-lg border border-slate-800" />}
						{signature && <p className="mt-4 text-sm text-slate-400">Tx: {signature}</p>}
					</>
				)}
			</div>
		</div>
	);
}
