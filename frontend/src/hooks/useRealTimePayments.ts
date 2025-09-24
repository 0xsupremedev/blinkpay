import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';

interface PaymentUpdate {
  receiptId: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  signature?: string;
  timestamp: number;
  amount: number;
  token: string;
}

export function useRealTimePayments() {
  const { connected, publicKey } = useWallet();
  const [payments, setPayments] = useState<PaymentUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  // WebSocket connection for real-time updates
  const [ws, setWs] = useState<WebSocket | null>(null);

  const connectWebSocket = useCallback(() => {
    if (!connected || !publicKey) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/ws';
    const newWs = new WebSocket(wsUrl);

    newWs.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      // Subscribe to payment updates for this merchant
      newWs.send(JSON.stringify({
        type: 'subscribe',
        merchant: publicKey.toBase58()
      }));
    };

    newWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'payment_update') {
          handlePaymentUpdate(data.payment);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    newWs.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      // Reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };

    newWs.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    setWs(newWs);
  }, [connected, publicKey]);

  const handlePaymentUpdate = useCallback((payment: PaymentUpdate) => {
    setPayments(prev => {
      const existing = prev.find(p => p.receiptId === payment.receiptId);
      if (existing) {
        return prev.map(p => 
          p.receiptId === payment.receiptId ? { ...p, ...payment } : p
        );
      } else {
        return [...prev, payment];
      }
    });
    setLastUpdate(Date.now());
  }, []);

  // Poll Solana for payment confirmations
  const pollPaymentStatus = useCallback(async (receiptId: string) => {
    if (!connected || !publicKey) return;

    try {
      const response = await fetch(`/api/payments/status/${receiptId}`);
      const data = await response.json();
      
      if (data.status && data.status !== 'pending') {
        handlePaymentUpdate({
          receiptId,
          status: data.status,
          signature: data.signature,
          timestamp: Date.now(),
          amount: data.amount,
          token: data.token
        });
      }
    } catch (error) {
      console.error('Failed to poll payment status:', error);
    }
  }, [connected, publicKey, handlePaymentUpdate]);

  // Subscribe to Solana program events
  const subscribeToEvents = useCallback(async () => {
    if (!connected || !publicKey) return;

    try {
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com'
      );

      // Subscribe to PaymentCompleted events
      const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || 'BLiNkPay11111111111111111111111111111111111');
      
      connection.onProgramAccountChange(
        programId,
        (accountInfo, context) => {
          // Parse account data to check for payment completion
          // This is a simplified version - in production, you'd parse the account data
          console.log('Program account changed:', accountInfo);
        },
        'confirmed'
      );
    } catch (error) {
      console.error('Failed to subscribe to events:', error);
    }
  }, [connected, publicKey]);

  useEffect(() => {
    if (connected && publicKey) {
      connectWebSocket();
      subscribeToEvents();
    } else {
      if (ws) {
        ws.close();
        setWs(null);
      }
      setIsConnected(false);
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [connected, publicKey, connectWebSocket, subscribeToEvents]);

  const getPaymentStatus = useCallback((receiptId: string) => {
    return payments.find(p => p.receiptId === receiptId);
  }, [payments]);

  const getRecentPayments = useCallback((limit: number = 10) => {
    return payments
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }, [payments]);

  const getPaymentsByStatus = useCallback((status: string) => {
    return payments.filter(p => p.status === status);
  }, [payments]);

  return {
    payments,
    isConnected,
    lastUpdate,
    getPaymentStatus,
    getRecentPayments,
    getPaymentsByStatus,
    pollPaymentStatus
  };
}
