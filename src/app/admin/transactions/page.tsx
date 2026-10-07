"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { canAdminAccess } from "@/lib/adminAccess";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("bf_token")}` };
}

type AdminTab = "all" | "topup" | "earn" | "spend" | "withdrawal" | "activation" | "boost" | "refund" | "admin_credit";

interface AdminTx {
  _id: string;
  type: AdminTab;
  coins: number;
  nairaEquivalent: number;
  reference?: string;
  status: "pending" | "completed" | "failed";
  description?: string;
  createdAt: string;
  user?: {
    _id: string;
    name: string;
    username: string;
    email: string;
    adminRole?: string;
  };
}

const TABS: { key: AdminTab; label: string }[] = [
  { key: "all",          label: "All" },
  { key: "topup",        label: "Top Ups" },
  { key: "earn",         label: "Earnings" },
  { key: "spend",        label: "Contact Unlocks" },
  { key: "withdrawal",   label: "Withdrawals" },
  { key: "activation",   label: "Activations" },
  { key: "boost",        label: "Boosts" },
  { key: "refund",       label: "Refunds" },
  { key: "admin_credit", label: "Admin Credits" },
];

const TX_META: Record<string, { label: string; credit: boolean }> = {
  topup:        { label: "Top Up",         credit: true  },
  earn:         { label: "Earned",         credit: true  },
  spend:        { label: "Contact Unlock", credit: false },
  withdrawal:   { label: "Withdrawal",     credit: false },
  activation:   { label: "Activation",     credit: false },
  boost:        { label: "Boost",          credit: false },
  refund:       { label: "Refund",         credit: true  },
  admin_credit: { label: "Admin Credit",   credit: true  },
};

