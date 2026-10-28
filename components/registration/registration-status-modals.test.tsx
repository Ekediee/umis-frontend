import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SuccessModal, FinancialSuccessModal } from './registration-status-modals';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

describe('SuccessModal (course registration locked in)', () => {
  beforeEach(() => push.mockClear());

  it('does not show a payment amount', () => {
    render(<SuccessModal isOpen onClose={vi.fn()} />);
    expect(screen.getByText('Course Registration Locked In')).toBeInTheDocument();
    expect(screen.queryByText(/Total Payment Required/i)).toBeNull();
    expect(screen.queryByText(/₦/)).toBeNull();
  });

  it('sends the student to registration home when they click outside the modal', () => {
    const onClose = vi.fn();
    render(<SuccessModal isOpen onClose={onClose} />);
    const backdrop = document.body.querySelector('.fixed > div') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/registration');
  });

  it('keeps the existing buttons', () => {
    render(<SuccessModal isOpen onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Fund Wallet & Pay'));
    expect(push).toHaveBeenCalledWith('/dashboard/finance/fees/payment');
    fireEvent.click(screen.getByText('Return to Dashboard'));
    expect(push).toHaveBeenCalledWith('/dashboard');
  });
});

describe('FinancialSuccessModal (financial selections locked in)', () => {
  beforeEach(() => push.mockClear());

  it('shows "Pay now" when student has money in their wallet', () => {
    render(<FinancialSuccessModal isOpen walletBalance={50000} />);
    expect(screen.getByText('Financial Selections Locked In')).toBeInTheDocument();
    expect(screen.getByText('Pay now')).toBeInTheDocument();
    expect(screen.queryByText('Fund wallet and pay now')).toBeNull();
  });

  it('shows "Fund wallet and pay now" when student has 0 wallet balance', () => {
    render(<FinancialSuccessModal isOpen walletBalance={0} />);
    expect(screen.getByText('Financial Selections Locked In')).toBeInTheDocument();
    expect(screen.getByText('Fund wallet and pay now')).toBeInTheDocument();
    expect(screen.queryByText('Pay now')).toBeNull();
  });

  it('customizes message for off-campus students without mentioning meal plan', () => {
    render(<FinancialSuccessModal isOpen walletBalance={50000} isOffCampus={true} />);
    expect(screen.getByText(/Your off-campus residence and worship center selections/i)).toBeInTheDocument();
    expect(screen.queryByText(/meal plan/i)).toBeNull();
  });
});
