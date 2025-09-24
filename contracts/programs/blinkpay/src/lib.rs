use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("BLiNkPay11111111111111111111111111111111111");

#[program]
pub mod blinkpay {
	use super::*;

	pub fn initialize_merchant(
		ctx: Context<InitializeMerchant>,
		display_name: Option<String>,
	) -> Result<()> {
		let merchant = &mut ctx.accounts.merchant;
		merchant.owner = *ctx.accounts.merchant_authority.key;
		merchant.display_name = display_name;
		merchant.bump = *ctx.bumps.get("merchant").unwrap();
		Ok(())
	}

	pub fn create_request(
		ctx: Context<CreateRequest>,
		request_id: String,
		amount: u64,
		mint: Pubkey,
		expires_at: Option<i64>,
	) -> Result<()> {
		require!(request_id.len() > 0 && request_id.len() <= 64, ErrorCode::InvalidRequestId);
		let req = &mut ctx.accounts.request;
		req.merchant = ctx.accounts.merchant.key();
		req.request_id = request_id;
		req.amount = amount;
		req.mint = mint;
		req.expires_at = expires_at;
		req.bump = *ctx.bumps.get("request").unwrap();
		Ok(())
	}

	pub fn pay(
		ctx: Context<Pay>,
		receipt_id: String,
		expected_amount: u64,
	) -> Result<()> {
		require!(receipt_id.len() > 0 && receipt_id.len() <= 64, ErrorCode::InvalidReceiptId);

		if !ctx.accounts.request.to_account_info().data_is_empty() {
			let request_acc: Account<PaymentRequest> = Account::try_from(&ctx.accounts.request)?;
			require!(request_acc.merchant == ctx.accounts.merchant.key(), ErrorCode::RequestMerchantMismatch);
			require!(request_acc.mint == ctx.accounts.mint.key(), ErrorCode::RequestMintMismatch);
			if let Some(expires) = request_acc.expires_at {
				let now = Clock::get()?.unix_timestamp;
				require!(now <= expires, ErrorCode::RequestExpired);
			}
			require!(request_acc.amount == expected_amount, ErrorCode::AmountMismatch);
		}

		require!(ctx.accounts.payer_ata.mint == ctx.accounts.mint.key(), ErrorCode::MintMismatch);
		require!(ctx.accounts.merchant_ata.mint == ctx.accounts.mint.key(), ErrorCode::MintMismatch);

		let cpi_accounts = Transfer {
			from: ctx.accounts.payer_ata.to_account_info(),
			to: ctx.accounts.merchant_ata.to_account_info(),
			authority: ctx.accounts.payer.to_account_info(),
		};
		let cpi_program = ctx.accounts.token_program.to_account_info();
		let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
		token::transfer(cpi_ctx, expected_amount)?;

		let receipt = &mut ctx.accounts.receipt;
		receipt.merchant = ctx.accounts.merchant.key();
		receipt.payer = ctx.accounts.payer.key();
		receipt.mint = ctx.accounts.mint.key();
		receipt.amount = expected_amount;
		receipt.request = if ctx.accounts.request.to_account_info().data_is_empty() { None } else { Some(ctx.accounts.request.key()) };
		receipt.bump = *ctx.bumps.get("receipt").unwrap();
		receipt.receipt_id = receipt_id.clone();
		receipt.timestamp = Clock::get()?.unix_timestamp;

		emit!(PaymentCompleted {
			receipt: ctx.accounts.receipt.key(),
			merchant: receipt.merchant,
			payer: receipt.payer,
			amount: receipt.amount,
			mint: receipt.mint,
			timestamp: receipt.timestamp,
		});

		Ok(())
	}

