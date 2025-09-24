import { useEffect, useState } from "react";
import { CheckCircleIcon, ClockIcon, ClipboardCopyIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { Connection, PublicKey } from "@solana/web3.js";
import { useRouter } from "next/router";

interface PaymentSuccessProps {
  merchant: string;
  amount: number;
  mint: string;
  requestId?: string;
  signature?: string;
  expiresAt?: number;
  onPayAgain?: () => void;
}

export default function PaymentSuccess({ 
  merchant, 
  amount, 
  mint, 
  requestId, 
  signature, 
  expiresAt,
  onPayAgain 
}: PaymentSuccessProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Countdown timer for request expiry
  useEffect(() => {
    if (!expiresAt) return;
    
    const updateTime = () => {
      const now = Math.floor(Date.now() / 1000);
      setTimeLeft(Math.max(0, expiresAt - now));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Listen for Solana transaction confirmation
  useEffect(() => {
    if (!signature) return;
    
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"
    );

    const interval = setInterval(async () => {
      try {
        const status = await connection.getSignatureStatus(signature);
        if (status.value && status.value.confirmationStatus === "confirmed") {
          setConfirmed(true);
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Error checking transaction status:", err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [signature]);

  const handleCopy = () => {
    if (!signature) return;
    navigator.clipboard.writeText(signature);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const formatAmount = (amount: number, decimals: number = 6) => {
    return (amount / Math.pow(10, decimals)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  };

  const handlePayAgain = async () => {
    if (onPayAgain) {
      setIsLoading(true);
      try {
        await onPayAgain();
      } finally {
        setIsLoading(false);
      }
    } else {
      router.push(`/pay?merchant=${merchant}&amount=${amount}&mint=${mint}&requestId=${requestId}`);
    }
  };

  const handleReturnHome = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      {/* Success Banner */}
      <div className="flex flex-col items-center bg-white shadow-2xl rounded-2xl p-8 max-w-lg w-full border border-gray-200">
        {/* Status Icon */}
        <div className="mb-6">
          {confirmed ? (
            <CheckCircleIcon className="w-20 h-20 text-green-500 animate-bounce" />
          ) : (
            <ClockIcon className="w-20 h-20 text-yellow-500 animate-pulse" />
          )}
        </div>

        {/* Status Text */}
        <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          {confirmed ? "Payment Confirmed!" : "Payment Processing..."}
        </h2>
        
        <p className="text-gray-600 mb-6 text-center">
          {formatAmount(amount)} USDC sent to{" "}
          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
            {merchant.slice(0, 8)}...{merchant.slice(-8)}
          </span>
        </p>

        {/* Transaction Details Card */}
        <div className="bg-gray-50 p-6 rounded-xl w-full mb-6 border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4 text-center">Transaction Details</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Merchant:</span>
              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {merchant.slice(0, 8)}...{merchant.slice(-8)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Amount:</span>
              <span className="font-semibold text-green-600">
                {formatAmount(amount)} USDC
              </span>
            </div>
            
            {requestId && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Request ID:</span>
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  {requestId.slice(0, 8)}...{requestId.slice(-8)}
                </span>
              </div>
            )}
            
            {expiresAt && timeLeft > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Expires In:</span>
                <span className={`font-semibold ${timeLeft < 60 ? 'text-red-500' : 'text-gray-800'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}
            
            {signature && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Transaction:</span>
                <button
                  className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                  onClick={handleCopy}
                >
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {signature.slice(0, 6)}...{signature.slice(-6)}
                  </span>
                  <ClipboardCopyIcon className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {copied && (
              <div className="text-center">
                <p className="text-green-500 text-sm font-medium">✓ Copied to clipboard!</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col w-full space-y-3">
          <button
            onClick={handlePayAgain}
            disabled={isLoading}
            className="bg-indigo-600 text-white py-3 px-6 rounded-xl hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading && <ArrowPathIcon className="w-5 h-5 animate-spin" />}
            <span>Pay Again</span>
          </button>
          
          <button
            onClick={handleReturnHome}
            className="text-gray-600 hover:text-gray-800 py-2 px-6 rounded-xl hover:bg-gray-100 transition-colors font-medium"
          >
            Return Home
          </button>
        </div>

        {/* Walletless Session Note */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-700 text-center">
            💡 Using a temporary Blink session wallet. You can export your keys or upgrade to Phantom/Backpack for future payments.
          </p>
        </div>

        {/* Real-time Status Indicator */}
        {!confirmed && signature && (
          <div className="mt-4 flex items-center space-x-2 text-yellow-600">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Waiting for confirmation...</span>
          </div>
        )}
        
        {confirmed && (
          <div className="mt-4 flex items-center space-x-2 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">Transaction confirmed on-chain!</span>
          </div>
        )}
      </div>
    </div>
  );
}
