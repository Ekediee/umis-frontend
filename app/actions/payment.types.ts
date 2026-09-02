// Payment-related TypeScript types shared between the server action layer
// and client components. Kept separate from the "use server" action file
// so client components can import types without bundling conflicts.

export interface PaymentMethod {
  code: string;
  provider_name: string;
  /** Optional merchant logo URL returned by the backend */
  image?: string;
}

export interface PaymentCurrency {
  currency_name: string;
  currency: string;
  rate_to_naira: string;
}

export interface PaymentRequirements {
  payment_methods: PaymentMethod[];
  currency: PaymentCurrency[];
}

export interface GetPaymentRequirementsResult {
  success: boolean;
  data?: PaymentRequirements;
  error?: string;
}

export interface InitialisePaymentPayload {
  amount: number;
  currency: string;
  payment_method: string;
  wallet_payment: boolean;
  /** The frontend URL the merchant should redirect to after checkout. */
  redirect_url: string;
}

export interface InitialisePaymentResult {
  success: boolean;
  /** The merchant checkout URL to redirect the user to */
  redirectUrl?: string;
  error?: string;
}

export interface FundWalletResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface WalletBalanceData {
  balance: string;
}

export interface GetWalletBalanceResult {
  success: boolean;
  balance?: number;
  rawBalance?: string;
  error?: string;
}

