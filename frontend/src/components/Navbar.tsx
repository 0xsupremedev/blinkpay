import Link from "next/link";
import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";

export default function Navbar() {
	const { connected, publicKey } = useWallet();
	const [mounted, setMounted] = useState(false);

	// Fix hydration error by only rendering wallet components on client
	useEffect(() => {
		setMounted(true);
	}, []);

	return (
		<nav className="w-full px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur sticky top-0 z-40">
			<div className="max-w-5xl mx-auto flex gap-4 items-center">
				<Link href="/"><span className="font-bold text-lg">☕ BlinkPay</span></Link>
				<div className="ml-auto flex gap-3 items-center">
					<ThemeToggle />
					{mounted && (
						<>
							<WalletMultiButton className="!bg-indigo-600 hover:!bg-indigo-700 !rounded-lg !text-white !font-semibold" />
							{connected && (
								<div className="text-sm text-gray-600 dark:text-gray-400">
									{publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}
								</div>
							)}
						</>
					)}
					<Link className="btn-secondary" href="/login">Login</Link>
					<Link className="btn-primary" href="/pay">Pay</Link>
				</div>
			</div>
		</nav>
	);
}
