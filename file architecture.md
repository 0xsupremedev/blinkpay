Project Architecture & File Structure
blinkpay/
├── README.md
├── package.json
├── .gitignore
├── contracts/                # On-chain Solana program (Anchor)
│   ├── Cargo.toml
│   ├── Anchor.toml
│   └── programs/
│       └── blinkpay/
│           ├── Cargo.toml
│           └── src/
│               ├── lib.rs           # Anchor entry point
│               ├── instructions/    # Individual instruction handlers
│               │   ├── initialize_merchant.rs
│               │   ├── create_payment_request.rs
│               │   ├── pay.rs
│               │   └── close_request.rs
│               ├── state/           # PDA account structs
│               │   ├── merchant.rs
│               │   ├── payment_request.rs
│               │   └── receipt.rs
│               ├── errors.rs        # Custom program errors
│               └── events.rs        # Anchor event definitions
│
├── backend/                  # Node.js / Express API for Blinks
│   ├── package.json
│   ├── server.js             # Entry point
│   ├── routes/
│   │   ├── auth.js           # Sign-in with Blink
│   │   ├── payments.js       # Create payment blinks
│   │   └── merchants.js      # Merchant setup
│   ├── services/
│   │   ├── solana.js         # RPC + Anchor client helpers
│   │   ├── blink.js          # Blink (Action URL) generation
│   │   └── supabase.js       # Supabase DB service
│   ├── db/
│   │   ├── schema.sql        # DB schema (merchants, requests, receipts)
│   │   └── migrations/       # Versioned migrations
│   └── utils/
│       ├── validation.js     # Input validation
│       └── logger.js         # Logging util
│
├── frontend/                 # Next.js + Tailwind client app
│   ├── package.json
│   ├── next.config.js
│   ├── public/               # Static assets (logos, QR codes, etc.)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── index.tsx             # Landing page
│   │   │   ├── login.tsx             # “Sign in with Blink”
│   │   │   ├── pay.tsx               # Payment UI
│   │   │   └── merchant/[id].tsx     # Merchant dashboard
│   │   ├── components/
│   │   │   ├── BlinkButton.tsx       # Reusable 1-click Blink button
│   │   │   ├── QRCodeDisplay.tsx     # QR for mobile payments
│   │   │   └── Navbar.tsx
│   │   ├── hooks/
│   │   │   ├── useWallet.ts          # Wallet adapter integration
│   │   │   └── usePaymentStatus.ts   # Listen for events/receipts
│   │   ├── lib/
│   │   │   ├── api.ts                # API calls to backend
│   │   │   └── solana.ts             # Client-side Solana helpers
│   │   └── styles/
│   │       └── globals.css
│
├── mobile/ (optional)        # Solana Mobile Stack integration
│   ├── App.tsx (React Native / Expo)
│   └── utils/solana.ts
│
└── infra/                    # DevOps / deployment
    ├── docker-compose.yml    # Local stack (backend + supabase)
    ├── Dockerfile.backend
    ├── Dockerfile.frontend
    └── scripts/
        ├── deploy_program.sh # Anchor deploy helper
        └── seed_db.sh        # Seed merchants/test data

🔑 Architecture Overview
1. Contracts (Anchor)

Written in Rust using Anchor.

Organized by instructions/, state/, events/.

Emits PaymentCompleted events for frontend/backend to watch.

Secured via PDA seeds & Anchor constraints.

2. Backend (Node.js / Express)

Acts as the Blink resolver → generates Solana Action URLs.

Handles merchant onboarding, payment requests, and walletless sessions.

Uses Supabase (Postgres + REST API) for persistence.

Connects to Solana RPC & Anchor program via solana.js service.

3. Frontend (Next.js + Tailwind)

Provides clean UI (landing page, login, pay, merchant dashboard).

Integrates @solana/wallet-adapter for Phantom/Backpack.

Displays QR codes for mobile users.

Uses hooks to poll payment receipts via RPC or backend API.

4. Mobile (Optional, SMS)

If time allows, a React Native wrapper that uses Solana Mobile Stack for direct deep-links into Solana wallets.

Lets users click a Blink in Safari/Chrome on Saga and open the wallet instantly.

5. Infra

Dockerized stack for easy local dev (backend + supabase + frontend).

Scripts for program deploy and DB seeding.

👉 This structure makes it easy to demo fast:

Frontend → user clicks “Buy Coffee”.

Backend → generates Blink (Action URL).

Contracts → secure token transfer + receipt.

Supabase → stores merchant/request/receipt metadata.