	pub fn pay_with_split(
		ctx: Context<PayWithSplit>,
		receipt_id: String,
		expected_amount: u64,
		fee_bps: u16,
	) -> Result<()> {
		require!(receipt_id.len() > 0 && receipt_id.len() <= 64, ErrorCode::InvalidReceiptId);
		require!(fee_bps <= 10_000, ErrorCode::InvalidFeeBps);

		if !ctx.accounts.request.to_account_info().data_is_empty() {
			let request_acc: Account<PaymentRequest> = Account::try_from(&ctx.accounts.request)?;
			require!(request_acc.merchant == ctx.accounts.merchant.key(), ErrorCode::RequestMerchantMismatch);
			require!(request_acc.mint == ctx.accounts.mint.key(), ErrorCode::RequestMintMismatch);
			if let Some(expires) = request_acc.expires_at {
				let now = Clock::get()?.unix_timestamp;
				require!(now <= expires, ErrorCode::RequestExpired);
			}
			require!(request_acc.amount == expected_amount, ErrorCode::AmountMismatch);
		}

		require!(ctx.accounts.payer_ata.mint == ctx.accounts.mint.key(), ErrorCode::MintMismatch);
		require!(ctx.accounts.merchant_ata.mint == ctx.accounts.mint.key(), ErrorCode::MintMismatch);
		require!(ctx.accounts.platform_ata.mint == ctx.accounts.mint.key(), ErrorCode::MintMismatch);

		let fee_amount = (expected_amount as u128)
			.checked_mul(fee_bps as u128)
			.unwrap()
			.checked_div(10_000)
			.unwrap() as u64;
		let merchant_amount = expected_amount.checked_sub(fee_amount).unwrap();

		let cpi_program = ctx.accounts.token_program.to_account_info();
		// transfer fee to platform
		let cpi_fee = CpiContext::new(cpi_program.clone(), Transfer {
			from: ctx.accounts.payer_ata.to_account_info(),
			to: ctx.accounts.platform_ata.to_account_info(),
			authority: ctx.accounts.payer.to_account_info(),
		});
		if fee_amount > 0 { token::transfer(cpi_fee, fee_amount)?; }
		// transfer remainder to merchant
		let cpi_merch = CpiContext::new(cpi_program, Transfer {
			from: ctx.accounts.payer_ata.to_account_info(),
			to: ctx.accounts.merchant_ata.to_account_info(),
			authority: ctx.accounts.payer.to_account_info(),
		});
		if merchant_amount > 0 { token::transfer(cpi_merch, merchant_amount)?; }

		let receipt = &mut ctx.accounts.receipt;
		receipt.merchant = ctx.accounts.merchant.key();
		receipt.payer = ctx.accounts.payer.key();
		receipt.mint = ctx.accounts.mint.key();
		receipt.amount = expected_amount;
		receipt.request = if ctx.accounts.request.to_account_info().data_is_empty() { None } else { Some(ctx.accounts.request.key()) };
		receipt.bump = *ctx.bumps.get("receipt").unwrap();
		receipt.receipt_id = receipt_id.clone();
		receipt.timestamp = Clock::get()?.unix_timestamp;

		emit!(PaymentCompleted {
			receipt: ctx.accounts.receipt.key(),
			merchant: receipt.merchant,
			payer: receipt.payer,
			amount: receipt.amount,
			mint: receipt.mint,
			timestamp: receipt.timestamp,
		});
		Ok(())
	}

	pub fn refund(ctx: Context<Refund>) -> Result<()> {
		let cpi_accounts = Transfer {
			from: ctx.accounts.merchant_ata.to_account_info(),
			to: ctx.accounts.payer_ata.to_account_info(),
			authority: ctx.accounts.merchant_authority.to_account_info(),
		};
		let cpi_program = ctx.accounts.token_program.to_account_info();
		let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
		token::transfer(cpi_ctx, ctx.accounts.receipt.amount)?;
		Ok(())
	}

	pub fn refund_partial(ctx: Context<Refund>, amount: u64) -> Result<()> {
		require!(amount > 0, ErrorCode::InvalidAmount);
		let cpi_accounts = Transfer {
			from: ctx.accounts.merchant_ata.to_account_info(),
			to: ctx.accounts.payer_ata.to_account_info(),
			authority: ctx.accounts.merchant_authority.to_account_info(),
		};
		let cpi_program = ctx.accounts.token_program.to_account_info();
		let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
		token::transfer(cpi_ctx, amount)?;
		Ok(())
	}
}

#[derive(Accounts)]
#[instruction(display_name: Option<String>)]
pub struct InitializeMerchant<'info> {
	#[account(mut)]
	pub merchant_authority: Signer<'info>,
	#[account(
		init,
		payer = merchant_authority,
		space = 8 + Merchant::MAX_SIZE,
		seeds = [b"merchant", merchant_authority.key().as_ref()],
		bump
	)]
	pub merchant: Account<'info, Merchant>,
	pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(request_id: String, amount: u64, mint: Pubkey, expires_at: Option<i64>)]
pub struct CreateRequest<'info> {
	#[account(mut)]
	pub merchant_authority: Signer<'info>,
	#[account(
		mut,
		seeds = [b"merchant", merchant_authority.key().as_ref()],
		bump = merchant.bump,
	)]
	pub merchant: Account<'info, Merchant>,
	#[account(
		init,
		payer = merchant_authority,
		space = 8 + PaymentRequest::MAX_SIZE,
		seeds = [b"request", merchant.key().as_ref(), request_id.as_bytes()],
		bump
	)]
	pub request: Account<'info, PaymentRequest>,
	pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(receipt_id: String, expected_amount: u64)]
