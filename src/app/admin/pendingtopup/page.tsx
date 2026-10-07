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

interface PendingTopup {
  _id: string;
  coins: number;
  nairaAmount: number;
  narration: string;
  reference: string;
  senderName?: string;
  createdAt: string;
}

interface KnownUser {
  _id: string;
  name: string;
  username: string;
  email: string;
}

export default function AdminPendingTopupsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const authBlocked = authLoading || !user;
  const canReviewAnalytics = canAdminAccess(
    user?.adminPermissions,
    "analytics",
    user?.adminRole || null,
  ) || canAdminAccess(user?.adminPermissions, "withdrawals", user?.adminRole || null);

  const [items, setItems]           = useState<PendingTopup[]>([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(0);
  const [total, setTotal]           = useState(0);

  // Per-item approval state
  const [approving, setApproving]   = useState<string | null>(null);
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState<Record<string, string>>({});     // itemId → query
  const [userResults, setUserResults] = useState<Record<string, KnownUser[]>>({}); // itemId → results
  const [selectedUser, setSelectedUser] = useState<Record<string, KnownUser | null>>({});
  const [adminNote, setAdminNote]   = useState<Record<string, string>>({});
  const [searchLoading, setSearchLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!canReviewAnalytics) { router.push("/admin"); return; }
    fetchItems();
  }, [authLoading, canReviewAnalytics, page, router, user]);

  async function fetchItems() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/wallet/admin/pending?page=${page}&limit=20`, { headers: authHeader() });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function searchUsers(itemId: string, query: string) {
    setUserSearch((p) => ({ ...p, [itemId]: query }));
    if (query.length < 2) { setUserResults((p) => ({ ...p, [itemId]: [] })); return; }
    setSearchLoading((p) => ({ ...p, [itemId]: true }));
    try {
      // Search users via admin endpoint — adjust URL if you have a search endpoint
      const res = await fetch(`${API}/api/admin/users/search?q=${encodeURIComponent(query)}`, { headers: authHeader() });
      if (!res.ok) return;
      const data = await res.json();
      setUserResults((p) => ({ ...p, [itemId]: data.users || [] }));
    } catch {} finally {
      setSearchLoading((p) => ({ ...p, [itemId]: false }));
    }
  }

  async function handleApprove(item: PendingTopup) {
    const target = selectedUser[item._id];
    if (!target) return;
    setApproving(item._id);
    try {
      const res = await fetch(`${API}/api/wallet/admin/pending/${item._id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ userId: target._id, adminNote: adminNote[item._id] || "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(
          friendlyApiMessage(
            data.message,
            "We couldn't approve that payment right now.",
          ),
        );
        return;
      }
      setItems((p) => p.filter((i) => i._id !== item._id));
      setTotal((t) => t - 1);
    } catch {
      alert("Something went wrong");
    } finally {
      setApproving(null);
    }
  }

  if (authBlocked || loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFF] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1E3A8A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!canReviewAnalytics) {
    return (
      <div className="min-h-screen bg-[#F8FAFF] flex items-center justify-center px-4 text-center">
        <div className="max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-950">Access restricted</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Your admin account cannot review pending topups.
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

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push("/admin")}
            className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to admin
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[#0F172A]">Pending Topups</h1>
            <p className="text-xs text-[#94A3B8]">Payments received but reference not matched automatically</p>
          </div>
          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full">{total} pending</span>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-2">✅</p>
            <p className="text-sm text-[#94A3B8]">No pending topups — all payments matched automatically</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const isExpanded = expanded === item._id;
              const isApproving = approving === item._id;
              const picked = selectedUser[item._id];

              return (
                <div key={item._id} className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
                  {/* Summary row */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : item._id)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#F8FAFF] transition"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-lg shrink-0">🪙</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-[#0F172A]">🪙 {item.coins} coins · ₦{item.nairaAmount.toLocaleString()}</p>
                        <span className="text-xs text-[#94A3B8]">{new Date(item.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</span>
                      </div>
                      <p className="text-xs text-[#64748B] truncate">Ref: <span className="font-mono font-semibold">{item.reference}</span> · {item.senderName || "Unknown sender"}</p>
                    </div>
                    <span className="text-[#94A3B8] text-xs">{isExpanded ? "▲" : "▼"}</span>
                  </button>

                  {/* Expanded — assign to user and approve */}
                  {isExpanded && (
                    <div className="border-t border-[#F1F5F9] p-4 space-y-3">
                      <div className="bg-[#F8FAFF] rounded-xl p-3 text-xs space-y-1">
                        <p><span className="text-[#94A3B8]">Narration:</span> <span className="font-mono text-[#0F172A]">{item.narration}</span></p>
                        <p><span className="text-[#94A3B8]">Reference:</span> <span className="font-mono font-bold text-[#1E3A8A]">{item.reference}</span></p>
                        {item.senderName && <p><span className="text-[#94A3B8]">Sender:</span> {item.senderName}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Assign to user</label>
                        <input
                          type="text"
                          placeholder="Search by name, username or email…"
                          value={userSearch[item._id] || ""}
                          onChange={(e) => searchUsers(item._id, e.target.value)}
                          className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3B82F6]"
                        />

                        {searchLoading[item._id] && <p className="text-xs text-[#94A3B8] mt-1">Searching…</p>}

                        {(userResults[item._id] || []).length > 0 && !picked && (
                          <div className="border border-[#E2E8F0] rounded-xl mt-1 overflow-hidden">
                            {userResults[item._id].map((u) => (
                              <button
                                key={u._id}
                                onClick={() => {
                                  setSelectedUser((p) => ({ ...p, [item._id]: u }));
                                  setUserResults((p) => ({ ...p, [item._id]: [] }));
                                  setUserSearch((p) => ({ ...p, [item._id]: `${u.name} (@${u.username})` }));
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#F8FAFF] border-b border-[#F1F5F9] last:border-0 text-left"
                              >
                                <div className="w-7 h-7 rounded-full bg-[#1E3A8A] flex items-center justify-center text-white text-xs font-bold shrink-0">
                                  {u.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-[#0F172A]">{u.name}</p>
                                  <p className="text-[10px] text-[#94A3B8]">@{u.username} · {u.email}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {picked && (
                          <div className="flex items-center gap-2 mt-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                            <span className="text-emerald-600 text-sm">✓</span>
                            <p className="text-xs font-semibold text-emerald-800 flex-1">{picked.name} (@{picked.username})</p>
                            <button onClick={() => setSelectedUser((p) => ({ ...p, [item._id]: null }))} className="text-xs text-[#94A3B8]">✕</button>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Admin note (optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Verified via bank statement"
                          value={adminNote[item._id] || ""}
                          onChange={(e) => setAdminNote((p) => ({ ...p, [item._id]: e.target.value }))}
                          className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3B82F6]"
                        />
                      </div>

                      <button
                        onClick={() => handleApprove(item)}
                        disabled={!picked || isApproving}
                        className="w-full bg-emerald-600 text-white font-semibold text-sm py-3 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
                      >
                        {isApproving ? (
                          <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing…</>
                        ) : (
                          <>✓ Approve · Credit 🪙 {item.coins} to {picked?.name ?? "user"}</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#E2E8F0]">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="text-sm text-[#1E3A8A] font-medium disabled:opacity-30 px-4 py-2 rounded-xl border border-[#E2E8F0] bg-white">← Prev</button>
            <span className="text-xs text-[#94A3B8]">Page {page} of {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="text-sm text-[#1E3A8A] font-medium disabled:opacity-30 px-4 py-2 rounded-xl border border-[#E2E8F0] bg-white">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
