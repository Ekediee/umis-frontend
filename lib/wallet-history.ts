import { get, set } from 'idb-keyval';

export const WALLET_FUNDING_STORAGE_KEY = 'wallet-funding-history';

export interface WalletFundingRecord {
  id: string;
  reference: string;
  amount: number;
  formattedAmount: string;
  gateway: string;
  date: string;
  time: string;
  status: "successful" | "pending" | "failed";
  description: string;
  createdAt: number;
}

// Sample records older versions added to every browser; they were never real payments
const SAMPLE_RECORD_IDS = new Set(["WF-2026-091801", "WF-2026-091002", "WF-2026-082503"]);

/**
 * Retrieves the full wallet funding history.
* Automatically aligns any previously cached records with the connected Flutterwave gateway.
 */
export async function getWalletFundingHistory(): Promise<WalletFundingRecord[]> {
  try {
    const existing = await get<WalletFundingRecord[]>(WALLET_FUNDING_STORAGE_KEY);
    if (!existing || existing.length === 0) return [];

    // Migrate any legacy/disconnected gateway references in client storage to Flutterwave
    const migrated = existing.filter((rec) => !SAMPLE_RECORD_IDS.has(rec.id)).map((rec) => {
      if (rec.gateway === "Payzeep" || rec.gateway === "Paystack" || rec.gateway === "Card / WebPay") {
        return {
          ...rec,
          gateway: "Flutterwave",
          reference: rec.reference.replace(/-(?:PYZ|BNK)$/, "-FLW").replace(/^WF-/, "FLW-"),
        };
      }
      return rec;
    });

    const isDifferent = JSON.stringify(migrated) !== JSON.stringify(existing);
    if (isDifferent) {
      await set(WALLET_FUNDING_STORAGE_KEY, migrated);
    }

    return migrated.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("[WalletHistory] Failed to retrieve wallet funding history:", error);
    return [];
  }
}

/**
 * Records a new wallet funding transaction event and persists it.
 */
export async function recordWalletFundingEvent(
  event: Omit<WalletFundingRecord, "id" | "formattedAmount" | "createdAt" | "date" | "time"> & {
    id?: string;
    date?: string;
    time?: string;
    createdAt?: number;
  }
): Promise<WalletFundingRecord> {
  const now = new Date();
  const dateStr =
    event.date ||
    now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  const timeStr =
    event.time ||
    now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  const id = event.id || `WF-${Date.now().toString(36).toUpperCase()}`;
  const formattedAmount = `₦${event.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const newRecord: WalletFundingRecord = {
    id,
    reference: event.reference,
    amount: event.amount,
    formattedAmount,
    gateway: (event.gateway && event.gateway !== "Card / WebPay" && event.gateway !== "Payzeep" && event.gateway !== "Paystack") ? event.gateway : "Flutterwave",
    date: dateStr,
    time: timeStr,
    status: event.status || "successful",
    description: event.description || "Wallet Credit • Automated Top-up",
    createdAt: event.createdAt || Date.now(),
  };

  try {
    const history = await getWalletFundingHistory();
    // Prevent duplicate references if called multiple times on re-render
    const filtered = history.filter((item) => item.reference !== newRecord.reference);
    const updated = [newRecord, ...filtered];
    await set(WALLET_FUNDING_STORAGE_KEY, updated);
    console.log(`[WalletHistory] Recorded wallet funding event ${newRecord.reference}`);
    return newRecord;
  } catch (error) {
    console.error("[WalletHistory] Failed to save wallet funding event:", error);
    return newRecord;
  }
}