pub struct Pay<'info> {
	#[account(mut)]
	pub payer: Signer<'info>,
	/// Optional PaymentRequest account; may be empty
	pub request: UncheckedAccount<'info>,
	#[account(
		seeds = [b"merchant", merchant_owner.key().as_ref()],
		bump = merchant.bump
	)]
	pub merchant: Account<'info, Merchant>,
	/// Merchant owner pubkey used to derive Merchant PDA
	pub merchant_owner: UncheckedAccount<'info>,
	#[account(
		init,
		payer = payer,
		space = 8 + PaymentReceipt::MAX_SIZE,
		seeds = [b"receipt", payer.key().as_ref(), receipt_id.as_bytes()],
		bump
	)]
	pub receipt: Account<'info, PaymentReceipt>,
	#[account(mut, constraint = payer_ata.owner == payer.key() @ ErrorCode::PayerAtaOwnerMismatch)]
	pub payer_ata: Account<'info, TokenAccount>,
	#[account(mut, constraint = merchant_ata.owner == merchant_owner.key() @ ErrorCode::MerchantAtaOwnerMismatch)]
	pub merchant_ata: Account<'info, TokenAccount>,
	pub mint: Account<'info, Mint>,
	pub token_program: Program<'info, Token>,
	pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(receipt_id: String, expected_amount: u64, fee_bps: u16)]
pub struct PayWithSplit<'info> {
	#[account(mut)]
	pub payer: Signer<'info>,
	pub request: UncheckedAccount<'info>,
	#[account(
		seeds = [b"merchant", merchant_owner.key().as_ref()],
		bump = merchant.bump
	)]
	pub merchant: Account<'info, Merchant>,
	pub merchant_owner: UncheckedAccount<'info>,
	#[account(
		init,
		payer = payer,
		space = 8 + PaymentReceipt::MAX_SIZE,
		seeds = [b"receipt", payer.key().as_ref(), receipt_id.as_bytes()],
		bump
	)]
	pub receipt: Account<'info, PaymentReceipt>,
	#[account(mut, constraint = payer_ata.owner == payer.key() @ ErrorCode::PayerAtaOwnerMismatch)]
	pub payer_ata: Account<'info, TokenAccount>,
	#[account(mut, constraint = merchant_ata.owner == merchant_owner.key() @ ErrorCode::MerchantAtaOwnerMismatch)]
	pub merchant_ata: Account<'info, TokenAccount>,
	#[account(mut)]
	pub platform_ata: Account<'info, TokenAccount>,
	pub mint: Account<'info, Mint>,
	pub token_program: Program<'info, Token>,
	pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Refund<'info> {
	#[account(mut)]
	pub merchant_authority: Signer<'info>,
	#[account(
		mut,
		seeds = [b"merchant", merchant_authority.key().as_ref()],
		bump = merchant.bump,
	)]
	pub merchant: Account<'info, Merchant>,
	#[account(mut)]
	pub merchant_ata: Account<'info, TokenAccount>,
	#[account(mut)]
	pub payer_ata: Account<'info, TokenAccount>,
	#[account(mut)]
	pub receipt: Account<'info, PaymentReceipt>,
	pub token_program: Program<'info, Token>,
}

#[account]
pub struct Merchant {
	pub owner: Pubkey,
	pub display_name: Option<String>,
	pub bump: u8,
}
impl Merchant {
	pub const MAX_SIZE: usize = 32 + 4 + 64 + 1;
}

#[account]
pub struct PaymentRequest {
	pub merchant: Pubkey,
	pub request_id: String,
	pub amount: u64,
	pub mint: Pubkey,
	pub expires_at: Option<i64>,
	pub bump: u8,
}
impl PaymentRequest {
	pub const MAX_SIZE: usize = 32 + 4 + 64 + 8 + 32 + 1 + 8 + 1;
}

#[account]
pub struct PaymentReceipt {
	pub merchant: Pubkey,
	pub payer: Pubkey,
	pub mint: Pubkey,
	pub amount: u64,
	pub request: Option<Pubkey>,
	pub bump: u8,
	pub receipt_id: String,
	pub timestamp: i64,
}
impl PaymentReceipt {
	pub const MAX_SIZE: usize = 32 + 32 + 32 + 8 + 1 + 32 + 1 + 4 + 64 + 8;
}

#[event]
pub struct PaymentCompleted {
	pub receipt: Pubkey,
	pub merchant: Pubkey,
	pub payer: Pubkey,
	pub amount: u64,
	pub mint: Pubkey,
	pub timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
	#[msg("Invalid request id")] InvalidRequestId,
	#[msg("Invalid receipt id")] InvalidReceiptId,
	#[msg("Request expired")] RequestExpired,
	#[msg("Amount mismatch")] AmountMismatch,
	#[msg("Request merchant mismatch")] RequestMerchantMismatch,
	#[msg("Request mint mismatch")] RequestMintMismatch,
	#[msg("Mint mismatch for token accounts")] MintMismatch,
	#[msg("Payer ATA owner mismatch")] PayerAtaOwnerMismatch,
	#[msg("Merchant ATA owner mismatch")] MerchantAtaOwnerMismatch,
	#[msg("Invalid fee bps")] InvalidFeeBps,
	#[msg("Invalid amount")] InvalidAmount,
}
