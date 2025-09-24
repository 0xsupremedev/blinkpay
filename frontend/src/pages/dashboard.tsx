import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import TopBar from "../components/TopBar";
import Card from "../components/Card";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";
import { useState } from "react";
import { createPaymentBlink } from "../lib/api";
import toast from "react-hot-toast";

const TOKENS = [
	{ symbol: "USDC", name: "USD Coin", mint: process.env.NEXT_PUBLIC_USDC_MINT || "So11111111111111111111111111111111111111112", decimals: 6 },
	{ symbol: "SOL", name: "Wrapped SOL", mint: "So11111111111111111111111111111111111111112", decimals: 9 },
	{ symbol: "USDT", name: "Tether", mint: "Es9vMFrzaC...", decimals: 6 },
];

export default function Dashboard() {
	const [open, setOpen] = useState(false);
	const [recipient, setRecipient] = useState("");
	const [amount, setAmount] = useState("");
	const [token, setToken] = useState(TOKENS[0].symbol);
	const [numRecipients, setNumRecipients] = useState("1");
	const [split, setSplit] = useState(false);
	const [blinkUrl, setBlinkUrl] = useState<string | undefined>();
	const [qr, setQr] = useState<string | undefined>();

	async function onGenerate() {
		try {
			if (!recipient) return toast.error("Recipient/merchant owner is required");
			const tok = TOKENS.find(t => t.symbol === token)!;
			const baseUnits = Math.round(parseFloat(amount || "0") * Math.pow(10, tok.decimals));
			if (!baseUnits || baseUnits <= 0) return toast.error("Enter a valid amount");
			const res = await toast.promise(
				createPaymentBlink({ merchantOwner: recipient, amount: baseUnits, mint: tok.mint, description: `Dashboard link ${amount} ${tok.symbol}` }),
				{ loading: "Generating Blink…", success: "Payment link ready", error: "Failed to generate" }
			);
			setBlinkUrl(res.blinkUrl);
			setQr(res.qr);
		} catch (e) {
			toast.error("Error creating link");
		}
	}

	return (
		<div className="max-w-7xl mx-auto p-6 flex gap-6">
			<Sidebar />
			<main className="flex-1 flex flex-col gap-4">
				<TopBar />
				<h1 className="text-2xl font-bold">Quick Stats</h1>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					<StatCard title="Total Revenue (USDC)" value="$1,234,567.89" />
					<StatCard title="Active Payments" value="45" />
					<StatCard title="Pending / Failed" value="3 / 1" />
					<StatCard title="Split Collected" value="$543.21" />
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
					<Card className="lg:col-span-2">
						<div className="font-semibold mb-2">Recent Transactions</div>
						<table className="w-full text-sm">
							<thead className="text-slate-500">
								<tr>
									<th className="text-left py-2">Timestamp</th>
									<th className="text-left py-2">Merchant</th>
									<th className="text-left py-2">Amount</th>
									<th className="text-left py-2">Token</th>
									<th className="text-left py-2">Receipt</th>
									<th className="text-left py-2">Status</th>
								</tr>
							</thead>
							<tbody>
								<tr className="border-t border-slate-200 dark:border-slate-800"><td className="py-2">2024-07-23 14:30</td><td>Coffee Shop A</td><td>15.00</td><td>USDC</td><td>a48f…jl5</td><td><StatusBadge status="success" /></td></tr>
								<tr className="border-t border-slate-200 dark:border-slate-800"><td className="py-2">2024-07-23 14:20</td><td>Online Store</td><td>25.99</td><td>USDC</td><td>a182…qZ9</td><td><StatusBadge status="failed" /></td></tr>
							</tbody>
						</table>
					</Card>
					<Card>
						<div className="font-semibold mb-2">BlinkPay Actions</div>
						<div className="flex flex-col gap-2">
							<button onClick={() => setOpen(true)} className="btn-primary">Create Payment</button>
							<button className="btn-secondary">Refund Partial</button>
							<div className="text-sm text-slate-500">Scan to Pay with Blink</div>
							<div className="bg-slate-200 dark:bg-slate-800 h-40 rounded" />
						</div>
					</Card>
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
					<Card className="lg:col-span-2"><div className="h-48 flex items-center justify-center text-slate-400">Payments per Day (Chart)</div></Card>
					<Card><div className="h-48 flex items-center justify-center text-slate-400">Token Distribution (Donut)</div></Card>
				</div>
			</main>
			<Modal open={open} onClose={() => setOpen(false)} title="Create New Payment">
				<div className="space-y-3">
					<div>
						<label className="label">Recipient Address (SOL/SPL Token)</label>
						<input className="input w-full" placeholder="Recipient Address (SOL/SPL Token)" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
					</div>
					<div>
						<label className="label">Amount ({token})</label>
						<input className="input w-full" placeholder="10.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
					</div>
					<div>
						<label className="label">Token</label>
						<select className="input w-full" value={token} onChange={(e) => setToken(e.target.value)}>
							{TOKENS.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
						</select>
					</div>
					<div>
						<label className="label">Number of Recipients</label>
						<input className="input w-full" placeholder="1" value={numRecipients} onChange={(e) => setNumRecipients(e.target.value)} />
					</div>
					<div className="flex items-center gap-2">
						<label className="label mb-0">Split Payment</label>
						<input type="checkbox" className="w-5 h-5" checked={split} onChange={(e) => setSplit(e.target.checked)} />
					</div>
					<div className="flex gap-2 justify-end pt-2">
						<button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
						<button className="btn-primary" onClick={onGenerate}>Generate Payment Link</button>
					</div>
					{blinkUrl && (
						<div className="mt-4 space-y-2">
							<a className="text-indigo-400 underline" href={blinkUrl} target="_blank" rel="noreferrer">Open Blink</a>
							{qr && <img src={qr} className="mt-2 w-40 h-40 rounded-lg border border-slate-800" />}
						</div>
					)}
				</div>
			</Modal>
		</div>
	);
}
