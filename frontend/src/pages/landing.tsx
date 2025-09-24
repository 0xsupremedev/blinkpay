import { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { 
  CreditCardIcon, 
  QrCodeIcon, 
  ShieldCheckIcon, 
  BoltIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";
import BlinkButton from "../components/BlinkButton";
import SolanaLogo from "../components/SolanaLogo";
import USDCLogo from "../components/USDCLogo";

export default function Landing() {
  const router = useRouter();

  // Generate random positions for Solana background images
  const generateRandomPositions = () => {
    const positions = [];
    const animations = ['float', 'drift', 'glow', 'rotate'];
    
    for (let i = 0; i < 8; i++) {
      positions.push({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        rotation: Math.random() * 360,
        opacity: Math.random() * 0.3 + 0.1, // Between 0.1 and 0.4
        scale: Math.random() * 0.5 + 0.3, // Between 0.3 and 0.8
        animationDelay: Math.random() * 5,
        animation: animations[Math.floor(Math.random() * animations.length)]
      });
    }
    return positions;
  };

  const [solanaPositions] = useState(generateRandomPositions());

  const features = [
    {
      icon: BoltIcon,
      title: "Walletless Payments",
      description: "Pay with Solana Blinks without installing a wallet. One-click payments via QR codes or links.",
      color: "text-yellow-500"
    },
    {
      icon: CreditCardIcon,
      title: "SPL Token Support",
      description: "Accept USDC, SOL, and any SPL token. Real-time fiat-to-crypto quotes with TTL protection.",
      color: "text-blue-500",
      tokens: true
    },
    {
      icon: ShieldCheckIcon,
      title: "Secure Smart Contracts",
      description: "Built on Solana with Anchor framework. PDA-based architecture with comprehensive error handling.",
      color: "text-green-500"
    },
    {
      icon: QrCodeIcon,
      title: "QR Code Integration",
      description: "Generate QR codes for mobile payments. Perfect for physical stores and online checkout.",
      color: "text-purple-500"
    },
    {
      icon: CurrencyDollarIcon,
      title: "Split Payments",
      description: "Automatically split payments between merchants and platform. Configurable fee structure.",
      color: "text-indigo-500"
    },
    {
      icon: ChartBarIcon,
      title: "Real-time Analytics",
      description: "Track payments with on-chain events. Webhook notifications for instant merchant updates.",
      color: "text-red-500"
    }
  ];

  const useCases = [
    {
      title: "Coffee Shop",
      description: "Customer scans QR → pays $5 USDC → instant confirmation",
      amount: 5,
      icon: "☕"
    },
    {
      title: "Online Store",
      description: "Checkout with Blink link → walletless payment → order confirmed",
      amount: 25,
      icon: "🛒"
    },
    {
      title: "Subscription Service",
      description: "Monthly $10 USDC → automatic split payment → platform fee",
      amount: 10,
      icon: "🔄"
    }
  ];

	return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Solana Background Images */}
      <div className="absolute inset-0 pointer-events-none">
        {solanaPositions.map((pos) => (
          <div
            key={pos.id}
            className={`absolute solana-bg-${pos.animation}`}
            style={{
              top: `${pos.top}%`,
              left: `${pos.left}%`,
              transform: `rotate(${pos.rotation}deg) scale(${pos.scale})`,
              opacity: pos.opacity,
              animationDelay: `${pos.animationDelay}s`
            }}
          >
            <Image
              src="/solana-bg.png"
              alt="Solana Background"
              width={120}
              height={120}
              className="w-24 h-24 md:w-32 md:h-32"
              style={{
                filter: 'blur(1px)',
                mixBlendMode: 'overlay'
              }}
            />
          </div>
        ))}
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              BlinkPay
            </h1>
            <p className="text-xl md:text-2xl text-blue-200 mb-8 max-w-3xl mx-auto">
              Solana-powered payments that work without wallets. 
              <br />
              <span className="text-yellow-300">Pay with Blinks, not complexity.</span>
            </p>
            
            {/* QR Code Phone Demo */}
            <div className="flex justify-center mb-12">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-orange-500/20 rounded-3xl blur-2xl"></div>
                <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
                  <div className="w-64 h-96 bg-gradient-to-br from-purple-100 to-orange-100 rounded-2xl shadow-2xl flex items-center justify-center relative overflow-hidden">
                    {/* Phone Frame */}
                    <div className="absolute inset-2 bg-gradient-to-br from-purple-200 to-orange-200 rounded-xl shadow-inner"></div>
                    
                    {/* QR Code Display */}
                    <div className="relative z-10 bg-white rounded-xl p-4 shadow-lg">
                      <div className="w-32 h-32 bg-black rounded-lg flex items-center justify-center">
                        <div className="grid grid-cols-8 gap-0.5">
                          {Array.from({ length: 64 }).map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-3 h-3 rounded-sm ${
                                Math.random() > 0.5 ? 'bg-white' : 'bg-black'
                              }`}
                            ></div>
                          ))}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 mt-2 text-center font-mono">
                        Scan to Pay
                      </div>
                    </div>
                    
                    {/* Floating Particles */}
                    <div className="absolute inset-0 pointer-events-none">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div
                          key={i}
                          className={`absolute w-2 h-2 rounded-full ${
                            i % 3 === 0 ? 'bg-purple-400' : i % 3 === 1 ? 'bg-orange-400' : 'bg-white'
                          } opacity-60 animate-pulse`}
                          style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${2 + Math.random() * 2}s`
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Supported Tokens */}
            <div className="flex justify-center items-center space-x-6 mb-12">
              <div className="text-center">
                <SolanaLogo className="w-16 h-16 mx-auto mb-2" />
                <p className="text-white/80 text-sm font-medium">Solana</p>
              </div>
              <div className="text-center">
                <USDCLogo className="w-16 h-16 mx-auto mb-2" />
                <p className="text-white/80 text-sm font-medium">USDC</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push("/login")}
                className="bg-white text-indigo-900 font-semibold py-3 px-8 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2"
              >
                <UserGroupIcon className="w-5 h-5" />
                <span>Walletless Login</span>
              </button>
              <button
                onClick={() => router.push("/merchant/register")}
                className="bg-indigo-600 text-white font-semibold py-3 px-8 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
              >
                <ChartBarIcon className="w-5 h-5" />
                <span>Become a Merchant</span>
              </button>
            </div>
          </div>
			</div>
		</div>

      {/* Features Section */}
      <div className="py-20 bg-white relative overflow-hidden">
        {/* Solana Background Images for Features */}
        <div className="absolute inset-0 pointer-events-none">
          {solanaPositions.slice(0, 4).map((pos) => (
            <div
              key={`features-${pos.id}`}
              className={`absolute solana-bg-${pos.animation}`}
              style={{
                top: `${pos.top}%`,
                left: `${pos.left}%`,
                transform: `rotate(${pos.rotation}deg) scale(${pos.scale * 0.6})`,
                opacity: pos.opacity * 0.5,
                animationDelay: `${pos.animationDelay + 2}s`
              }}
            >
              <Image
                src="/solana-bg.png"
                alt="Solana Background"
                width={80}
                height={80}
                className="w-16 h-16 md:w-20 md:h-20"
                style={{
                  filter: 'blur(2px)',
                  mixBlendMode: 'multiply'
                }}
              />
            </div>
          ))}
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why BlinkPay?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The future of Web3 payments is here. No wallet downloads, no complexity, just instant payments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                {feature.tokens ? (
                  <div className="flex items-center space-x-3 mb-4">
                    <SolanaLogo className="w-8 h-8" />
                    <USDCLogo className="w-8 h-8" />
                  </div>
                ) : (
                  <feature.icon className={`w-12 h-12 ${feature.color} mb-4`} />
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
				</div>

      {/* Mobile QR Experience Section */}
      <div className="py-20 bg-gradient-to-r from-purple-900 to-orange-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
					<div>
              <h2 className="text-4xl font-bold text-white mb-6">
                Mobile-First Payments
              </h2>
              <p className="text-xl text-purple-200 mb-8">
                Scan QR codes with any Solana wallet app. No downloads, no complexity - just instant payments.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <span className="text-white text-lg">Generate payment QR code</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <span className="text-white text-lg">Scan with mobile wallet</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <span className="text-white text-lg">Confirm payment instantly</span>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute -inset-6 bg-gradient-to-r from-purple-500/30 to-orange-500/30 rounded-3xl blur-3xl"></div>
                <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                  <div className="w-72 h-96 bg-gradient-to-br from-purple-100 to-orange-100 rounded-2xl shadow-2xl flex items-center justify-center relative overflow-hidden">
                    {/* Phone Frame */}
                    <div className="absolute inset-3 bg-gradient-to-br from-purple-200 to-orange-200 rounded-xl shadow-inner"></div>
                    
                    {/* QR Code Display */}
                    <div className="relative z-10 bg-white rounded-xl p-6 shadow-lg">
                      <div className="w-40 h-40 bg-black rounded-lg flex items-center justify-center mb-4">
                        <div className="grid grid-cols-10 gap-0.5">
                          {Array.from({ length: 100 }).map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-2 h-2 rounded-sm ${
                                Math.random() > 0.5 ? 'bg-white' : 'bg-black'
                              }`}
                            ></div>
                          ))}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 text-center font-mono">
                        BlinkPay QR
                      </div>
                      <div className="text-xs text-gray-500 text-center mt-1">
                        $5.00 USDC
                      </div>
                    </div>
                    
                    {/* Animated Particles */}
                    <div className="absolute inset-0 pointer-events-none">
                      {Array.from({ length: 15 }).map((_, i) => (
                        <div
                          key={i}
                          className={`absolute w-1.5 h-1.5 rounded-full ${
                            i % 4 === 0 ? 'bg-purple-400' : 
                            i % 4 === 1 ? 'bg-orange-400' : 
                            i % 4 === 2 ? 'bg-pink-400' : 'bg-white'
                          } opacity-70 animate-pulse`}
                          style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${1.5 + Math.random() * 2}s`
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
						</div>
					</div>

      {/* Use Cases Section */}
      <div className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Real-World Use Cases
            </h2>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">
              From coffee shops to subscription services, BlinkPay works everywhere.
            </p>
					</div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-colors">
                <div className="text-4xl mb-4">{useCase.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {useCase.title}
                </h3>
                <p className="text-blue-200 mb-4">
                  {useCase.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-yellow-300">
                    ${useCase.amount}
                  </span>
                  <button
                    onClick={() => router.push(`/pay?merchant=11111111111111111111111111111111&amount=${useCase.amount * 1000000}&mint=So11111111111111111111111111111111111111112&requestId=${useCase.title.toLowerCase().replace(' ', '-')}-${Date.now()}`)}
                    className="text-white hover:text-yellow-300 transition-colors flex items-center space-x-1"
                  >
                    <span>Try Demo</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
					</div>

      {/* Technical Stack Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Built for Developers
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Open source, well-documented, and ready for production.
            </p>
					</div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">A</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Anchor</h3>
              <p className="text-gray-600 text-sm">Solana smart contracts</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">N</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Next.js</h3>
              <p className="text-gray-600 text-sm">React frontend</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">N</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Node.js</h3>
              <p className="text-gray-600 text-sm">Express backend</p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">S</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Supabase</h3>
              <p className="text-gray-600 text-sm">Database & auth</p>
            </div>
          </div>

          {/* Supported Tokens */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Supported Tokens
            </h3>
            <div className="flex justify-center items-center space-x-12">
              <div className="text-center">
                <SolanaLogo className="w-20 h-20 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-gray-900 mb-1">Solana</h4>
                <p className="text-gray-600 text-sm">Native blockchain</p>
              </div>
              <div className="text-center">
                <USDCLogo className="w-20 h-20 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-gray-900 mb-1">USDC</h4>
                <p className="text-gray-600 text-sm">Stablecoin payments</p>
              </div>
						</div>
						</div>
						</div>
					</div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 relative overflow-hidden">
        {/* Solana Background Images for CTA */}
        <div className="absolute inset-0 pointer-events-none">
          {solanaPositions.slice(4, 8).map((pos) => (
            <div
              key={`cta-${pos.id}`}
              className={`absolute solana-bg-${pos.animation}`}
              style={{
                top: `${pos.top}%`,
                left: `${pos.left}%`,
                transform: `rotate(${pos.rotation}deg) scale(${pos.scale * 0.8})`,
                opacity: pos.opacity * 0.3,
                animationDelay: `${pos.animationDelay + 1}s`
              }}
            >
              <Image
                src="/solana-bg.png"
                alt="Solana Background"
                width={100}
                height={100}
                className="w-20 h-20 md:w-24 md:h-24"
                style={{
                  filter: 'blur(1.5px)',
                  mixBlendMode: 'screen'
                }}
              />
            </div>
          ))}
        </div>
        
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join the future of Web3 payments. No wallet required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push("/pay")}
              className="bg-white text-indigo-600 font-semibold py-3 px-8 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Start Paying
            </button>
            <button
              onClick={() => router.push("/merchant/register")}
              className="bg-indigo-500 text-white font-semibold py-3 px-8 rounded-xl hover:bg-indigo-400 transition-colors border border-indigo-400"
            >
              Become a Merchant
            </button>
          </div>
        </div>
					</div>

      {/* Footer */}
      <div className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-4">BlinkPay</h3>
            <p className="text-gray-400 mb-6">
              Solana-powered payments without the complexity
            </p>
            <div className="flex justify-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                GitHub
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Documentation
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Support
              </a>
            </div>
          </div>
					</div>
				</div>
		</div>
	);
}