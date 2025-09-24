use anchor_lang::prelude::*;

#[event]
pub struct PaymentCompleted {
	pub receipt: Pubkey,
	pub merchant: Pubkey,
	pub payer: Pubkey,
	pub amount: u64,
	pub mint: Pubkey,
	pub timestamp: i64,
}
