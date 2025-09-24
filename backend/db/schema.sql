-- Merchants
create table if not exists merchants (
  authority text primary key,
  merchant_pda text not null,
  display_name text
);

-- Payment requests (off-chain metadata for invoices)
create table if not exists payment_requests (
  request_id text primary key,
  merchant_owner text not null references merchants(authority) on delete cascade,
  amount bigint not null,
  mint text not null,
  description text,
  created_at timestamptz default now()
);

-- Receipts (mirror on-chain PDAs if desired)
create table if not exists receipts (
  receipt_id text primary key,
  payer text not null,
  merchant text not null,
  mint text not null,
  amount bigint not null,
  signature text,
  created_at timestamptz default now()
);

-- Walletless sessions
create table if not exists sessions (
  id uuid primary key,
  pubkey text not null,
  ua text,
  created_at timestamptz default now()
);
