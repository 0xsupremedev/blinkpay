# BlinkPay - Solana-Powered Payments 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solana](https://img.shields.io/badge/Solana-14C294?style=flat&logo=solana&logoColor=white)](https://solana.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

BlinkPay is a revolutionary payment platform built on Solana that enables walletless payments through Solana Blinks. Users can make payments without installing wallets, while merchants can accept Solana payments seamlessly.

## 🌟 Features

### Core Features
- **🔗 Walletless Payments**: Pay with Solana Blinks without installing wallets
- **🏪 Merchant Dashboard**: Complete merchant onboarding and management
- **⚡ Real-time Updates**: Live payment status and transaction tracking
- **📱 Mobile-First**: PWA support with offline capabilities
- **🔒 Secure**: Production-grade security with encrypted key storage
- **💰 Multi-token Support**: USDC, SOL, and any SPL token

### Technical Features
- **⚙️ Anchor Smart Contracts**: Rust-based Solana programs
- **🌐 Real-time WebSocket**: Live payment updates
- **📱 PWA Support**: Installable web app
- **🛡️ Error Boundaries**: Robust error handling
- **🧪 Testing Suite**: Comprehensive test coverage
- **🐳 Docker Deployment**: Production-ready containerization

## 🚀 Features

### Core Features
- **Walletless Payments**: Pay with Solana Blinks without installing wallets
- **Merchant Dashboard**: Complete merchant onboarding and management
- **Real-time Updates**: Live payment status and transaction tracking
- **Mobile-First**: PWA support with offline capabilities
- **Secure**: Production-grade security with encrypted key storage
- **Multi-token Support**: USDC, SOL, and any SPL token

### Technical Features
- **Anchor Smart Contracts**: Rust-based Solana programs
- **Real-time WebSocket**: Live payment updates
- **PWA Support**: Installable web app
- **Error Boundaries**: Robust error handling
- **Testing Suite**: Comprehensive test coverage
- **Docker Deployment**: Production-ready containerization

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │   Solana        │
│   (Next.js)     │◄──►│   (Node.js)      │◄──►│   Blockchain    │
│                 │    │                 │    │                 │
│ • React UI      │    │ • Express API   │    │ • Smart Contracts│
│ • PWA Support   │    │ • WebSocket     │    │ • PDAs          │
│ • Mobile-First  │    │ • JWT Auth      │    │ • Events        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14**: React framework with SSR/SSG
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Solana Wallet Adapter**: Wallet integration
- **Heroicons**: Beautiful icons
- **PWA**: Progressive Web App capabilities

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **TypeScript**: Type-safe development
- **WebSocket**: Real-time communication
- **JWT**: Authentication
- **PostgreSQL**: Database (optional)

### Blockchain
- **Solana**: High-performance blockchain
- **Anchor**: Solana program framework
- **Rust**: Smart contract language
- **SPL Tokens**: Token standard

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Rust 1.70+
- Solana CLI 1.16+
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/blinkpay.git
cd blinkpay
```

2. **Install dependencies**
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install

# Smart contracts
cd ../contracts
npm install
```

3. **Environment Setup**
```bash
# Copy environment files
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

4. **Start development servers**
```bash
# Terminal 1: Frontend
cd frontend
npm run dev

# Terminal 2: Backend
cd backend
npm run dev

# Terminal 3: Smart contracts
cd contracts
anchor build
anchor test
```

## 📱 Usage

### For Users
1. **Walletless Login**: Scan QR code or click Blink link
2. **Make Payment**: Enter amount and confirm
3. **Real-time Updates**: See payment status live
4. **Mobile App**: Install as PWA on mobile

### For Merchants
1. **Register**: Complete merchant onboarding
2. **Dashboard**: View payments and analytics
3. **Settings**: Configure webhooks and API keys
4. **Analytics**: Track revenue and transactions

## 🔧 Development

### Project Structure
```
blinkpay/
├── contracts/           # Solana smart contracts
│   ├── programs/
│   │   └── blinkpay/
│   ├── tests/
│   └── Anchor.toml
├── backend/             # Node.js API server
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── frontend/            # Next.js web app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── lib/
│   └── package.json
└── docs/               # Documentation
```

### Smart Contracts
```bash
cd contracts
anchor build
anchor test
anchor deploy
```

### API Development
```bash
cd backend
npm run dev
npm run test
npm run build
```

### Frontend Development
```bash
cd frontend
npm run dev
npm run test
npm run build
```

## 🧪 Testing

### Run All Tests
```bash
# Smart contracts
cd contracts && anchor test

# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

### Test Coverage
```bash
# Frontend coverage
cd frontend && npm run test:coverage

# Backend coverage
cd backend && npm run test:coverage
```

## 🚀 Deployment

### Docker Deployment
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📚 API Documentation

### Authentication
```typescript
// Walletless login
POST /api/auth/blink-login
{
  "merchantId": "string"
}

// Response
{
  "sessionId": "string",
  "qrCode": "string",
  "blinkUrl": "string"
}
```

### Payments
```typescript
// Create payment
POST /api/payments/create
{
  "amount": 25.00,
  "token": "USDC",
  "merchantId": "string"
}

// Response
{
  "paymentId": "string",
  "blinkUrl": "string",
  "qrCode": "string"
}
```

### Webhooks
```typescript
// Payment webhook
POST /your-webhook-url
{
  "event": "payment.completed",
  "paymentId": "string",
  "amount": 25.00,
  "signature": "string"
}
```

## 🔒 Security

### Key Management
- **Encrypted Storage**: AES-256 encryption for private keys
- **Session Management**: Automatic expiration and cleanup
- **Backup & Recovery**: Secure key backup system
- **Audit Logging**: Comprehensive security event logging

### Best Practices
- Never store private keys in plain text
- Use HTTPS in production
- Implement rate limiting
- Validate all inputs
- Use secure random number generation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Document new features
- Follow the existing code style
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.blinkpay.com](https://docs.blinkpay.com)
- **Issues**: [GitHub Issues](https://github.com/your-org/blinkpay/issues)
- **Discord**: [BlinkPay Community](https://discord.gg/blinkpay)
- **Email**: support@blinkpay.com

## 🙏 Acknowledgments

- Solana Foundation for the amazing blockchain
- Anchor team for the development framework
- Next.js team for the React framework
- All contributors and supporters

---

**Built with ❤️ by the BlinkPay team**