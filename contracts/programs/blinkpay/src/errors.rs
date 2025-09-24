use anchor_lang::prelude::*;

#[error_code]
pub enum BlinkpayError {
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
