"use client";

import DesktopSidebar from "@/components/DesktopSidebar";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { getCachedData, setCachedData } from "@/lib/apiCache";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BellRing,
  CheckCheck,
  ChevronRight,
  CircleAlert,
  Clock3,
  HeartHandshake,
  Inbox,
  ShieldCheck,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";

type NotificationItem = {
  _id: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  metadata?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
};

const TYPE_META: Record<
  string,
  { label: string; icon: LucideIcon; tone: string }
> = {
  system: {
    label: "System",
    icon: CircleAlert,
    tone: "bg-slate-100 text-slate-700",
  },
  verification: {
    label: "Verification",
    icon: ShieldCheck,
    tone: "bg-blue-50 text-blue-700",
  },
  activation: {
    label: "Activation",
    icon: CheckCheck,
    tone: "bg-emerald-50 text-emerald-700",
  },
  boost: {
    label: "Boost",
    icon: Sparkles,
    tone: "bg-violet-50 text-violet-700",
  },
  wallet: { label: "Wallet", icon: Wallet, tone: "bg-amber-50 text-amber-700" },
  bonus: {
    label: "Bonus",
    icon: Sparkles,
    tone: "bg-fuchsia-50 text-fuchsia-700",
  },
  referral: {
    label: "Referral",
    icon: HeartHandshake,
    tone: "bg-rose-50 text-rose-700",
  },
  contact: {
    label: "Contact",
    icon: BellRing,
    tone: "bg-cyan-50 text-cyan-700",
  },
};

const ACTIVITY_CACHE_KEY = "activity:notifications";

interface ActivityCache {
  items: NotificationItem[];
  unreadCount: number;
}

