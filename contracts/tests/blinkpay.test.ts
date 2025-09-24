import * as anchor from "@coral-xyz/anchor";
import { Program, web3, BN } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount, mintTo, getAccount } from "@solana/spl-token";

// Types inferred via IDL if generated; for now use any

describe("blinkpay", () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);
	const connection = provider.connection;
	const wallet = provider.wallet as anchor.Wallet;

	let program: Program<any>;
	let merchantOwner: Keypair;
	let merchantPda: PublicKey;
	let usdcMint: PublicKey;
	let payer: Keypair;
	let payerAta: PublicKey;
	let merchantAta: PublicKey;

	before(async () => {
		program = new Program<any>(require("../target/idl/blinkpay.json"), new PublicKey("BLiNkPay11111111111111111111111111111111111"), provider);
		merchantOwner = Keypair.generate();
		await connection.confirmTransaction(await connection.requestAirdrop(merchantOwner.publicKey, web3.LAMPORTS_PER_SOL * 2));
		payer = Keypair.generate();
		await connection.confirmTransaction(await connection.requestAirdrop(payer.publicKey, web3.LAMPORTS_PER_SOL * 2));

		usdcMint = await createMint(connection, wallet.payer as any, wallet.publicKey, null, 6);
		const payerAtaAcc = await getOrCreateAssociatedTokenAccount(connection, wallet.payer as any, usdcMint, payer.publicKey);
		payerAta = payerAtaAcc.address;
		const merchantAtaAcc = await getOrCreateAssociatedTokenAccount(connection, wallet.payer as any, usdcMint, merchantOwner.publicKey);
		merchantAta = merchantAtaAcc.address;
		await mintTo(connection, wallet.payer as any, usdcMint, payerAta, wallet.payer as any, 5_000_000); // 5 USDC
	});

	it("initialize merchant", async () => {
		[merchantPda] = await PublicKey.findProgramAddress(
			[Buffer.from("merchant"), merchantOwner.publicKey.toBuffer()],
			program.programId
		);
		await program.methods.initializeMerchant(null).accounts({
			merchantAuthority: merchantOwner.publicKey,
			merchant: merchantPda,
			systemProgram: web3.SystemProgram.programId,
		}).signers([merchantOwner]).rpc();
	});

	it("create request and enforce amount/mint", async () => {
		const reqId = `coffee-${Date.now()}`;
		const [requestPda] = await PublicKey.findProgramAddress(
			[Buffer.from("request"), merchantPda.toBuffer(), Buffer.from(reqId)],
			program.programId
		);
		await program.methods.createRequest(reqId, new BN(1_000_000), usdcMint, null).accounts({
			merchantAuthority: merchantOwner.publicKey,
			merchant: merchantPda,
			request: requestPda,
			systemProgram: web3.SystemProgram.programId,
		}).signers([merchantOwner]).rpc();
	});

	it("pay 1 USDC and record receipt", async () => {
		const amount = 1_000_000; // 1 USDC
		const receiptId = `rcpt-${Date.now()}`;
		const [receiptPda] = await PublicKey.findProgramAddress(
			[Buffer.from("receipt"), payer.publicKey.toBuffer(), Buffer.from(receiptId)],
			program.programId
		);

		const balBeforePayer = Number((await getAccount(connection, payerAta)).amount);
		const balBeforeMerchant = Number((await getAccount(connection, merchantAta)).amount);

		await program.methods.pay(receiptId, new BN(amount)).accounts({
			payer: payer.publicKey,
			request: web3.SystemProgram.programId, // optional none
			merchant: merchantPda,
			merchantOwner: merchantOwner.publicKey,
			receipt: receiptPda,
			payerAta,
			merchantAta,
			mint: usdcMint,
			tokenProgram: TOKEN_PROGRAM_ID,
			systemProgram: web3.SystemProgram.programId,
		}).signers([payer]).rpc();

		const balAfterPayer = Number((await getAccount(connection, payerAta)).amount);
		const balAfterMerchant = Number((await getAccount(connection, merchantAta)).amount);
		if (balBeforePayer - balAfterPayer !== amount) throw new Error("payer balance did not decrease by amount");
		if (balAfterMerchant - balBeforeMerchant !== amount) throw new Error("merchant balance did not increase by amount");
	});

	it("refund back 1 USDC", async () => {
		// For simplicity, reuse previous receiptId pattern
		const amount = 1_000_000;
		const receiptId = `rcpt-${Date.now()}`;
		const [receiptPda] = await PublicKey.findProgramAddress(
			[Buffer.from("receipt"), payer.publicKey.toBuffer(), Buffer.from(receiptId)],
			program.programId
		);
		// Make a payment first
		await program.methods.pay(receiptId, new BN(amount)).accounts({
			payer: payer.publicKey,
			request: web3.SystemProgram.programId,
			merchant: merchantPda,
			merchantOwner: merchantOwner.publicKey,
			receipt: receiptPda,
			payerAta,
			merchantAta,
			mint: usdcMint,
			tokenProgram: TOKEN_PROGRAM_ID,
			systemProgram: web3.SystemProgram.programId,
		}).signers([payer]).rpc();

		const beforePayer = Number((await getAccount(connection, payerAta)).amount);
		const beforeMerchant = Number((await getAccount(connection, merchantAta)).amount);

		await program.methods.refund().accounts({
			merchantAuthority: merchantOwner.publicKey,
			merchant: merchantPda,
			merchantAta,
			payerAta,
			receipt: receiptPda,
			tokenProgram: TOKEN_PROGRAM_ID,
		}).signers([merchantOwner]).rpc();

		const afterPayer = Number((await getAccount(connection, payerAta)).amount);
		const afterMerchant = Number((await getAccount(connection, merchantAta)).amount);
		if (afterPayer - beforePayer !== amount) throw new Error("payer did not receive refund");
		if (beforeMerchant - afterMerchant !== amount) throw new Error("merchant did not send refund");
	});
});
