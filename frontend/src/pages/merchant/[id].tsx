import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { 
  ArrowLeftIcon, 
  CurrencyDollarIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon,
  DocumentDuplicateIcon
} from "@heroicons/react/24/outline";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import toast from "react-hot-toast";
import axios from "axios";

interface PaymentReceipt {
  id: string;
  merchant: string;
  payer: string;
  amount: number;
  mint: string;
  timestamp: number;
  signature?: string;
  status: 'pending' | 'confirmed' | 'refunded';
}

interface RefundRequest {
  receiptId: string;
  amount: number;
  reason?: string;
}

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function MerchantDashboard() {
  const router = useRouter();
  const { id: merchantId } = router.query;
  const { connection } = useConnection();
  const wallet = useWallet();
  
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundModal, setRefundModal] = useState<RefundRequest | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState<string>("");

  // Mock data for demo - replace with actual API calls
  useEffect(() => {
    const mockReceipts: PaymentReceipt[] = [
      {
        id: "receipt-1",
        merchant: merchantId as string || "11111111111111111111111111111111",
        payer: "Customer1...abc123",
        amount: 5000000, // 5 USDC
        mint: "So11111111111111111111111111111111111111112",
        timestamp: Date.now() - 3600000, // 1 hour ago
        signature: "5K7...abc123",
        status: 'confirmed'
      },
      {
        id: "receipt-2", 
        merchant: merchantId as string || "11111111111111111111111111111111",
        payer: "Customer2...def456",
        amount: 2500000, // 2.5 USDC
        mint: "So11111111111111111111111111111111111111112",
        timestamp: Date.now() - 7200000, // 2 hours ago
        signature: "3M9...def456",
        status: 'confirmed'
      },
      {
        id: "receipt-3",
        merchant: merchantId as string || "11111111111111111111111111111111", 
        payer: "Customer3...ghi789",
        amount: 10000000, // 10 USDC
        mint: "So11111111111111111111111111111111111111112",
        timestamp: Date.now() - 10800000, // 3 hours ago
        signature: "7N2...ghi789",
        status: 'refunded'
      }
    ];
    
    setReceipts(mockReceipts);
    setLoading(false);
  }, [merchantId]);

  const formatAmount = (amount: number, decimals: number = 6) => {
    return (amount / Math.pow(10, decimals)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'refunded':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleRefund = async (receipt: PaymentReceipt) => {
    if (!wallet.publicKey) {
      toast.error("Please connect your wallet to process refunds");
      return;
    }

    try {
      const refundAmountWei = refundAmount * Math.pow(10, 6); // Convert to base units
      
      const response = await axios.post(`${BACKEND}/payments/build-refund-partial`, {
        merchantAuthority: wallet.publicKey.toBase58(),
        payer: receipt.payer,
        mint: receipt.mint,
        amount: refundAmountWei,
        receipt: receipt.id
      });

      const txBuf = Buffer.from(response.data.transactionBase64, "base64");
      const tx = Transaction.from(txBuf);
      const signed = await wallet.signTransaction?.(tx);
      
      if (signed) {
        const signature = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction(signature, "confirmed");
        
        toast.success(`Refund of ${formatAmount(refundAmountWei)} USDC processed`);
        
        // Update receipt status
        setReceipts(prev => prev.map(r => 
          r.id === receipt.id 
            ? { ...r, status: refundAmountWei >= receipt.amount ? 'refunded' : 'confirmed' }
            : r
        ));
        
        setRefundModal(null);
        setRefundAmount(0);
        setRefundReason("");
      }
    } catch (error) {
      console.error("Refund failed:", error);
      toast.error("Refund failed. Please try again.");
    }
  };

  const totalRevenue = receipts
    .filter(r => r.status === 'confirmed')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalRefunded = receipts
    .filter(r => r.status === 'refunded')
    .reduce((sum, r) => sum + r.amount, 0);

  const netRevenue = totalRevenue - totalRefunded;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading merchant dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Merchant Dashboard</h1>
                <p className="text-gray-600 text-sm">
                  Merchant: {merchantId ? `${merchantId.slice(0, 8)}...${merchantId.slice(-8)}` : "Demo Merchant"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {wallet.connected ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Wallet Connected</span>
                </div>
              ) : (
                <button
                  onClick={() => wallet.connect?.()}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center">
              <CurrencyDollarIcon className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatAmount(totalRevenue)} USDC
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Refunded</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatAmount(totalRefunded)} USDC
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center">
              <CheckCircleIcon className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatAmount(netRevenue)} USDC
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Receipts Table */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Payment Receipts</h2>
            <p className="text-sm text-gray-600">All payments received by your merchant account</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(receipt.status)}
                        <span className="ml-2 text-sm font-medium capitalize">
                          {receipt.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatAmount(receipt.amount)} USDC
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">
                        {receipt.payer}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatTimestamp(receipt.timestamp)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {receipt.signature ? (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(receipt.signature!);
                            toast.success("Transaction signature copied");
                          }}
                          className="text-sm text-indigo-600 hover:text-indigo-800 font-mono flex items-center space-x-1"
                        >
                          <span>{receipt.signature.slice(0, 8)}...{receipt.signature.slice(-8)}</span>
                          <DocumentDuplicateIcon className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {receipt.status === 'confirmed' && (
                        <button
                          onClick={() => setRefundModal({
                            receiptId: receipt.id,
                            amount: receipt.amount / Math.pow(10, 6),
                            reason: ""
                          })}
                          className="text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Refund Modal */}
      {refundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Process Refund
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Amount (USDC)
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  max={refundModal.amount}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={`Max: ${refundModal.amount}`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Reason for refund..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setRefundModal(null)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const receipt = receipts.find(r => r.id === refundModal.receiptId);
                  if (receipt) handleRefund(receipt);
                }}
                disabled={refundAmount <= 0 || refundAmount > refundModal.amount}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Process Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}