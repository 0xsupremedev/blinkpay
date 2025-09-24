import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { 
  QrCodeIcon, 
  CheckCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  ShareIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  DocumentDuplicateIcon
} from "@heroicons/react/24/outline";
import { createBlinkLogin } from "../lib/api";
import toast from "react-hot-toast";
import QRCode from "qrcode";
import { useSecureSession } from "../hooks/useSecureSession";
import SessionManager from "../components/SessionManager";

interface SessionData {
  sessionId: string;
  pubkey: string;
  secret?: string;
  blinkUrl: string;
  qr: string;
}

export default function WalletlessLogin() {
  const router = useRouter();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");
  
  // Secure session management
  const { isConnected, sessionInfo, createSession, revokeSession } = useSecureSession();

  const generateLogin = async () => {
    setLoading(true);
    try {
      // Create secure session first
      const secureSession = await createSession();
      
      const response = await createBlinkLogin();
      setSessionData(response);
      
      // Generate QR code for the Blink URL
      const qrDataUrl = await QRCode.toDataURL(response.blinkUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCode(qrDataUrl);
      
      toast.success("Secure walletless login session created!");
    } catch (error) {
      console.error("Failed to create login session:", error);
      toast.error("Failed to create login session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const downloadQR = () => {
    if (!qrCode) return;
    
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `blinkpay-login-qr-${sessionData?.sessionId.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR code downloaded!");
  };

  const shareSession = async () => {
    if (!sessionData) return;
    
    const shareData = {
      title: 'BlinkPay Walletless Login',
      text: 'Login to BlinkPay without a wallet using this secure session',
      url: sessionData.blinkUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("Session shared!");
      } catch (error) {
        console.log("Share cancelled or failed");
      }
    } else {
      // Fallback to copying URL
      copyToClipboard(sessionData.blinkUrl, "Login URL");
    }
  };

  const formatPubkey = (pubkey: string) => {
    return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
  };

	return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Walletless Login
          </h1>
          <p className="text-xl text-indigo-200">
            Access BlinkPay without installing a wallet. Secure, temporary session keys.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          {!sessionData ? (
            /* Generate Session */
            <div className="text-center">
              <div className="mb-8">
                <QrCodeIcon className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">
                  Generate Login Session
                </h2>
                <p className="text-indigo-200 mb-6">
                  Create a temporary session wallet that works with Solana Blinks. 
                  No wallet installation required!
                </p>
              </div>

              <button
                onClick={generateLogin}
                disabled={loading}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-4 px-8 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
              >
                {loading && <ArrowPathIcon className="w-5 h-5 animate-spin" />}
                <span>{loading ? "Generating..." : "Generate Session"}</span>
              </button>

              {/* Features List */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Secure</h3>
                  <p className="text-indigo-200 text-sm">
                    Temporary session keys with automatic expiration
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <QrCodeIcon className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">QR Ready</h3>
                  <p className="text-indigo-200 text-sm">
                    Scan QR code with any Solana wallet app
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ArrowPathIcon className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Upgradeable</h3>
                  <p className="text-indigo-200 text-sm">
                    Export keys to Phantom or Backpack anytime
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Session Details */
            <div className="space-y-6">
              {/* Success Header */}
              <div className="text-center">
                <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">
                  Session Created!
                </h2>
                <p className="text-indigo-200">
                  Your walletless login session is ready to use
                </p>
              </div>

              {/* Session Info */}
              <div className="bg-white/10 rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-indigo-200 font-medium">Session ID:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-mono text-sm">
                      {formatPubkey(sessionData.sessionId)}
                    </span>
                    <button
                      onClick={() => copyToClipboard(sessionData.sessionId, "Session ID")}
                      className="p-1 hover:bg-white/20 rounded transition-colors"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4 text-indigo-300" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-indigo-200 font-medium">Public Key:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-mono text-sm">
                      {formatPubkey(sessionData.pubkey)}
                    </span>
                    <button
                      onClick={() => copyToClipboard(sessionData.pubkey, "Public Key")}
                      className="p-1 hover:bg-white/20 rounded transition-colors"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4 text-indigo-300" />
                    </button>
                  </div>
                </div>

                {sessionData.secret && (
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-200 font-medium">Secret Key:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-mono text-sm">
                        {showSecret ? sessionData.secret : "••••••••••••••••"}
                      </span>
                      <button
                        onClick={() => setShowSecret(!showSecret)}
                        className="p-1 hover:bg-white/20 rounded transition-colors"
                      >
                        {showSecret ? (
                          <EyeSlashIcon className="w-4 h-4 text-indigo-300" />
                        ) : (
                          <EyeIcon className="w-4 h-4 text-indigo-300" />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(sessionData.secret!, "Secret Key")}
                        className="p-1 hover:bg-white/20 rounded transition-colors"
                      >
                        <DocumentDuplicateIcon className="w-4 h-4 text-indigo-300" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* QR Code */}
              {qrCode && (
                <div className="text-center">
                  <h3 className="text-white font-semibold mb-4">Scan QR Code</h3>
                  <div className="bg-white p-4 rounded-xl inline-block">
                    <img src={qrCode} alt="Login QR Code" className="w-64 h-64" />
                  </div>
                  <div className="flex justify-center space-x-3 mt-4">
                    <button
                      onClick={downloadQR}
                      className="flex items-center space-x-2 bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      <span>Download QR</span>
                    </button>
                    <button
                      onClick={shareSession}
                      className="flex items-center space-x-2 bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
                    >
                      <ShareIcon className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Blink URL */}
              <div className="bg-white/10 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3">Blink URL</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={sessionData.blinkUrl}
                    readOnly
                    className="flex-1 bg-white/20 text-white px-3 py-2 rounded-lg text-sm font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(sessionData.blinkUrl, "Blink URL")}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4 text-indigo-300" />
                  </button>
                </div>
                <a
                  href={sessionData.blinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-indigo-300 hover:text-indigo-200 text-sm underline"
                >
                  Open Blink Link →
                </a>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setSessionData(null);
                    setQrCode("");
                    setShowSecret(false);
                  }}
                  className="flex-1 bg-white/20 text-white py-3 px-6 rounded-xl hover:bg-white/30 transition-colors font-semibold"
                >
                  Generate New Session
                </button>
                <button
                  onClick={() => router.push("/pay")}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 font-semibold"
                >
                  Start Paying
                </button>
              </div>

              {/* Session Manager */}
              {isConnected && sessionInfo && (
                <div className="mt-6">
                  <SessionManager />
                </div>
              )}

              {/* Security Notice */}
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-yellow-200 font-semibold mb-1">Security Notice</h4>
                    <p className="text-yellow-200/80 text-sm">
                      This is a demo-grade walletless session. For production use, implement secure key custody 
                      and proper session management. Always backup your secret key if you plan to use this wallet.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push("/")}
            className="text-indigo-300 hover:text-white transition-colors"
          >
            ← Back to Home
          </button>
        </div>
			</div>
		</div>
	);
}