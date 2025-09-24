import { render, screen, waitFor } from '@testing-library/react';
import { PaymentSuccess } from '../../components/PaymentSuccess';

// Mock the useRouter hook
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock the useWallet hook
jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({
    connected: true,
    publicKey: { toBase58: () => 'test-public-key' },
  }),
}));

describe('PaymentSuccess', () => {
  const mockProps = {
    amount: 25.00,
    token: 'USDC',
    signature: 'test-signature-123',
    onPayAgain: jest.fn(),
    onReturnHome: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders payment success message', () => {
    render(<PaymentSuccess {...mockProps} />);
    
    expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
    expect(screen.getByText('$25.00 USDC')).toBeInTheDocument();
  });

  it('displays transaction signature', () => {
    render(<PaymentSuccess {...mockProps} />);
    
    expect(screen.getByText('test-signature-123')).toBeInTheDocument();
  });

  it('shows countdown timer', () => {
    render(<PaymentSuccess {...mockProps} />);
    
    expect(screen.getByText(/Redirecting in/)).toBeInTheDocument();
  });

  it('calls onPayAgain when Pay Again button is clicked', () => {
    render(<PaymentSuccess {...mockProps} />);
    
    const payAgainButton = screen.getByText('Pay Again');
    payAgainButton.click();
    
    expect(mockProps.onPayAgain).toHaveBeenCalledTimes(1);
  });

  it('calls onReturnHome when Return Home button is clicked', () => {
    render(<PaymentSuccess {...mockProps} />);
    
    const returnHomeButton = screen.getByText('Return Home');
    returnHomeButton.click();
    
    expect(mockProps.onReturnHome).toHaveBeenCalledTimes(1);
  });
});
