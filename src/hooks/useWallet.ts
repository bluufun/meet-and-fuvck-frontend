"use client";
import { useState, useCallback, useEffect } from "react";
import { friendlyApiMessage } from "@/lib/apiMessages";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";


function authHeader(): HeadersInit {
  if (typeof window === "undefined") return {};

  return {
    Authorization: `Bearer ${localStorage.getItem("bf_token") ?? ""}`,
  };
}

export interface WalletBalance {
  topupBalance: number;
  earnBalance: number;
  bonusBalance: number;
  totalBalance: number;
}

export interface WalletTransaction {
  _id: string;
  type: "topup" | "earn" | "spend" | "withdrawal" | "activation" | "boost" | "refund" | "admin_credit";
  coins: number;
  nairaEquivalent: number;
  reference?: string;
  status: "pending" | "completed" | "failed";
  description?: string;
  createdAt: string;
}

export interface WithdrawalRequest {
  _id: string;
  coins: number;
  nairaAmount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: "pending" | "completed" | "rejected";
  adminNote?: string;
  createdAt: string;
}

export interface ReservedAccount {
  merchantReference: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: "pending" | "active" | "failed";
  attemptedBanks: string[];
  lastError: string | null;
}

export interface ReservedAccountState {
  status: "active" | "locked" | "missing" | "pending" | "failed";
  eligible: boolean;
  canGenerate: boolean;
  reason: string | null;
  reservedAccount: ReservedAccount | null;
}

export interface WalletRealtimeEvent {
  type: "wallet_credited" | "wallet_notice";
  message: string;
  wallet?: WalletBalance;
  transaction?: WalletTransaction;
}

export function useWallet() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txPages, setTxPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [reservedAccount, setReservedAccount] = useState<ReservedAccount | null>(null);
  const [reservedAccountState, setReservedAccountState] = useState<ReservedAccountState | null>(null);
  const [walletSignal, setWalletSignal] = useState<WalletRealtimeEvent | null>(null);

  const fetchWallet = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/wallet`, { headers: authHeader() });
      if (!res.ok) return null;
      const data = await res.json();
      setBalance(data.wallet);
      setReservedAccount(data.reservedAccount || null);
      setReservedAccountState(data.reservedAccountState || null);
      return data as {
        wallet: WalletBalance;
        reservedAccount: ReservedAccount | null;
        reservedAccountState: ReservedAccountState | null;
      };
    } catch {}
    finally { setLoading(false); }
    return null;
  }, []);

  const fetchReservedAccount = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/wallet/reserved-account`, { headers: authHeader() });
      if (!res.ok) return null;
      const data = await res.json();
      setReservedAccount(data.reservedAccount || null);
      setReservedAccountState(data.reservedAccountState || null);
      return (data.reservedAccount || null) as ReservedAccount | null;
    } catch {
      return null;
    }
  }, []);

  const fetchTransactions = useCallback(async (page = 1) => {
    setTxLoading(true);
    try {
      const res = await fetch(
        `${API}/api/wallet/transactions?page=${page}&limit=15&type=all`,
        { headers: authHeader() }
      );
      if (!res.ok) return;
      const data = await res.json();
      setTransactions(data.transactions);
      setTxTotal(data.total);
      setTxPages(data.pages);
    } catch {}
    finally { setTxLoading(false); }
  }, []);

  const initiateTopup = useCallback(async (coins: number) => {
    const res = await fetch(`${API}/api/wallet/initiate-topup`, {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ coins }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(friendlyApiMessage(data?.message, "We couldn't start the top-up right now."));
    return data as { reference: string; coins: number; nairaAmount: number; expiresAt: string };
  }, []);

  const confirmPayment = useCallback(async () => {
    const res = await fetch(`${API}/api/wallet/confirm-payment`, {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(friendlyApiMessage(data?.message, "We couldn't confirm that payment yet."));
    return data as {
      status: "confirmed" | "pending" | "expired";
      coins?: number;
      nairaAmount?: number;
      newBalance?: WalletBalance;
    };
  }, []);

  const generateReservedAccount = useCallback(async () => {
    const res = await fetch(`${API}/api/wallet/reserved-account/generate`, {
      method: "POST",
      headers: authHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(friendlyApiMessage(data?.message, "We couldn't create a reserved account right now."));
    setReservedAccount(data.reservedAccount || null);
    setReservedAccountState(data.reservedAccountState || null);
    return data as {
      message: string;
      reservedAccount: ReservedAccount | null;
      reservedAccountState: ReservedAccountState | null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("bf_token");
    if (!token) return;

    let stream: EventSource | null = null;
    let cancelled = false;

    const openStream = async () => {
      try {
        const res = await fetch(`${API}/api/wallet/stream-token`, {
          headers: authHeader(),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data?.token) return;

        stream = new EventSource(
          `${API}/api/wallet/stream?token=${encodeURIComponent(data.token)}`
        );

        stream.addEventListener("wallet-update", handleWalletUpdate as unknown as EventListener);
        stream.onerror = () => {};
      } catch {}
    };

    const handleWalletUpdate = async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as WalletRealtimeEvent;
        setWalletSignal(data);

        if (data.type === "wallet_credited") {
          if (data.wallet) {
            setBalance(data.wallet);
          }
          await fetchWallet();
          await fetchTransactions(1);
          await fetchReservedAccount();
        }
      } catch {}
    };

    void openStream();

    return () => {
      cancelled = true;
      if (stream) {
        stream.removeEventListener("wallet-update", handleWalletUpdate as unknown as EventListener);
        stream.close();
      }
    };
  }, [fetchWallet, fetchTransactions, fetchReservedAccount]);

  const submitWithdrawal = useCallback(async (payload: {
    coins: number; bankName: string; accountNumber: string; accountName: string;
  }) => {
    const res = await fetch(`${API}/api/withdrawal`, {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(friendlyApiMessage(data?.message, "We couldn't submit your withdrawal right now."));
    return data as { message: string; withdrawal: WithdrawalRequest; remainingEarnBalance: number };
  }, []);

  return {
    balance,
    transactions,
    txTotal,
    txPages,
    loading,
    txLoading,
    reservedAccount,
    fetchWallet,
    fetchReservedAccount,
    fetchTransactions,
    initiateTopup,
    confirmPayment,
    generateReservedAccount,
    submitWithdrawal,
    setBalance,
    setReservedAccount,
    reservedAccountState,
    setReservedAccountState,
    walletSignal,
  };
}
