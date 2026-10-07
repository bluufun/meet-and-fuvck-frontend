"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { getAdminRedirect, shouldFetchAdminData, isAdminUser } from "@/lib/adminGuards";

// ── Icons (stroke-based, no emoji) ───────────────────────────────────────────
function Icon({ name, className = "w-5 h-5" }: { name: string; className?: string }) {
  const icons: Record<string, React.ReactElement> = {
    trophy: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4M7 4h10v4a5 5 0 01-10 0V4zM7 6H4a2 2 0 002 4M17 6h3a2 2 0 01-2 4" />
      </svg>
    ),
    coin: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9.5c0-1 1-1.5 2.5-1.5s2.5.5 2.5 1.5-1 1.25-2.5 1.5-2.5.5-2.5 1.5 1 1.5 2.5 1.5 2.5-.5 2.5-1.5M12 7v1m0 8v1" />
      </svg>
    ),
    rocket: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    users: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    chevronRight: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    ),
    x: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    empty: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  };
  return icons[name] ?? <span className={className} />;
}

interface LeaderboardRow {
  referrerId: string;
  name: string;
  username: string;
  referralCode: string;
  activationCoins: number;
  boostCoins: number;
  totalCoins: number;
  successfulReferrals: number;
}

interface TraceEntry {
  _id: string;
  type: "activation" | "boost";
  coins: number;
  createdAt: string;
  refereeId: { _id: string; name: string; username: string; email: string };
}

