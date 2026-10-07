"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { canAdminAccess } from "@/lib/adminAccess";
import {
  ChevronUp,
  ChevronDown,
  Download,
  X,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("bf_token")}` };
}

// ── Types (mirror the Phase 2 backend response shapes) ──────────────────
// Grouped by STATE, not city/LGA — city/LGA is free text with a lot of
// inconsistency across profiles, while state comes from a fixed list and
// is far more reliable for a marketing-facing rollup.
type StateCount = { state: string; count: number };
// Funmates by state is split into verified+activated vs verified+not-yet-
// activated per state — a comparative bar chart needs both counts side by
// side, not one flat total.
type StateActivationCount = {
  state: string;
  activated: number;
  notActivated: number;
};

type DemographicsResponse = {
  cachedAt: number;
  funmates: { total: number; byState: StateActivationCount[] };
  // Seekers currently have no location captured, so instead of a state
  // breakdown they get a day-by-day signup trend — see the backend
  // controller's comment on getMarketDemographics for why.
  seekers: { total: number; trend: { date: string; count: number }[] };
};

type ProfileViewsResponse = {
  cachedAt: number;
  total: number;
  trend: { date: string; count: number }[];
};

type TopFunmate = {
  userId: string;
  name: string;
  username: string;
  state: string;
  whatsappClicks: number;
  profileViews: number;
};

type WhatsappEngagementResponse = {
  cachedAt: number;
  total: number;
  engagedFunmateCount: number;
  avgClicksPerEngagedFunmate: number;
  topStates: StateCount[];
  topFunmates: TopFunmate[];
};

type NoClickFunmate = {
  userId: string;
  name: string;
  username: string;
  state: string;
  views: number;
};

type ConversionResponse = {
  cachedAt: number;
  viewedFunmateCount: number;
  convertedFunmateCount: number;
  notConvertedFunmateCount: number;
  conversionRate: number;
  noClickFunmates: NoClickFunmate[];
};

type TrafficResponse = {
  cachedAt: number;
  total: number;
  trend: { date: string; count: number }[];
};

// ── Date range presets ───────────────────────────────────────────────────
type RangeKey = "7d" | "30d" | "90d" | "custom";

const RANGE_TABS: { key: RangeKey; label: string }[] = [
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "90d", label: "90 Days" },
  { key: "custom", label: "Custom" },
];

const RANGE_DAYS: Record<Exclude<RangeKey, "custom">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

// ── CSV export helper ────────────────────────────────────────────────────
function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
) {
  const escape = (val: string | number) => {
    const s = String(val);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Small presentational pieces ──────────────────────────────────────────
function SectionCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className='rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:p-5'>
      <div className='mb-3 flex items-start justify-between gap-3'>
        <div>
          <h2 className='text-sm font-bold text-slate-900'>{title}</h2>
          {subtitle && (
            <p className='mt-0.5 text-xs text-slate-500'>{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function KpiCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <div className='rounded-2xl bg-white p-4 ring-1 ring-slate-200'>
      <p className='text-[11px] uppercase tracking-[0.18em] text-slate-400'>
        {label}
      </p>
      {loading ? (
        <div className='mt-2 h-7 w-16 animate-pulse rounded bg-slate-100' />
      ) : (
        <p className='mt-2 text-2xl font-black text-violet-600'>{value}</p>
      )}
    </div>
  );
}

function SkeletonBlock({ height = "h-56" }: { height?: string }) {
  return (
    <div className={`w-full ${height} animate-pulse rounded-xl bg-slate-100`} />
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className='flex h-40 items-center justify-center text-xs text-slate-400'>
      {message}
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className='flex h-40 flex-col items-center justify-center gap-2 text-center'>
      <AlertCircle className='h-5 w-5 text-rose-400' />
      <p className='text-xs text-slate-500'>{message}</p>
      <button
        onClick={onRetry}
        className='inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200 hover:text-slate-800'>
        <RefreshCw className='h-3 w-3' />
        Try again
      </button>
    </div>
  );
}

function formatRelativeTime(timestampMs: number): string {
  const diffSec = Math.max(0, Math.round((Date.now() - timestampMs) / 1000));
  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  return `${diffHr}h ago`;
}

/**
 * Defers mounting `children` until the wrapping element scrolls near the
 * viewport — used for the Profile Views trend chart, the last section on
 * the page, so its Recharts render cost isn't paid on initial load for
 * admins who never scroll that far.
 */
function LazyMount({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible || !ref.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  return <div ref={ref}>{visible ? children : <SkeletonBlock />}</div>;
}

function StateBarChart({
  data,
  selectedState,
  onBarClick,
}: {
  data: StateCount[];
  selectedState?: string | null;
  onBarClick?: (state: string) => void;
}) {
  if (data.length === 0)
    return <EmptyState message='No data for this period' />;
  const chartHeight = Math.max(160, data.length * 34);
  return (
    <ResponsiveContainer width='100%' height={chartHeight}>
      <BarChart
        data={data}
        layout='vertical'
        margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid
          strokeDasharray='3 3'
          horizontal={false}
          stroke='#F1F5F9'
        />
        <XAxis
          type='number'
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#94A3B8" }}
        />
        <YAxis
          type='category'
          dataKey='state'
          width={92}
          tick={{ fontSize: 11.5, fill: "#334155" }}
        />
        <Tooltip
          cursor={{ fill: "#F8FAFC" }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #E2E8F0",
            fontSize: 12,
          }}
        />
        <Bar
          dataKey='count'
          radius={[0, 6, 6, 0]}
          maxBarSize={18}
          onClick={(entry) =>
            onBarClick?.((entry as unknown as StateCount).state)
          }
          className={onBarClick ? "cursor-pointer" : undefined}>
          {data.map((row) => (
            <Cell
              key={row.state}
              fill={
                selectedState && row.state !== selectedState
                  ? "#DDD6FE"
                  : "#7C3AED"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Comparative/grouped bar chart: two bars per state (activated vs
// not-yet-activated), so the split within each state is visible at a
// glance rather than just the general distribution across states.
function StateActivationBarChart({ data }: { data: StateActivationCount[] }) {
  if (data.length === 0)
    return <EmptyState message='No data for this period' />;
  const chartHeight = Math.max(180, data.length * 42);
  return (
    <ResponsiveContainer width='100%' height={chartHeight}>
      <BarChart
        data={data}
        layout='vertical'
        barGap={4}
        margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid
          strokeDasharray='3 3'
          horizontal={false}
          stroke='#F1F5F9'
        />
        <XAxis
          type='number'
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#94A3B8" }}
        />
        <YAxis
          type='category'
          dataKey='state'
          width={92}
          tick={{ fontSize: 11.5, fill: "#334155" }}
        />
        <Tooltip
          cursor={{ fill: "#F8FAFC" }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #E2E8F0",
            fontSize: 12,
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
          formatter={(value) =>
            value === "activated" ? "Activated" : "Not activated"
          }
        />
        <Bar
          dataKey='activated'
          name='activated'
          fill='#7C3AED'
          radius={[0, 6, 6, 0]}
          maxBarSize={14}
        />
        <Bar
          dataKey='notActivated'
          name='notActivated'
          fill='#C4B5FD'
          radius={[0, 6, 6, 0]}
          maxBarSize={14}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function formatShortDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

// Shared area/line chart for any "count per day" trend — used by both the
// seeker signup trend (no location data to break down by state) and the
// profile-views trend further down the page.
function TrendAreaChart({
  data,
  gradientId,
  color = "#7C3AED",
}: {
  data: { date: string; count: number }[];
  gradientId: string;
  color?: string;
}) {
  return (
    <ResponsiveContainer width='100%' height={220}>
      <AreaChart
        data={data}
        margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id={gradientId} x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stopColor={color} stopOpacity={0.28} />
            <stop offset='100%' stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray='3 3'
          vertical={false}
          stroke='#F1F5F9'
        />
        <XAxis
          dataKey='date'
          tickFormatter={formatShortDate}
          tick={{ fontSize: 11, fill: "#94A3B8" }}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
        <Tooltip
          labelFormatter={(label) => formatShortDate(String(label))}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #E2E8F0",
            fontSize: 12,
          }}
        />
        <Area
          type='monotone'
          dataKey='count'
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Sortable "Most engaged funmates" table ───────────────────────────────
type SortKey = "name" | "state" | "whatsappClicks" | "profileViews";

function SortableHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onClick,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: "asc" | "desc";
  onClick: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = activeKey === sortKey;
  return (
    <th
      onClick={() => onClick(sortKey)}
      className={`cursor-pointer select-none py-2 pr-3 font-medium text-slate-400 hover:text-slate-600 ${
        align === "right" ? "text-right" : "text-left"
      }`}>
      <span
        className={`inline-flex items-center gap-0.5 ${align === "right" ? "flex-row-reverse" : ""}`}>
        {label}
        {active &&
          (dir === "asc" ? (
            <ChevronUp className='h-3 w-3' />
          ) : (
            <ChevronDown className='h-3 w-3' />
          ))}
      </span>
    </th>
  );
}

export default function MarketAnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const authBlocked = authLoading || !user;
  const canView = canAdminAccess(
    user?.adminPermissions,
    "analytics",
    user?.adminRole || null,
  );

  const [rangeKey, setRangeKey] = useState<RangeKey>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [demographics, setDemographics] = useState<DemographicsResponse | null>(
    null,
  );
  const [demographicsLoading, setDemographicsLoading] = useState(true);
  const [demographicsError, setDemographicsError] = useState(false);

  const [traffic, setTraffic] = useState<TrafficResponse | null>(null);
  const [trafficLoading, setTrafficLoading] = useState(true);
  const [trafficError, setTrafficError] = useState(false);

  const [profileViews, setProfileViews] = useState<ProfileViewsResponse | null>(
    null,
  );
  const [profileViewsLoading, setProfileViewsLoading] = useState(true);
  const [profileViewsError, setProfileViewsError] = useState(false);

  const [engagement, setEngagement] =
    useState<WhatsappEngagementResponse | null>(null);
  const [engagementLoading, setEngagementLoading] = useState(true);
  const [engagementError, setEngagementError] = useState(false);
  const [showAllEngaged, setShowAllEngaged] = useState(false);

  const [conversion, setConversion] = useState<ConversionResponse | null>(null);
  const [conversionLoading, setConversionLoading] = useState(true);
  const [conversionError, setConversionError] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  // Ticks once a minute purely to force a re-render so "Updated Xm ago"
  // keeps counting up between fetches, instead of freezing at whatever it
  // said the moment data last loaded.
  const [, setClockTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setClockTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Drill-down: clicking a state bar in "Top states by WhatsApp clicks"
  // filters the Most Engaged Funmates table below it to that state.
  const [selectedState, setSelectedState] = useState<string | null>(null);

  // Sortable Most Engaged Funmates table state.
  const [sortKey, setSortKey] = useState<SortKey>("whatsappClicks");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!canView) router.push("/admin");
  }, [authLoading, canView, router, user]);

  // Resolved from/to ISO strings for the currently selected range — the
  // single source every fetch below reads from, so switching presets or
  // editing custom dates always keeps all three sections in sync.
  const resolvedRange = useMemo(() => {
    if (rangeKey === "custom") {
      if (!customFrom || !customTo) return null;
      return { from: customFrom, to: customTo };
    }
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - RANGE_DAYS[rangeKey]);
    return { from: toDateInputValue(from), to: toDateInputValue(to) };
  }, [rangeKey, customFrom, customTo]);

  const fetchAll = useCallback(
    async (forceRefresh = false) => {
      if (!resolvedRange) return;
      const params = new URLSearchParams({
        from: resolvedRange.from,
        to: resolvedRange.to,
      });
      if (forceRefresh) params.set("refresh", "1");

      setDemographicsLoading(true);
      setTrafficLoading(true);
      setProfileViewsLoading(true);
      setEngagementLoading(true);
      setConversionLoading(true);
      setDemographicsError(false);
      setTrafficError(false);
      setProfileViewsError(false);
      setEngagementError(false);
      setConversionError(false);
      setSelectedState(null);
      setShowAllEngaged(false);

      const [demoRes, trafficRes, viewsRes, engagementRes, conversionRes] =
        await Promise.allSettled([
          fetch(`${API}/api/admin/market-analytics/demographics?${params}`, {
            headers: authHeader(),
          }),
          fetch(`${API}/api/admin/market-analytics/traffic?${params}`, {
            headers: authHeader(),
          }),
          fetch(`${API}/api/admin/market-analytics/profile-views?${params}`, {
            headers: authHeader(),
          }),
          fetch(
            `${API}/api/admin/market-analytics/whatsapp-engagement?${params}`,
            {
              headers: authHeader(),
            },
          ),
          fetch(`${API}/api/admin/market-analytics/conversion?${params}`, {
            headers: authHeader(),
          }),
        ]);

      if (demoRes.status === "fulfilled" && demoRes.value.ok) {
        setDemographics(await demoRes.value.json());
      } else {
        setDemographics(null);
        setDemographicsError(true);
      }
      setDemographicsLoading(false);

      if (trafficRes.status === "fulfilled" && trafficRes.value.ok) {
        setTraffic(await trafficRes.value.json());
      } else {
        setTraffic(null);
        setTrafficError(true);
      }
      setTrafficLoading(false);

      if (viewsRes.status === "fulfilled" && viewsRes.value.ok) {
        setProfileViews(await viewsRes.value.json());
      } else {
        setProfileViews(null);
        setProfileViewsError(true);
      }
      setProfileViewsLoading(false);

      if (engagementRes.status === "fulfilled" && engagementRes.value.ok) {
        setEngagement(await engagementRes.value.json());
      } else {
        setEngagement(null);
        setEngagementError(true);
      }
      setEngagementLoading(false);

      if (conversionRes.status === "fulfilled" && conversionRes.value.ok) {
        setConversion(await conversionRes.value.json());
      } else {
        setConversion(null);
        setConversionError(true);
      }
      setConversionLoading(false);
    },
    [resolvedRange],
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll(true);
    setRefreshing(false);
  };

  useEffect(() => {
    if (authBlocked || !canView) return;

    const timer = window.setTimeout(() => {
      void fetchAll();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [authBlocked, canView, fetchAll]);

  const oldestCachedAt = useMemo(() => {
    const timestamps = [
      demographics?.cachedAt,
      traffic?.cachedAt,
      profileViews?.cachedAt,
      engagement?.cachedAt,
      conversion?.cachedAt,
    ].filter((t): t is number => typeof t === "number");
    return timestamps.length > 0 ? Math.min(...timestamps) : null;
  }, [
    demographics?.cachedAt,
    traffic?.cachedAt,
    profileViews?.cachedAt,
    engagement?.cachedAt,
    conversion?.cachedAt,
  ]);

  const visibleFunmates = useMemo(() => {
    const rows = engagement?.topFunmates ?? [];
    const filtered = selectedState
      ? rows.filter((r) => r.state === selectedState)
      : rows;
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name")
        cmp = (a.name || a.username).localeCompare(b.name || b.username);
      else if (sortKey === "state") cmp = a.state.localeCompare(b.state);
      else cmp = a[sortKey] - b[sortKey];
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [engagement?.topFunmates, selectedState, sortKey, sortDir]);

  const exportFunmatesCsv = () => {
    downloadCsv(
      `bluufun-engaged-funmates-${toDateInputValue(new Date())}.csv`,
      ["Name", "Username", "State", "WhatsApp Clicks", "Profile Views"],
      visibleFunmates.map((f) => [
        f.name || f.username,
        f.username,
        f.state || "Unknown",
        f.whatsappClicks,
        f.profileViews,
      ]),
    );
  };

  if (authBlocked || !canView) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#F8FAFC]'>
        <div className='h-8 w-8 animate-spin rounded-full border-2 border-[#1E3A8A] border-t-transparent' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#F8FAFC] px-4 py-6 sm:px-6'>
      <div className='mx-auto max-w-5xl'>
        {/* ── Header ── */}
        <div className='mb-5 flex flex-wrap items-start justify-between gap-3'>
          <div>
            <Link
              href='/admin'
              className='text-xs font-medium text-slate-400 hover:text-slate-600'>
              ← Admin
            </Link>
            <h1 className='mt-1 text-xl font-black text-slate-900 sm:text-2xl'>
              Market Analytics
            </h1>
            <p className='mt-0.5 text-xs text-slate-500 sm:text-sm'>
              How Bluufun is growing and engaging, by state.
            </p>
          </div>

          {/* Range picker */}
          <div className='flex flex-col items-end gap-1.5'>
            <div className='flex flex-wrap items-center gap-1.5'>
              {RANGE_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setRangeKey(tab.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    rangeKey === tab.key
                      ? "bg-violet-600 text-white"
                      : "bg-white text-slate-500 ring-1 ring-slate-200 hover:text-slate-700"
                  }`}>
                  {tab.label}
                </button>
              ))}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                title='Refresh now'
                className='rounded-full bg-white p-1.5 text-slate-500 ring-1 ring-slate-200 hover:text-slate-700 disabled:opacity-50'>
                <RefreshCw
                  className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>
            </div>
            {oldestCachedAt && (
              <p className='text-[11px] text-slate-400'>
                Updated {formatRelativeTime(oldestCachedAt)}
              </p>
            )}
          </div>
        </div>

        {rangeKey === "custom" && (
          <div className='mb-5 flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 ring-1 ring-slate-200'>
            <label className='text-xs font-medium text-slate-500'>
              From
              <input
                type='date'
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                max={customTo || undefined}
                className='ml-2 rounded-lg border border-slate-200 px-2 py-1 text-xs'
              />
            </label>
            <label className='text-xs font-medium text-slate-500'>
              To
              <input
                type='date'
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                min={customFrom || undefined}
                max={toDateInputValue(new Date())}
                className='ml-2 rounded-lg border border-slate-200 px-2 py-1 text-xs'
              />
            </label>
            {!customFrom || !customTo ? (
              <span className='text-xs text-slate-400'>
                Pick both dates to load this range.
              </span>
            ) : null}
          </div>
        )}

        {/* ── KPI strip ── */}
        <div className='mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5'>
          <KpiCard
            label='Unique Visitors'
            value={(traffic?.total ?? 0).toLocaleString()}
            loading={trafficLoading}
          />
          <KpiCard
            label='New Funmates'
            value={(demographics?.funmates.total ?? 0).toLocaleString()}
            loading={demographicsLoading}
          />
          <KpiCard
            label='New Seekers'
            value={(demographics?.seekers.total ?? 0).toLocaleString()}
            loading={demographicsLoading}
          />
          <KpiCard
            label='Profiles Viewed'
            value={(profileViews?.total ?? 0).toLocaleString()}
            loading={profileViewsLoading}
          />
          <KpiCard
            label='WhatsApp Clicks'
            value={(engagement?.total ?? 0).toLocaleString()}
            loading={engagementLoading}
          />
        </div>

        {/* ── Daily traffic ── */}
        <div className='mb-5'>
          <SectionCard
            title='Daily Traffic'
            subtitle='Unique visitors per day — distinct from “Active now” elsewhere, which is a live snapshot, not a trend'>
            {trafficLoading ? (
              <SkeletonBlock />
            ) : trafficError ? (
              <ErrorState
                message='Could not load traffic.'
                onRetry={() => fetchAll()}
              />
            ) : (traffic?.trend.length ?? 0) === 0 ? (
              <EmptyState message='No traffic recorded in this period' />
            ) : (
              <TrendAreaChart
                data={traffic?.trend ?? []}
                gradientId='trafficFill'
                color='#059669'
              />
            )}
          </SectionCard>
        </div>

        {/* ── Demographics ── */}
        <div className='mb-5 grid grid-cols-1 gap-3 lg:grid-cols-2'>
          <SectionCard
            title='Funmates by State'
            subtitle='Verified funmates in the selected period — activated vs not yet activated'>
            {demographicsLoading ? (
              <SkeletonBlock />
            ) : demographicsError ? (
              <ErrorState
                message='Could not load demographics.'
                onRetry={() => fetchAll()}
              />
            ) : (
              <StateActivationBarChart
                data={demographics?.funmates.byState ?? []}
              />
            )}
          </SectionCard>
          <SectionCard
            title='New Seekers'
            subtitle='Daily signups — location isn’t collected for seekers yet, see note below'>
            {demographicsLoading ? (
              <SkeletonBlock />
            ) : demographicsError ? (
              <ErrorState
                message='Could not load demographics.'
                onRetry={() => fetchAll()}
              />
            ) : (demographics?.seekers.trend.length ?? 0) === 0 ? (
              <EmptyState message='No new seekers in this period' />
            ) : (
              <TrendAreaChart
                data={demographics?.seekers.trend ?? []}
                gradientId='seekersFill'
                color='#0EA5E9'
              />
            )}
          </SectionCard>
        </div>

        {/* ── WhatsApp engagement ── */}
        <SectionCard
          title='WhatsApp Engagement'
          subtitle='Clicks on a funmate’s WhatsApp link, by state and by funmate'>
          {engagementLoading ? (
            <SkeletonBlock height='h-72' />
          ) : engagementError ? (
            <ErrorState
              message='Could not load WhatsApp engagement.'
              onRetry={() => fetchAll()}
            />
          ) : (
            <div className='space-y-5'>
              <div className='flex flex-wrap gap-6 text-sm'>
                <div>
                  <p className='text-[11px] uppercase tracking-wide text-slate-400'>
                    Total clicks
                  </p>
                  <p className='mt-0.5 text-lg font-bold text-slate-900'>
                    {(engagement?.total ?? 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className='text-[11px] uppercase tracking-wide text-slate-400'>
                    Funmates engaged
                  </p>
                  <p className='mt-0.5 text-lg font-bold text-slate-900'>
                    {(engagement?.engagedFunmateCount ?? 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className='text-[11px] uppercase tracking-wide text-slate-400'>
                    Avg. per engaged funmate
                  </p>
                  <p className='mt-0.5 text-lg font-bold text-slate-900'>
                    {engagement?.avgClicksPerEngagedFunmate ?? 0}
                  </p>
                </div>
              </div>

              <div>
                <p className='mb-2 text-xs font-semibold text-slate-500'>
                  Top states by WhatsApp clicks
                  <span className='ml-1.5 font-normal text-slate-400'>
                    (tap a bar to filter the table below)
                  </span>
                </p>
                <StateBarChart
                  data={engagement?.topStates ?? []}
                  selectedState={selectedState}
                  onBarClick={(state) =>
                    setSelectedState((prev) => (prev === state ? null : state))
                  }
                />
              </div>

              <div>
                <div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
                  <div className='flex items-center gap-2'>
                    <p className='text-xs font-semibold text-slate-500'>
                      Most engaged funmates
                    </p>
                    {selectedState && (
                      <button
                        onClick={() => setSelectedState(null)}
                        className='inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700'>
                        {selectedState}
                        <X className='h-3 w-3' />
                      </button>
                    )}
                  </div>
                  {visibleFunmates.length > 0 && (
                    <button
                      onClick={exportFunmatesCsv}
                      className='inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200 hover:text-slate-700'>
                      <Download className='h-3 w-3' />
                      Export CSV
                    </button>
                  )}
                </div>
                {visibleFunmates.length === 0 ? (
                  <EmptyState
                    message={
                      selectedState
                        ? `No engaged funmates in ${selectedState} for this period`
                        : "No WhatsApp clicks in this period"
                    }
                  />
                ) : (
                  <div className='overflow-x-auto'>
                    <table className='w-full min-w-[420px] text-left text-xs'>
                      <thead>
                        <tr className='text-slate-400'>
                          <SortableHeader
                            label='Name'
                            sortKey='name'
                            activeKey={sortKey}
                            dir={sortDir}
                            onClick={handleSort}
                          />
                          <SortableHeader
                            label='State'
                            sortKey='state'
                            activeKey={sortKey}
                            dir={sortDir}
                            onClick={handleSort}
                          />
                          <SortableHeader
                            label='WhatsApp Clicks'
                            sortKey='whatsappClicks'
                            activeKey={sortKey}
                            dir={sortDir}
                            onClick={handleSort}
                            align='right'
                          />
                          <SortableHeader
                            label='Profile Views'
                            sortKey='profileViews'
                            activeKey={sortKey}
                            dir={sortDir}
                            onClick={handleSort}
                            align='right'
                          />
                        </tr>
                      </thead>
                      <tbody>
                        {(showAllEngaged ? visibleFunmates : visibleFunmates.slice(0, 10)).map((fm) => (
                          <tr
                            key={fm.userId}
                            className='border-t border-slate-100'>
                            <td className='py-2 pr-3 font-semibold text-slate-800'>
                              <Link
                                href={`/funmate/${encodeURIComponent(fm.username)}`}
                                target='_blank'
                                className='hover:text-violet-600'>
                                {fm.name || fm.username}
                              </Link>
                            </td>
                            <td className='py-2 pr-3 text-slate-500'>
                              {fm.state || "—"}
                            </td>
                            <td className='py-2 pr-3 text-right font-bold text-violet-600'>
                              {fm.whatsappClicks}
                            </td>
                            <td className='py-2 text-right text-slate-600'>
                              {fm.profileViews}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {visibleFunmates.length > 10 && (
                      <div className='mt-4 flex justify-center'>
                        <button
                          type='button'
                          onClick={() => setShowAllEngaged((current) => !current)}
                          className='rounded-full bg-violet-50 px-4 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-100'>
                          {showAllEngaged ? "Show less" : `Show all ${visibleFunmates.length}`}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </SectionCard>

        {/* ── View-to-click conversion ── */}
        <div className='mt-5'>
          <SectionCard
            title='View-to-Click Conversion'
            subtitle='Of funmates who were viewed, how many actually got a WhatsApp click'>
            {conversionLoading ? (
              <SkeletonBlock height='h-56' />
            ) : conversionError ? (
              <ErrorState
                message='Could not load conversion.'
                onRetry={() => fetchAll()}
              />
            ) : (conversion?.viewedFunmateCount ?? 0) === 0 ? (
              <EmptyState message='No profile views in this period' />
            ) : (
              <div className='space-y-5'>
                <div>
                  <div className='flex items-baseline justify-between text-sm'>
                    <span className='font-bold text-slate-900'>
                      {conversion?.conversionRate}% converted
                    </span>
                    <span className='text-xs text-slate-400'>
                      {conversion?.viewedFunmateCount} funmates viewed in this
                      period
                    </span>
                  </div>
                  <div className='mt-2 flex h-3 w-full overflow-hidden rounded-full bg-slate-100'>
                    <div
                      className='h-full bg-emerald-500'
                      style={{
                        width: `${conversion?.conversionRate ?? 0}%`,
                      }}
                      title={`Converted: ${conversion?.convertedFunmateCount}`}
                    />
                    <div
                      className='h-full bg-rose-300'
                      style={{
                        width: `${100 - (conversion?.conversionRate ?? 0)}%`,
                      }}
                      title={`Not converted: ${conversion?.notConvertedFunmateCount}`}
                    />
                  </div>
                  <div className='mt-2 flex flex-wrap gap-4 text-xs'>
                    <span className='flex items-center gap-1.5 text-slate-500'>
                      <span className='h-2 w-2 rounded-full bg-emerald-500' />
                      Got a click — {conversion?.convertedFunmateCount}
                    </span>
                    <span className='flex items-center gap-1.5 text-slate-500'>
                      <span className='h-2 w-2 rounded-full bg-rose-300' />
                      No click — {conversion?.notConvertedFunmateCount}
                    </span>
                  </div>
                </div>

                <div>
                  <p className='mb-2 text-xs font-semibold text-slate-500'>
                    Viewed, but never clicked
                    <span className='ml-1.5 font-normal text-slate-400'>
                      (most-viewed first — a real signal worth a closer look)
                    </span>
                  </p>
                  {(conversion?.noClickFunmates.length ?? 0) === 0 ? (
                    <EmptyState message='Every viewed funmate got at least one click 🎉' />
                  ) : (
                    <div className='overflow-x-auto'>
                      <table className='w-full min-w-[360px] text-left text-xs'>
                        <thead>
                          <tr className='text-slate-400'>
                            <th className='py-2 pr-3 font-medium'>Name</th>
                            <th className='py-2 pr-3 font-medium'>State</th>
                            <th className='py-2 text-right font-medium'>
                              Profile Views
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {conversion?.noClickFunmates.map((fm) => (
                            <tr
                              key={fm.userId}
                              className='border-t border-slate-100'>
                              <td className='py-2 pr-3 font-semibold text-slate-800'>
                                <Link
                                  href={`/funmate/${encodeURIComponent(fm.username)}`}
                                  target='_blank'
                                  className='hover:text-violet-600'>
                                  {fm.name || fm.username}
                                </Link>
                              </td>
                              <td className='py-2 pr-3 text-slate-500'>
                                {fm.state || "—"}
                              </td>
                              <td className='py-2 text-right font-bold text-rose-500'>
                                {fm.views}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── Profile views trend ── */}
        <div className='mt-5'>
          <SectionCard
            title='Profile Views Over Time'
            subtitle='Daily profile views in the selected period'>
            {profileViewsLoading ? (
              <SkeletonBlock />
            ) : profileViewsError ? (
              <ErrorState
                message='Could not load profile views.'
                onRetry={() => fetchAll()}
              />
            ) : (profileViews?.trend.length ?? 0) === 0 ? (
              <EmptyState message='No profile views in this period' />
            ) : (
              <LazyMount>
                <TrendAreaChart
                  data={profileViews?.trend ?? []}
                  gradientId='viewsFill'
                  color='#7C3AED'
                />
              </LazyMount>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
