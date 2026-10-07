"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { friendlyApiMessage } from "@/lib/apiMessages";
import { canAdminAccess } from "@/lib/adminAccess";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("bf_token")}` };
}

interface WithdrawalItem {
  _id: string;
  coins: number;
  nairaAmount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: "pending" | "completed" | "rejected";
  adminNote?: string;
  createdAt: string;
  userId: { _id: string; name: string; username: string; email: string } | null;
}

type Tab = "pending" | "completed" | "rejected" | "all";

export default function AdminWithdrawalsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const authBlocked = authLoading || !user;
  const canReviewWithdrawals = canAdminAccess(
    user?.adminPermissions,
    "withdrawals",
    user?.adminRole || null,
  );

  const [tab, setTab]         = useState<Tab>("pending");
  const [items, setItems]     = useState<WithdrawalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(0);
  const [total, setTotal]     = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!canReviewWithdrawals) { router.push("/admin"); return; }
    fetchItems();
  }, [authLoading, canReviewWithdrawals, tab, page, router, user]);

  async function fetchItems() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/withdrawal/admin?status=${tab}&page=${page}&limit=20`, { headers: authHeader() });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setItems(data.withdrawals || []);
      setTotal(data.total || 0);
      setPages(data.pages || 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkSent(id: string) {
    setProcessingId(id);
    try {
      const res = await fetch(`${API}/api/withdrawal/admin/${id}/mark-sent`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ adminNote: noteDraft[id] || "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(
          friendlyApiMessage(
            data.message,
            "We couldn't mark that withdrawal as sent.",
          ),
        );
        return;
      }
      setItems((p) => p.filter((i) => i._id !== id));
      setTotal((t) => t - 1);
    } catch {
      alert("Something went wrong");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(id: string) {
    if (!confirm("Reject this withdrawal? Coins will be refunded to the user's earn balance.")) return;
    setProcessingId(id);
    try {
      const res = await fetch(`${API}/api/withdrawal/admin/${id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ adminNote: noteDraft[id] || "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(
          friendlyApiMessage(
            data.message,
            "We couldn't reject that withdrawal right now.",
          ),
        );
        return;
      }
      setItems((p) => p.filter((i) => i._id !== id));
      setTotal((t) => t - 1);
    } catch {
      alert("Something went wrong");
    } finally {
      setProcessingId(null);
    }
  }

  if (authBlocked || loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFF] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1E3A8A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!canReviewWithdrawals) {
    return (
      <div className="min-h-screen bg-[#F8FAFF] flex items-center justify-center px-4 text-center">
        <div className="max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-950">Access restricted</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Your admin account cannot review withdrawals.
          </p>
          <button onClick={() => router.push("/admin")} className="mt-5 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
            Back to admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF] py-6 px-4">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => router.push("/admin")}
            className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to admin
          </button>
        </div>

        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-[#0F172A]">Withdrawal requests</h1>
          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full">{total}</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {(["pending", "completed", "rejected", "all"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setPage(1); }}
              className={`shrink-0 text-xs font-medium px-4 py-2 rounded-xl capitalize transition ${
                tab === t ? "bg-[#1E3A8A] text-white" : "bg-white text-[#64748B] shadow-sm"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-2">🏦</p>
            <p className="text-sm text-[#94A3B8]">No {tab !== "all" ? tab : ""} withdrawal requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const isProcessing = processingId === item._id;
              return (
                <div key={item._id} className="bg-white rounded-2xl shadow-sm p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-lg shrink-0">🏦</div>
                      <div>
                        <p className="text-sm font-bold text-[#0F172A]">{item.userId?.name ?? "Unknown user"}</p>
                        <p className="text-xs text-[#94A3B8]">@{item.userId?.username} · {item.userId?.email}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                      item.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                      item.status === "pending"   ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-600"
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="bg-[#F8FAFF] rounded-xl p-3 text-xs space-y-1.5 mb-3">
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8]">Amount</span>
                      <span className="font-bold text-[#0F172A]">🪙 {item.coins} coins · ₦{item.nairaAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8]">Bank</span>
                      <span className="font-semibold text-[#0F172A]">{item.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8]">Account number</span>
                      <span className="font-mono font-semibold text-[#0F172A]">{item.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8]">Account name</span>
                      <span className="font-semibold text-[#0F172A]">{item.accountName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8]">Requested</span>
                      <span className="text-[#64748B]">{new Date(item.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    {item.adminNote && (
                      <div className="flex justify-between">
                        <span className="text-[#94A3B8]">Note</span>
                        <span className="text-[#64748B] text-right">{item.adminNote}</span>
                      </div>
                    )}
                  </div>

                  {item.status === "pending" && (
                    <>
                      <input
                        type="text"
                        placeholder="Optional note (e.g. transfer reference)"
                        value={noteDraft[item._id] || ""}
                        onChange={(e) => setNoteDraft((p) => ({ ...p, [item._id]: e.target.value }))}
                        className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs mb-3 focus:outline-none focus:border-[#3B82F6]"
                      />
                      <div className="flex gap-2.5">
                        <button
                          onClick={() => handleReject(item._id)}
                          disabled={isProcessing}
                          className="flex-1 border border-red-200 text-red-600 text-xs font-semibold py-2.5 rounded-xl disabled:opacity-50"
                        >
                          Reject & refund
                        </button>
                        <button
                          onClick={() => handleMarkSent(item._id)}
                          disabled={isProcessing}
                          className="flex-1 bg-emerald-600 text-white text-xs font-semibold py-2.5 rounded-xl disabled:opacity-50"
                        >
                          {isProcessing ? "Processing…" : "✓ Mark as sent"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#E2E8F0]">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="text-sm text-[#1E3A8A] font-medium disabled:opacity-30 px-4 py-2 rounded-xl bg-white shadow-sm">← Prev</button>
            <span className="text-xs text-[#94A3B8]">Page {page} of {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="text-sm text-[#1E3A8A] font-medium disabled:opacity-30 px-4 py-2 rounded-xl bg-white shadow-sm">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
