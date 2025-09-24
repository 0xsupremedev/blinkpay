use anchor_lang::prelude::*;

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
