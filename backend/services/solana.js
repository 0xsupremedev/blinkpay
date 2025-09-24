import { Connection, PublicKey, Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";

const RPC = process.env.SOLANA_RPC || "https://api.devnet.solana.com";
export const connection = new Connection(RPC, "confirmed");

export function createSessionKeypair() {
	const kp = Keypair.generate();
	return { publicKey: kp.publicKey.toBase58(), secret: Buffer.from(kp.secretKey).toString("base64") };
}

export async function initMerchantOnChain({ merchantAuthority, displayName }) {
	const programId = new PublicKey(process.env.BLINKPAY_PROGRAM_ID || "BLiNkPay11111111111111111111111111111111111");
	const [merchantPda] = await PublicKey.findProgramAddress(
		[Buffer.from("merchant"), new PublicKey(merchantAuthority).toBuffer()],
		programId
	);
	return { merchantPda: merchantPda.toBase58(), tx: null };
}

function getProgram() {
	const programId = new PublicKey(process.env.BLINKPAY_PROGRAM_ID || "BLiNkPay11111111111111111111111111111111111");
	const idl = require("../../contracts/target/idl/blinkpay.json");
	const provider = new anchor.AnchorProvider(connection, {} as any, {});
	return { program: new anchor.Program(idl, programId, provider), programId };
}

export async function buildPayTransaction({ payer, merchantOwner, mint, amount, receiptId }) {
	const { program, programId } = getProgram();
	const payerPk = new PublicKey(payer);
	const merchantOwnerPk = new PublicKey(merchantOwner);
	const mintPk = new PublicKey(mint);
	const [merchantPda] = await PublicKey.findProgramAddress([Buffer.from("merchant"), merchantOwnerPk.toBuffer()], programId);
	const [receiptPda] = await PublicKey.findProgramAddress([Buffer.from("receipt"), payerPk.toBuffer(), Buffer.from(receiptId)], programId);
	const payerAta = getAssociatedTokenAddressSync(mintPk, payerPk);
	const merchantAta = getAssociatedTokenAddressSync(mintPk, merchantOwnerPk);
	const ix = await program.methods.pay(receiptId, new anchor.BN(amount)).accounts({
		payer: payerPk,
		request: SystemProgram.programId,
		merchant: merchantPda,
		merchantOwner: merchantOwnerPk,
		receipt: receiptPda,
		payerAta,
		merchantAta,
		mint: mintPk,
		tokenProgram: TOKEN_PROGRAM_ID,
		systemProgram: SystemProgram.programId,
	}).instruction();
	const tx = new Transaction().add(ix);
	tx.feePayer = payerPk;
	const { blockhash } = await connection.getLatestBlockhash("finalized");
	tx.recentBlockhash = blockhash;
	const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
	return { transactionBase64: serialized.toString("base64"), receiptPda: receiptPda.toBase58(), merchantPda: merchantPda.toBase58(), payerAta: payerAta.toBase58(), merchantAta: merchantAta.toBase58() };
}

export async function buildPayWithSplitTransaction({ payer, merchantOwner, mint, amount, receiptId, feeBps, platform }) {
	const { program, programId } = getProgram();
	const payerPk = new PublicKey(payer);
	const merchantOwnerPk = new PublicKey(merchantOwner);
	const mintPk = new PublicKey(mint);
	const platformPk = new PublicKey(platform);
	const [merchantPda] = await PublicKey.findProgramAddress([Buffer.from("merchant"), merchantOwnerPk.toBuffer()], programId);
	const [receiptPda] = await PublicKey.findProgramAddress([Buffer.from("receipt"), payerPk.toBuffer(), Buffer.from(receiptId)], programId);
	const payerAta = getAssociatedTokenAddressSync(mintPk, payerPk);
	const merchantAta = getAssociatedTokenAddressSync(mintPk, merchantOwnerPk);
	const platformAta = getAssociatedTokenAddressSync(mintPk, platformPk);
	const ix = await program.methods.payWithSplit(receiptId, new anchor.BN(amount), feeBps).accounts({
		payer: payerPk,
		request: SystemProgram.programId,
		merchant: merchantPda,
		merchantOwner: merchantOwnerPk,
		receipt: receiptPda,
		payerAta,
		merchantAta,
		platformAta,
		mint: mintPk,
		tokenProgram: TOKEN_PROGRAM_ID,
		systemProgram: SystemProgram.programId,
	}).instruction();
	const tx = new Transaction().add(ix);
	tx.feePayer = payerPk;
	const { blockhash } = await connection.getLatestBlockhash("finalized");
	tx.recentBlockhash = blockhash;
	const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
	return { transactionBase64: serialized.toString("base64"), receiptPda: receiptPda.toBase58(), merchantPda: merchantPda.toBase58(), payerAta: payerAta.toBase58(), merchantAta: merchantAta.toBase58(), platformAta: platformAta.toBase58() };
}

export async function buildPartialRefundTransaction({ merchantAuthority, payer, mint, amount, receipt }) {
	const { program, programId } = getProgram();
	const merchAuth = new PublicKey(merchantAuthority);
	const payerPk = new PublicKey(payer);
	const mintPk = new PublicKey(mint);
	const [merchantPda] = await PublicKey.findProgramAddress([Buffer.from("merchant"), merchAuth.toBuffer()], programId);
	const payerAta = getAssociatedTokenAddressSync(mintPk, payerPk);
	const merchantAta = getAssociatedTokenAddressSync(mintPk, merchAuth);
	const receiptPk = new PublicKey(receipt);
	const ix = await program.methods.refundPartial(new anchor.BN(amount)).accounts({
		merchantAuthority: merchAuth,
		merchant: merchantPda,
		merchantAta,
		payerAta,
		receipt: receiptPk,
		tokenProgram: TOKEN_PROGRAM_ID,
	}).instruction();
	const tx = new Transaction().add(ix);
	tx.feePayer = merchAuth;
	const { blockhash } = await connection.getLatestBlockhash("finalized");
	tx.recentBlockhash = blockhash;
	const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
	return { transactionBase64: serialized.toString("base64") };
}

export async function verifySignature(signature) {
	try {
		const conf = await connection.getSignatureStatuses([signature]);
		return !!conf.value[0]?.confirmationStatus;
	} catch (e) {
		return false;
	}
}
