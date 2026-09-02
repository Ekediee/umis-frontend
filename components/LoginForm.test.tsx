import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from './LoginForm';
import { loginAction } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// Mock dependencies
vi.mock('@/app/actions/auth', () => ({
  loginAction: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(() => ({
    get: vi.fn(() => null),
  })),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('LoginForm', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as Mock).mockReturnValue({ push: mockPush });
  });

  it('renders username and password inputs', () => {
    render(<LoginForm />);
    
    expect(screen.getByPlaceholderText('e.g. 18/0654')).toBeDefined();
    expect(screen.getByPlaceholderText('••••••••••')).toBeDefined();
  });

  it('toggles password visibility when the eye icon is clicked', () => {
    render(<LoginForm />);
    
    const passwordInput = screen.getByPlaceholderText('••••••••••');
    expect(passwordInput.getAttribute('type')).toBe('password');
    
    const toggleButton = screen.getByRole('button', { name: '' });
    fireEvent.click(toggleButton);
    
    expect(passwordInput.getAttribute('type')).toBe('text');
    
    fireEvent.click(toggleButton);
    expect(passwordInput.getAttribute('type')).toBe('password');
  });

  it('submits the form and calls loginAction', async () => {
    (loginAction as Mock).mockResolvedValueOnce({ error: 'Invalid credentials' });
    
    render(<LoginForm />);
    
    const usernameInput = screen.getByPlaceholderText('e.g. 18/0654');
    const passwordInput = screen.getByPlaceholderText('••••••••••');
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    fireEvent.change(usernameInput, { target: { value: '18/0654' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(loginAction).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });
  });
});
