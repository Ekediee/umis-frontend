import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from './LoginForm';
import { loginAction } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/app/actions/auth', () => ({
  loginAction: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('LoginForm', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it('renders username and password inputs', () => {
    render(<LoginForm />);
    
    expect(screen.getByPlaceholderText('e.g. 18/0654')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••••')).toBeInTheDocument();
  });

  it('toggles password visibility when the eye icon is clicked', () => {
    render(<LoginForm />);
    
    const passwordInput = screen.getByPlaceholderText('••••••••••');
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    // There are actually multiple elements but we can target the button
    const toggleButton = screen.getByRole('button', { name: '' });
    fireEvent.click(toggleButton);
    
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('submits the form and redirects on success', async () => {
    (loginAction as jest.Mock).mockResolvedValueOnce({ success: true });
    
    render(<LoginForm />);
    
    const usernameInput = screen.getByPlaceholderText('e.g. 18/0654');
    const passwordInput = screen.getByPlaceholderText('••••••••••');
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    fireEvent.change(usernameInput, { target: { value: '18/0654' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(loginAction).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith('Login successful! Redirecting...');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('submits the form and displays error toast on failure', async () => {
    (loginAction as jest.Mock).mockResolvedValueOnce({ error: 'Invalid credentials' });
    
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
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
