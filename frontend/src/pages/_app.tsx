import "../styles/globals.css";
import "../styles/solana-bg.css";
import type { AppProps } from "next/app";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";
import React, { useMemo } from "react";
import { clusterApiUrl } from "@solana/web3.js";
import Navbar from "../components/Navbar";
import { Toaster } from "react-hot-toast";

require("@solana/wallet-adapter-react-ui/styles.css");

export default function MyApp({ Component, pageProps }: AppProps) {
	const endpoint = useMemo(() => process.env.NEXT_PUBLIC_SOLANA_RPC || clusterApiUrl("devnet"), []);
	const wallets = useMemo(() => [new BackpackWalletAdapter()], []);
	return (
		<ConnectionProvider endpoint={endpoint}>
			<WalletProvider wallets={wallets} autoConnect>
				<WalletModalProvider>
					<Navbar />
					<Component {...pageProps} />
					<Toaster position="top-right" />
				</WalletModalProvider>
			</WalletProvider>
		</ConnectionProvider>
	);
}