export default function AdminReferralsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeRow, setActiveRow] = useState<LeaderboardRow | null>(null);
  const [trace, setTrace] = useState<TraceEntry[]>([]);
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceTab, setTraceTab] = useState<"all" | "activation" | "boost">("all");
  const hasAdminRole = isAdminUser(user);

  useEffect(() => {
    const redirect = getAdminRedirect("/admin/referals", authLoading, user);
    if (redirect) {
      router.replace(redirect);
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!shouldFetchAdminData(authLoading, user, hasAdminRole)) return;
    api.referrals
      .adminLeaderboard()
      .then((data) => setLeaderboard(data.leaderboard))
      .catch((e) => setError(e.message || "Could not load referral data"))
      .finally(() => setLoading(false));
  }, [authLoading, hasAdminRole, user]);

  if (authLoading || !user || !hasAdminRole) {
    return (
      <div className="min-h-screen bg-[#F8FAFF] px-4 py-8 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1E3A8A] border-t-transparent" />
      </div>
    );
  }

  async function openTrace(row: LeaderboardRow) {
    setActiveRow(row);
    setTraceTab("all");
    setTraceLoading(true);
    try {
      const data = await api.referrals.adminTrace(row.referrerId);
      setTrace(data.entries);
    } catch {
      setTrace([]);
    } finally {
      setTraceLoading(false);
    }
  }

  const totals = leaderboard.reduce(
    (acc, r) => ({
      activation: acc.activation + r.activationCoins,
      boost: acc.boost + r.boostCoins,
      referrals: acc.referrals + r.successfulReferrals,
    }),
    { activation: 0, boost: 0, referrals: 0 }
  );

  const filteredTrace = trace.filter((t) => traceTab === "all" || t.type === traceTab);

  return (
    <div className="min-h-screen bg-[#F8FAFF] px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.push("/admin")}
          className="mb-4 inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back to admin
        </button>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-[#1E3A8A] flex items-center justify-center shrink-0">
            <Icon name="trophy" className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A]">Referral Leaderboard</h1>
            <p className="text-xs text-[#64748B]">Sorted by total commission earned, highest first</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <SummaryCard iconName="users" label="Successful referrals" value={totals.referrals} />
          <SummaryCard iconName="rocket" label="Activation coins paid" value={totals.activation} />
          <SummaryCard iconName="coin" label="Boost coins paid" value={totals.boost} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        {/* Leaderboard table */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-5 py-3 bg-[#F8FAFF] border-b border-[#E2E8F0] text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
            <span>Referrer</span>
            <span className="text-right">Referrals</span>
            <span className="text-right">Activation</span>
            <span className="text-right">Boost</span>
            <span className="text-right">Total</span>
          </div>

          {loading ? (
            <div className="px-5 py-10 text-center text-sm text-[#94A3B8]">Loading…</div>
          ) : leaderboard.length === 0 ? (
            <div className="px-5 py-12 flex flex-col items-center text-center gap-2">
              <Icon name="empty" className="w-8 h-8 text-[#CBD5E1]" />
              <p className="text-sm text-[#94A3B8]">No referral activity yet</p>
            </div>
          ) : (
            leaderboard.map((row, i) => (
              <button
                key={row.referrerId}
                onClick={() => openTrace(row)}
                className="w-full grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-center px-5 py-3.5 border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFF] transition text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${i < 3 ? "bg-[#EFF6FF] text-[#1E3A8A]" : "bg-[#F1F5F9] text-[#94A3B8]"}`}>
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0F172A] truncate">{row.name}</p>
                    <p className="text-xs text-[#94A3B8] truncate">@{row.username} · {row.referralCode}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-[#334155] text-right">{row.successfulReferrals}</span>
                <span className="text-sm font-medium text-[#334155] text-right">{row.activationCoins}</span>
                <span className="text-sm font-medium text-[#334155] text-right">{row.boostCoins}</span>
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-sm font-bold text-[#1E3A8A]">{row.totalCoins}</span>
                  <Icon name="chevronRight" className="w-3.5 h-3.5 text-[#CBD5E1]" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Trace drawer */}
      {activeRow && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4">
          <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={() => setActiveRow(null)} />

          <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9]">
              <div>
                <p className="text-sm font-bold text-[#0F172A]">{activeRow.name}</p>
                <p className="text-xs text-[#94A3B8]">@{activeRow.username} · {activeRow.referralCode}</p>
              </div>
              <button
                onClick={() => setActiveRow(null)}
                className="w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center hover:bg-[#E2E8F0] transition"
              >
                <Icon name="x" className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 px-5 pt-3">
              {(["all", "activation", "boost"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTraceTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                    traceTab === tab
                      ? "bg-[#1E3A8A] text-white"
                      : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {traceLoading ? (
                <div className="py-10 text-center text-sm text-[#94A3B8]">Loading…</div>
              ) : filteredTrace.length === 0 ? (
                <div className="py-10 flex flex-col items-center gap-2">
                  <Icon name="empty" className="w-7 h-7 text-[#CBD5E1]" />
                  <p className="text-sm text-[#94A3B8]">No entries for this filter</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredTrace.map((entry) => (
                    <div key={entry._id} className="flex items-center gap-3 border border-[#F1F5F9] rounded-xl px-3.5 py-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${entry.type === "activation" ? "bg-[#EFF6FF]" : "bg-amber-50"}`}>
                        <Icon
                          name={entry.type === "activation" ? "rocket" : "coin"}
                          className={`w-3.5 h-3.5 ${entry.type === "activation" ? "text-[#1E3A8A]" : "text-amber-600"}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0F172A] truncate">
                          {entry.refereeId?.name ?? "Unknown user"}
                        </p>
                        <p className="text-xs text-[#94A3B8] truncate">
                          @{entry.refereeId?.username} · {entry.type} ·{" "}
                          {new Date(entry.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-[#1E3A8A] shrink-0">+{entry.coins}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ iconName, label, value }: { iconName: string; label: string; value: number }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
      <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center mb-2">
        <Icon name={iconName} className="w-4 h-4 text-[#1E3A8A]" />
      </div>
      <p className="text-lg font-bold text-[#0F172A]">{value}</p>
      <p className="text-xs text-[#94A3B8]">{label}</p>
    </div>
  );
}
