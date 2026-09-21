import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from './LoginForm';
import { loginAction } from '@/app/actions/auth';
import { useRouter, useSearchParams } from 'next/navigation';
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

  describe('Google SSO', () => {
    const withParams = (params: Record<string, string>) =>
      (useSearchParams as Mock).mockReturnValue({ get: (key: string) => params[key] ?? null });

    // clearAllMocks() keeps implementations, so reset the params between tests.
    beforeEach(() => withParams({}));

    it('hides the Google button unless SSO is enabled', () => {
      render(<LoginForm />);
      expect(screen.queryByRole('link', { name: /sign in with your babcock email/i })).toBeNull();
    });

    it('shows a Google link that starts the server-side OAuth flow when enabled', () => {
      render(<LoginForm ssoEnabled />);
      const link = screen.getByRole('link', { name: /sign in with your babcock email/i });
      expect(link.getAttribute('href')).toBe('/api/auth/google');
    });

    it('shows a redirecting state and disables password login once clicked', () => {
      render(<LoginForm ssoEnabled />);
      const link = screen.getByRole('link', { name: /sign in with your babcock email/i });
      // jsdom can't navigate; swallow the default so the test isn't disturbed.
      link.addEventListener('click', (e) => e.preventDefault());
      fireEvent.click(link);

      expect(screen.getByRole('link', { name: /redirecting to google/i })).toBeDefined();
      expect((screen.getByRole('button', { name: /^login$/i }) as HTMLButtonElement).disabled).toBe(true);
    });

    it('resets the redirecting state when the page is restored from the back/forward cache', () => {
      render(<LoginForm ssoEnabled />);
      const link = screen.getByRole('link', { name: /sign in with your babcock email/i });
      link.addEventListener('click', (e) => e.preventDefault());
      fireEvent.click(link);
      expect(screen.getByRole('link', { name: /redirecting to google/i })).toBeDefined();

      fireEvent(window, Object.assign(new Event('pageshow'), { persisted: true }));
      expect(screen.getByRole('link', { name: /sign in with your babcock email/i })).toBeDefined();
    });

    it('renders the friendly message for a known sso_error code and removes the param', async () => {
      withParams({ sso_error: 'no_student_record' });
      const replaceState = vi.spyOn(window.history, 'replaceState');

      render(<LoginForm ssoEnabled />);

      expect((await screen.findByRole('alert')).textContent).toMatch(/couldn't find a student account/i);
      expect(replaceState).toHaveBeenCalled();
      replaceState.mockRestore();
    });

    it('shows no banner when the user simply cancelled at Google', () => {
      withParams({ sso_error: 'access_denied' });
      render(<LoginForm ssoEnabled />);
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('ignores unknown sso_error values instead of rendering them', () => {
      withParams({ sso_error: '<script>alert(1)</script>' });
      render(<LoginForm ssoEnabled />);
      expect(screen.queryByRole('alert')).toBeNull();
      expect(document.body.innerHTML).not.toContain('<script>alert(1)');
    });
  });
});
