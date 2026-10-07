"use client";

import { useEffect, useState, useCallback, ReactElement } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { canAdminAccess } from "@/lib/adminAccess";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("bf_token")}` };
}

type RangeKey = "24h" | "7d" | "30d" | "custom";
type RevTab = "all" | "activation" | "boost" | "contact_unlock";

interface RevenueSummary {
  totalRevenue: number;
  breakdown: {
    activation: { naira: number; coins: number; count: number };
    boost: { naira: number; coins: number; count: number };
    contactUnlock: { naira: number; grossNaira: number; sharePercent: number; count: number };
  };
}

interface ChartPoint {
  bucket: string;
  activation: number;
  boost: number;
  contactUnlock: number;
  total: number;
}

interface RevenueTx {
  _id: string;
  type: "activation" | "boost" | "spend";
  coins: number;
  nairaEquivalent: number;
  adminRevenue: number;
  reference?: string;
  status: string;
  description?: string;
  createdAt: string;
  user?: { name?: string; username?: string; email?: string };
}

const RANGE_TABS: { key: RangeKey; label: string; icon: string }[] = [
  { key: "24h",    label: "24 Hours", icon: "clock" },
  { key: "7d",     label: "7 Days",   icon: "week" },
  { key: "30d",    label: "30 Days",  icon: "month" },
  { key: "custom", label: "Custom",   icon: "calendar" },
];

const REV_TABS: { key: RevTab; label: string; icon: string }[] = [
  { key: "all",            label: "All",             icon: "grid" },
  { key: "activation",     label: "Activations",     icon: "bolt" },
  { key: "boost",          label: "Boosts",          icon: "rocket" },
  { key: "contact_unlock", label: "Contact Unlocks", icon: "users" },
];

const RANGE_PERIOD_LABEL: Record<RangeKey, string> = {
  "24h": "last 24 hours",
  "7d": "last 7 days",
  "30d": "last 30 days",
  "custom": "selected range",
};

function TabIcon({ name, className = "w-3.5 h-3.5" }: { name: string; className?: string }) {
 const paths: Record<string, ReactElement> = {
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </>
    ),
    week: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </>
    ),
    month: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4M7 14h.01M12 14h.01M17 14h.01M7 17h.01M12 17h.01" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
        <path d="M9 15l2 2 4-4" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    bolt: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" strokeLinejoin="round" />,
    rocket: (
      <>
        <path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2l6-6-3-3-6 6z" />
        <path d="M14 10l3-3a4 4 0 0 0-3-6 4 4 0 0 0-3 3l-3 3 3 3z" />
        <circle cx="17" cy="6" r="1" fill="currentColor" stroke="none" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3 2.5-5 6-5s6 2 6 5" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M21 20c0-2.3-1.7-4-4-4.3" />
      </>
    ),
  };
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      {paths[name] ?? null}
    </svg>
  );
}

const TX_META: Record<string, { label: string }> = {
  activation: { label: "Activation" },
  boost:      { label: "Boost" },
  spend:      { label: "Contact Unlock (40%)" },
};

function naira(n: number) {
  return `₦${Math.round(n).toLocaleString()}`;
}

function formatBucketLabel(bucket: string, groupBy: "hour" | "day") {
  const d = new Date(bucket);
  if (groupBy === "hour") {
    return d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

const REVENUE_SERIES_LABELS: Record<string, string> = {
  total: "Total",
  activation: "Activations",
  boost: "Boosts",
  contactUnlock: "Unlocks",
};

// Custom tooltip content — recharts clones this element and injects
// active/payload/label at runtime, so we own the prop shape ourselves
// instead of fighting recharts' overloaded Formatter<ValueType, NameType> type.
function RevenueTooltip({
  active,
  payload,
  label,
  groupBy,
}: {
  active?: boolean;
  payload?: any[];
  label?: any;
  groupBy: "hour" | "day";
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] px-3 py-2 shadow-sm">
      <p className="text-[11px] font-semibold text-[#0F172A] mb-1">
        {formatBucketLabel(String(label), groupBy)}
      </p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} className="text-[11px]" style={{ color: entry.color }}>
          {REVENUE_SERIES_LABELS[entry.dataKey] ?? entry.dataKey}: {naira(Number(entry.value) || 0)}
        </p>
      ))}
    </div>
  );
}

export default function AdminEarningsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const authBlocked = authLoading || !user;
  const canViewAnalytics = canAdminAccess(
    user?.adminPermissions,
    "analytics",
    user?.adminRole || null,
  );

  // ── Summary card
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // ── Chart
  const [range, setRange] = useState<RangeKey>("7d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<"hour" | "day">("day");

  // ── Transaction log
  const [tab, setTab]         = useState<RevTab>("all");
  const [items, setItems]     = useState<RevenueTx[]>([]);
  const [logLoading, setLogLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(0);
  const [total, setTotal]     = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!canViewAnalytics) { router.push("/admin"); return; }
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, canViewAnalytics, router, user]);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await fetch(`${API}/api/wallet/admin/revenue/summary`, { headers: authHeader() });
      if (!res.ok) throw new Error();
      setSummary(await res.json());
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchChart = useCallback(async () => {
    if (range === "custom" && (!customStart || !customEnd)) return;
    setChartLoading(true);
    try {
      const params = new URLSearchParams({ range });
      if (range === "custom") {
        params.set("start", customStart);
        params.set("end", customEnd);
      }
      const res = await fetch(`${API}/api/wallet/admin/revenue/chart?${params}`, { headers: authHeader() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setChartData(data.series || []);
      setGroupBy(data.groupBy || "day");
    } catch {
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  }, [range, customStart, customEnd]);

  const fetchLog = useCallback(async () => {
    if (range === "custom" && (!customStart || !customEnd)) return;
    setLogLoading(true);
    try {
      const params = new URLSearchParams({ tab, range, page: String(page), limit: "20" });
      if (range === "custom") {
        params.set("start", customStart);
        params.set("end", customEnd);
      }
      const res = await fetch(`${API}/api/wallet/admin/revenue/transactions?${params}`, { headers: authHeader() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.transactions || []);
      setTotal(data.total || 0);
      setPages(data.pages || 0);
    } catch {
      setItems([]);
    } finally {
      setLogLoading(false);
    }
  }, [tab, range, page, customStart, customEnd]);

  useEffect(() => { if (!authLoading && canViewAnalytics) fetchChart(); }, [fetchChart, authLoading, canViewAnalytics]);
  useEffect(() => { if (!authLoading && canViewAnalytics) fetchLog(); }, [fetchLog, authLoading, canViewAnalytics]);

  const periodTotals = {
    total: chartData.reduce((s, p) => s + p.total, 0),
    activation: chartData.reduce((s, p) => s + p.activation, 0),
    boost: chartData.reduce((s, p) => s + p.boost, 0),
    contactUnlock: chartData.reduce((s, p) => s + p.contactUnlock, 0),
  };

  function handleRange(r: RangeKey) {
    setRange(r);
    setPage(1);
  }

  function handleTab(t: RevTab) {
    setTab(t);
    setPage(1);
  }

  function formatBucket(bucket: string) {
    return formatBucketLabel(bucket, groupBy);
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
            Your admin account cannot view earnings analytics.
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

        <button
          onClick={() => router.push("/admin")}
          className="mb-4 inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back to admin
        </button>

        <h1 className="text-xl font-bold text-[#0F172A] mb-1">Admin Earnings</h1>
        <p className="text-xs text-[#94A3B8] mb-5">Revenue from activations, boosts &amp; contact-unlock share</p>

        {/* ── Revenue wallet card — reflects the selected timeframe ── */}
        <div className="bg-gradient-to-br from-[#1E3A8A] to-[#1E40AF] rounded-2xl shadow-md p-5 mb-4 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute -right-2 -bottom-10 w-24 h-24 rounded-full bg-white/5" />

          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-white/70 font-medium">
              Revenue · {RANGE_PERIOD_LABEL[range]}
            </p>
            <div className="text-right">
              <p className="text-[9px] text-white/50 uppercase tracking-wide">All-time</p>
              <p className="text-xs font-bold text-white/80">
                {summaryLoading ? "…" : naira(summary?.totalRevenue ?? 0)}
              </p>
            </div>
          </div>

          {chartLoading ? (
            <div className="h-9 w-40 bg-white/20 rounded animate-pulse" />
          ) : (
            <p className="text-3xl font-black tracking-tight">{naira(periodTotals.total)}</p>
          )}

          <div className="grid grid-cols-3 gap-2 mt-4 relative">
            <div className="bg-white/10 rounded-xl px-2.5 py-2">
              <p className="text-[9px] text-white/60 font-semibold uppercase tracking-wide">Activations</p>
              <p className="text-xs font-bold mt-0.5">
                {chartLoading ? "—" : naira(periodTotals.activation)}
              </p>
            </div>
            <div className="bg-white/10 rounded-xl px-2.5 py-2">
              <p className="text-[9px] text-white/60 font-semibold uppercase tracking-wide">Boosts</p>
              <p className="text-xs font-bold mt-0.5">
                {chartLoading ? "—" : naira(periodTotals.boost)}
              </p>
            </div>
            <div className="bg-white/10 rounded-xl px-2.5 py-2">
              <p className="text-[9px] text-white/60 font-semibold uppercase tracking-wide">Unlocks (40%)</p>
              <p className="text-xs font-bold mt-0.5">
                {chartLoading ? "—" : naira(periodTotals.contactUnlock)}
              </p>
            </div>
          </div>
        </div>

        {/* ── Timeframe selector — horizontal pill row ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-3 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
          {RANGE_TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => handleRange(key)}
              className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold pl-3 pr-4 py-2.5 rounded-full transition active:scale-95 whitespace-nowrap ${
                range === key
                  ? "bg-[#1E3A8A] text-white shadow-md"
                  : "bg-white text-[#64748B] shadow-sm border border-[#F1F5F9]"
              }`}
            >
              <TabIcon name={icon} className={`w-3.5 h-3.5 ${range === key ? "text-white" : "text-[#94A3B8]"}`} />
              {label}
            </button>
          ))}
        </div>

        {/* ── Custom date range pickers ── */}
        {range === "custom" && (
          <div className="bg-white rounded-2xl shadow-sm p-3 mb-3 flex items-center gap-2">
            <div className="flex-1">
              <label className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wide block mb-1">From</label>
              <input
                type="date"
                value={customStart}
                max={customEnd || undefined}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full text-xs text-[#0F172A] border border-[#E2E8F0] rounded-lg px-2 py-1.5 outline-none focus:border-[#1E3A8A]"
              />
            </div>
            <div className="flex-1">
              <label className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wide block mb-1">To</label>
              <input
                type="date"
                value={customEnd}
                min={customStart || undefined}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full text-xs text-[#0F172A] border border-[#E2E8F0] rounded-lg px-2 py-1.5 outline-none focus:border-[#1E3A8A]"
              />
            </div>
          </div>
        )}

        {/* ── Chart ── */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-5">
          <p className="text-xs font-semibold text-[#0F172A] mb-3">Revenue over time</p>
          {chartLoading ? (
            <div className="h-52 bg-[#F8FAFF] rounded-xl animate-pulse" />
          ) : chartData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-xs text-[#94A3B8]">
              No revenue in this period
            </div>
          ) : (
            <div className="h-52 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1E3A8A" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#1E3A8A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="bucket"
                    tickFormatter={formatBucket}
                    tick={{ fontSize: 10, fill: "#94A3B8" }}
                    axisLine={{ stroke: "#F1F5F9" }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => `₦${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    tick={{ fontSize: 10, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                  />
                  <Tooltip content={<RevenueTooltip groupBy={groupBy} />} />
                  <Area type="monotone" dataKey="total" stroke="#1E3A8A" strokeWidth={2} fill="url(#revGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ── Transaction log tabs — horizontal pill row ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-3 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
          {REV_TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => handleTab(key)}
              className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold pl-3 pr-4 py-2.5 rounded-full transition active:scale-95 whitespace-nowrap ${
                tab === key
                  ? "bg-[#1E3A8A] text-white shadow-md"
                  : "bg-white text-[#64748B] shadow-sm border border-[#F1F5F9]"
              }`}
            >
              <TabIcon name={icon} className={`w-3.5 h-3.5 ${tab === key ? "text-white" : "text-[#94A3B8]"}`} />
              {label}
            </button>
          ))}
        </div>

        {!logLoading && items.length > 0 && (
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] text-[#94A3B8]">{total.toLocaleString()} records</span>
            {pages > 1 && <span className="text-[11px] text-[#94A3B8]">Page {page} of {pages}</span>}
          </div>
        )}

        {/* ── Transaction log cards ── */}
        <div className="space-y-2">
          {logLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-4 animate-pulse">
                <div className="h-4 bg-[#F1F5F9] rounded w-1/2 mb-2" />
                <div className="h-3 bg-[#F1F5F9] rounded w-1/3" />
              </div>
            ))
          ) : items.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm text-center py-16 text-sm text-[#94A3B8]">
              No revenue transactions found
            </div>
          ) : (
            items.map((tx) => <RevenueRow key={tx._id} tx={tx} />)
          )}
        </div>

        {/* ── Pagination ── */}
        {pages > 1 && (
          <div className="flex items-center justify-between mt-4 bg-white rounded-2xl shadow-sm px-4 py-3">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="text-xs font-medium text-[#1E3A8A] disabled:opacity-30 px-3 py-1.5 rounded-xl bg-[#F8FAFF]"
            >
              ← Prev
            </button>
            <span className="text-xs text-[#94A3B8]">Page {page} of {pages}</span>
            <button
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
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

// ─── Revenue log row ───────────────────────────────────────────────────────

function RevenueRow({ tx }: { tx: RevenueTx }) {
  const meta = TX_META[tx.type] ?? { label: tx.type };
  const date = new Date(tx.createdAt);
  const now  = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const timeStr = isToday
    ? date.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "2-digit" }) +
      " " + date.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#0F172A] truncate">{tx.user?.name ?? "—"}</p>
          <p className="text-[10px] text-[#94A3B8] truncate">@{tx.user?.username ?? "—"}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-black text-emerald-600">+{naira(tx.adminRevenue)}</p>
          {tx.type === "spend" && (
            <p className="text-[9px] text-[#94A3B8] mt-0.5">of {naira(tx.nairaEquivalent)}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 whitespace-nowrap">
          {meta.label}
        </span>
        <span className="text-[10px] text-[#CBD5E1] ml-auto whitespace-nowrap">{timeStr}</span>
      </div>

      {tx.description && (
        <p className="text-[10px] text-[#94A3B8] truncate border-t border-[#F1F5F9] pt-2 mt-2">
          {tx.description}
        </p>
      )}
    </div>
  );
}