export default function AdminTransactionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const authBlocked = authLoading || !user;
  const canViewAnalytics = canAdminAccess(
    user?.adminPermissions,
    "analytics",
    user?.adminRole || null,
  );

  const [tab, setTab]         = useState<AdminTab>("all");
  const [items, setItems]     = useState<AdminTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(0);
  const [total, setTotal]     = useState(0);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!canViewAnalytics) { router.push("/admin"); return; }
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, canViewAnalytics, tab, page, router, user]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => fetchItems(true), 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, tab, page]);

  async function fetchItems(silent = false) {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(
        `${API}/api/wallet/admin/transactions?tab=${tab}&page=${page}&limit=30`,
        { headers: authHeader() }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.transactions || []);
      setTotal(data.total || 0);
      setPages(data.pages || 0);
      setLastRefresh(new Date());
    } catch {
      setItems([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  function handleTab(t: AdminTab) {
    setTab(t);
    setPage(1);
  }

  if (authBlocked) {
    return (
      <div className="min-h-screen bg-[#F8FAFF] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1E3A8A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!canViewAnalytics) {
    return (
      <div className="min-h-screen bg-[#F8FAFF] flex items-center justify-center px-4 text-center">
        <div className="max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-950">Access restricted</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Your admin account cannot view transactions.
          </p>
          <button onClick={() => router.push("/admin")} className="mt-5 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
            Back to admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* Header */}
        <button
          onClick={() => router.push("/admin")}
          className="mb-4 inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back to admin
        </button>

        <div className="flex items-start justify-between mb-4 gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#0F172A]">Transactions</h1>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              {total.toLocaleString()} records · refreshed {lastRefresh.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => fetchItems()}
              className="flex items-center gap-1.5 text-xs font-medium text-[#1E3A8A] bg-white border border-[#E2E8F0] px-3 py-2 rounded-xl shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Refresh
            </button>
            <button
              onClick={() => setAutoRefresh(p => !p)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl shadow-sm transition ${autoRefresh ? "bg-emerald-600 text-white" : "bg-white text-[#64748B] border border-[#E2E8F0]"}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? "bg-white animate-pulse" : "bg-[#CBD5E1]"}`} />
              Live
            </button>
          </div>
        </div>

        {/* Tab grid — 3 per row, fully responsive */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleTab(key)}
              className={`text-xs font-semibold px-2 py-2.5 rounded-xl transition active:scale-95 text-center leading-tight ${
                tab === key
                  ? "bg-[#1E3A8A] text-white shadow-md"
                  : "bg-white text-[#64748B] shadow-sm"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Row count + pagination (top) */}
        {!loading && items.length > 0 && (
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] text-[#94A3B8]">{items.length} shown</span>
            {pages > 1 && <span className="text-[11px] text-[#94A3B8]">Page {page} of {pages}</span>}
          </div>
        )}

        {/* Card list — no horizontal scroll needed, works everywhere */}
        <div className="space-y-2">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-4 animate-pulse">
                <div className="h-4 bg-[#F1F5F9] rounded w-1/2 mb-2" />
                <div className="h-3 bg-[#F1F5F9] rounded w-1/3 mb-3" />
                <div className="h-3 bg-[#F1F5F9] rounded w-full" />
              </div>
            ))
          ) : items.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm text-center py-16 text-sm text-[#94A3B8]">
              No transactions found
            </div>
          ) : (
            items.map((tx) => <TxCard key={tx._id} tx={tx} />)
          )}
        </div>

        {/* Pagination (bottom) */}
        {pages > 1 && (
          <div className="flex items-center justify-between mt-4 bg-white rounded-2xl shadow-sm px-4 py-3">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="text-xs font-medium text-[#1E3A8A] disabled:opacity-30 px-3 py-1.5 rounded-xl bg-[#F8FAFF]"
            >
              ← Prev
            </button>
            <span className="text-xs text-[#94A3B8]">Page {page} of {pages}</span>
            <button
              disabled={page >= pages}
              onClick={() => setPage(p => p + 1)}
              className="text-xs font-medium text-[#1E3A8A] disabled:opacity-30 px-3 py-1.5 rounded-xl bg-[#F8FAFF]"
            >
              Next →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Coin icon SVG (inline, no emoji) ────────────────────────────────────────

function CoinIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="7" fill="#F5A623" stroke="#D4881A" strokeWidth="1"/>
      <circle cx="8" cy="8" r="5" fill="#F7B731" stroke="#D4881A" strokeWidth="0.5" opacity="0.6"/>
      <text x="8" y="11.5" textAnchor="middle" fontSize="6" fontWeight="700" fill="#A0620D" fontFamily="sans-serif">₦</text>
    </svg>
  );
}

// ─── Transaction card (replaces table row) ────────────────────────────────────

function TxCard({ tx }: { tx: AdminTx }) {
  const meta = TX_META[tx.type] ?? { label: tx.type, credit: true };
  const date = new Date(tx.createdAt);
  const now  = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const timeStr = isToday
    ? date.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "2-digit" }) +
      " " + date.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });

  const isAdmin = tx.user?.adminRole === "super-admin";

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      {/* Top row: user + coins */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#0F172A] truncate flex items-center gap-1">
            {tx.user?.name ?? "—"}
            {isAdmin && (
              <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full shrink-0">
                ADMIN
              </span>
            )}
          </p>
          <p className="text-[10px] text-[#94A3B8] truncate">@{tx.user?.username ?? "—"}</p>
        </div>
        <div className="text-right shrink-0">
          <span className={`flex items-center justify-end gap-1 text-sm font-black ${
            meta.credit ? "text-emerald-600" : "text-red-500"
          }`}>
            {meta.credit ? "+" : "−"}
            <CoinIcon className="w-3.5 h-3.5 inline-block" />
            {tx.coins.toLocaleString()}
          </span>
          <p className="text-[10px] text-[#64748B] font-medium mt-0.5">₦{tx.nairaEquivalent.toLocaleString()}</p>
        </div>
      </div>

      {/* Badges row */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
          meta.credit ? "bg-emerald-50 text-emerald-700" : "bg-[#FFF7ED] text-orange-700"
        }`}>
          {meta.label}
        </span>
        <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          tx.status === "completed" ? "bg-emerald-100 text-emerald-700" :
          tx.status === "pending"   ? "bg-amber-100 text-amber-700" :
                                      "bg-red-100 text-red-600"
        }`}>
          {tx.status}
        </span>
        <span className="text-[10px] text-[#CBD5E1] ml-auto whitespace-nowrap">{timeStr}</span>
      </div>

      {/* Note / reference */}
      {(tx.description || tx.reference) && (
        <p className="text-[10px] text-[#94A3B8] truncate border-t border-[#F1F5F9] pt-2">
          {tx.description || `Ref: ${tx.reference}`}
        </p>
      )}
    </div>
  );
}
