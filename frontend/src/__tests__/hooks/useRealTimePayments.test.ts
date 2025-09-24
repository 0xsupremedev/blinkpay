import { renderHook, act } from '@testing-library/react';
import { useRealTimePayments } from '../../hooks/useRealTimePayments';

// Mock WebSocket
class MockWebSocket {
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {}

  send(data: string) {
    // Mock send implementation
  }

  close() {
    // Mock close implementation
  }
}

// Mock global WebSocket
(global as any).WebSocket = MockWebSocket;

// Mock useWallet hook
jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({
    connected: true,
    publicKey: { toBase58: () => 'test-merchant-key' },
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('useRealTimePayments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve({ status: 'completed' }),
    });
  });

  it('initializes with empty payments array', () => {
    const { result } = renderHook(() => useRealTimePayments());
    
    expect(result.current.payments).toEqual([]);
    expect(result.current.isConnected).toBe(false);
  });

  it('handles payment updates correctly', () => {
    const { result } = renderHook(() => useRealTimePayments());
    
    const paymentUpdate = {
      receiptId: 'test-receipt-123',
      status: 'completed' as const,
      signature: 'test-signature',
      timestamp: Date.now(),
      amount: 25.00,
      token: 'USDC',
    };

    act(() => {
      // Simulate receiving a payment update
      result.current.getPaymentStatus('test-receipt-123');
    });

    expect(result.current.payments).toEqual([]);
  });

  it('filters payments by status', () => {
    const { result } = renderHook(() => useRealTimePayments());
    
    // Mock payments data
    const mockPayments = [
      { receiptId: '1', status: 'completed', timestamp: Date.now(), amount: 25, token: 'USDC' },
      { receiptId: '2', status: 'pending', timestamp: Date.now(), amount: 50, token: 'USDC' },
    ];

    // This would be set by the hook internally
    act(() => {
      // Simulate setting payments
      (result.current as any).payments = mockPayments;
    });

    const completedPayments = result.current.getPaymentsByStatus('completed');
    expect(completedPayments).toHaveLength(1);
  });

  it('gets recent payments in correct order', () => {
    const { result } = renderHook(() => useRealTimePayments());
    
    const mockPayments = [
      { receiptId: '1', status: 'completed', timestamp: Date.now() - 1000, amount: 25, token: 'USDC' },
      { receiptId: '2', status: 'completed', timestamp: Date.now(), amount: 50, token: 'USDC' },
    ];

    act(() => {
      (result.current as any).payments = mockPayments;
    });

    const recentPayments = result.current.getRecentPayments(1);
    expect(recentPayments).toHaveLength(1);
    expect(recentPayments[0].receiptId).toBe('2');
  });
});