export default function ActivityPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  // Read the cache directly (a plain function call, safe during render) —
  // NOT via ref.current, which React disallows reading during render, even
  // from inside a lazy useState initializer. The ref below is only for
  // later reads/writes inside effects and event handlers.
  const initialCache = getCachedData<ActivityCache>(ACTIVITY_CACHE_KEY);
  const cachedActivity = useRef(initialCache);
  const [items, setItems] = useState<NotificationItem[]>(
    () => initialCache?.items ?? [],
  );
  const [unreadCount, setUnreadCount] = useState(
    () => initialCache?.unreadCount ?? 0,
  );
  const [loading, setLoading] = useState(() => !initialCache);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadNotifications() {
    // Only block the UI with the loading state when we have nothing cached
    // to show yet. On a return visit, keep showing the cached list while
    // this refreshes underneath it.
    if (!cachedActivity.current) setLoading(true);
    setError(null);
    try {
      const [listResponse, countResponse] = await Promise.all([
        api.notifications.list({ page: 1, limit: 30 }),
        api.notifications.unreadCount(),
      ]);
      const nextItems = listResponse.items || [];
      const nextUnreadCount = countResponse.unreadCount || 0;
      setItems(nextItems);
      setUnreadCount(nextUnreadCount);
      const payload: ActivityCache = {
        items: nextItems,
        unreadCount: nextUnreadCount,
      };
      setCachedData(ACTIVITY_CACHE_KEY, payload);
      cachedActivity.current = payload;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load notifications.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id: string) {
    setSavingId(id);
    try {
      await api.notifications.markRead(id);
      setItems((current) => {
        const next = current.map((item) =>
          item._id === id
            ? { ...item, readAt: item.readAt || new Date().toISOString() }
            : item,
        );
        const payload: ActivityCache = {
          items: next,
          unreadCount: Math.max(0, unreadCount - 1),
        };
        setCachedData(ACTIVITY_CACHE_KEY, payload);
        cachedActivity.current = payload;
        return next;
      });
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update the notification.",
      );
    } finally {
      setSavingId(null);
    }
  }

  async function markAllRead() {
    setSavingId("all");
    try {
      await api.notifications.markAllRead();
      const now = new Date().toISOString();
      setItems((current) => {
        const next = current.map((item) => ({
          ...item,
          readAt: item.readAt || now,
        }));
        const payload: ActivityCache = { items: next, unreadCount: 0 };
        setCachedData(ACTIVITY_CACHE_KEY, payload);
        cachedActivity.current = payload;
        return next;
      });
      setUnreadCount(0);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not mark all notifications as read.",
      );
    } finally {
      setSavingId(null);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (!user.emailisVerified) {
      router.push(`/verify-email?email=${encodeURIComponent(user.email)}`);
      return;
    }

    void loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, router, user]);

  if (authLoading || !user) {
    return (
      <div className='flex h-dvh items-center justify-center bg-[#F8FAFF]'>
        <div className='h-8 w-8 animate-spin rounded-full border-2 border-[#1E3A8A] border-t-transparent' />
      </div>
    );
  }

  const firstName = user.name?.split(" ")[0] || "there";
  const unreadLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <div className='md:min-h-screen md:px-4 md:py-5 md:pb-10 lg:pl-24'>
      <DesktopSidebar showLogo={false} />

      <div className='mx-auto w-full max-w-6xl px-4 pt-6 lg:px-6 xl:px-8 pb-20'>
        <main className='space-y-4'>
          <div className='flex items-center justify-between gap-4'>
            <div className='flex-1'>
              <p className='text-xs font-semibold uppercase tracking-[0.3em] text-blue-600'>
                Activity Center
              </p>
              <h1 className='mt-1 text-2xl font-black tracking-tight text-slate-950'>
                Hello, {firstName}
              </h1>
              <p className='mt-1 text-sm text-slate-600'>
                Keep track of account updates, approvals, and wallet events in
                one place.
              </p>
            </div>
            <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/15'>
              <BellRing className='h-5 w-5' />
            </div>
          </div>

          <div className='rounded-[1.75rem] border border-white/70 bg-white/85 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.07)] backdrop-blur'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <div className='flex items-start gap-3'>
                <span className='flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-700'>
                  <Clock3 className='h-5 w-5' />
                </span>
                <div className='flex-1'>
                  <p className='text-sm font-semibold text-slate-950'>
                    Notification center
                  </p>
                  <p className='mt-1 text-sm leading-6 text-slate-600'>
                    {unreadCount > 0
                      ? `You have ${unreadLabel} unread notification${unreadCount === 1 ? "" : "s"} awaiting your attention.`
                      : "You are all caught up. New updates will appear here as they happen."}
                  </p>
                </div>
              </div>

              <button
                onClick={markAllRead}
                disabled={unreadCount === 0 || savingId === "all"}
                className='rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50'>
                {savingId === "all" ? "Updating..." : "Mark all read"}
              </button>
            </div>
          </div>

          {error && (
            <div className='rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900'>
              {error}
            </div>
          )}

          {loading ? (
            <div className='space-y-3'>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className='flex items-start gap-4 rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-sm'>
                  <span className='h-11 w-11 shrink-0 animate-pulse rounded-2xl bg-slate-100' />
                  <div className='min-w-0 flex-1 space-y-2 py-0.5'>
                    <div className='h-3.5 w-1/3 animate-pulse rounded-full bg-slate-100' />
                    <div className='h-3 w-full animate-pulse rounded-full bg-slate-100' />
                    <div className='h-3 w-2/3 animate-pulse rounded-full bg-slate-100' />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className='rounded-[1.75rem] border border-dashed border-slate-300 bg-white/80 p-8 text-center shadow-sm'>
              <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500'>
                <Inbox className='h-6 w-6' />
              </div>
              <p className='mt-4 text-base font-semibold text-slate-950'>
                No notifications yet
              </p>
              <p className='mt-1 text-sm leading-6 text-slate-600'>
                Account updates, verification results, wallet credits, and
                contact unlocks will show up here.
              </p>
            </div>
          ) : (
            <div className='space-y-3'>
              {items.map((item) => {
                const meta = TYPE_META[item.type] || TYPE_META.system;
                const Icon = meta.icon;
                const isUnread = !item.readAt;

                return (
                  <article
                    key={item._id}
                    className={`group flex flex-col md:flex-row cursor-pointer items-start gap-4 rounded-[1.5rem] border bg-white p-4 shadow-sm transition ${
                      isUnread
                        ? "border-blue-200 ring-1 ring-blue-100"
                        : "border-slate-200/80"
                    }`}
                    onClick={() => {
                      if (item.link) router.push(item.link);
                      if (isUnread) void markRead(item._id);
                    }}>
                    <div className='flex gap-2'>
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${meta.tone}`}>
                        <Icon className='h-4 w-4' />
                      </span>
                      <div className='min-w-0 flex-1'>
                        <div className='flex flex-wrap items-start md:items-center justify-between gap-2'>
                          <div className='flex flex-col md:flex-row md:items-center gap-2'>
                            <h2 className='text-sm font-semibold text-slate-950'>
                              {item.title}
                            </h2>
                            <span className='w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500'>
                              {meta.label}
                            </span>
                          </div>

                          <div className='flex items-center gap-2'>
                            {isUnread && (
                              <span className='h-2.5 w-2.5 rounded-full bg-blue-600' />
                            )}
                            <span className='text-[11px] font-medium text-slate-400'>
                              {formatRelativeTime(item.createdAt)}
                            </span>
                          </div>
                        </div>

                        <p className='mt-1 text-sm leading-7 text-slate-600'>
                          {item.body}
                        </p>
                      </div>
                    </div>

                    <div className='float-right ml-auto'>
                      <div className='flex justify-content shrink-0 items-center gap-2 pt-1'>
                        {isUnread ? (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              void markRead(item._id);
                            }}
                            disabled={savingId === item._id}
                            className='rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60'>
                            {savingId === item._id ? "Marking..." : "Mark read"}
                          </button>
                        ) : (
                          <span className='rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700'>
                            Read
                          </span>
                        )}
                        <ChevronRight className='h-4 w-4 text-slate-300 transition group-hover:text-slate-400' />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className='rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4'>
            <div className='flex items-start gap-3'>
              <CircleAlert className='mt-0.5 h-5 w-5 text-amber-600' />
              <div>
                <p className='text-sm font-semibold text-amber-900'>
                  Protected page
                </p>
                <p className='mt-1 text-sm leading-7 text-amber-800/90'>
                  Notifications are only shown to signed-in users, and we keep
                  the feed focused on account and platform activity.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function formatRelativeTime(isoDate: string) {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(isoDate).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
