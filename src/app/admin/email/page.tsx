"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { canAdminAccess } from "@/lib/adminAccess";
import { api } from "@/lib/api";

type Recipient = {
  _id: string;
  name: string;
  username: string;
  email: string;
  verificationStatus?: string;
  isVerified?: boolean;
  isSuspended?: boolean;
};

type Audience =
  | "selected"
  | "all_funmates"
  | "all_seekers"
  | "all_funmates_and_seekers";

const AUDIENCE_OPTIONS: Array<{ value: Audience; label: string }> = [
  { value: "selected", label: "Selected users" },
  { value: "all_funmates", label: "All funmates" },
  { value: "all_seekers", label: "All seekers" },
  { value: "all_funmates_and_seekers", label: "All funmates + seekers" },
];

const AUDIENCE_NOUN: Record<Audience, string> = {
  selected: "user",
  all_funmates: "funmate",
  all_seekers: "seeker",
  all_funmates_and_seekers: "user",
};

export default function AdminEmailPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const canSend = canAdminAccess(
    user?.adminPermissions,
    "manage_users",
    user?.adminRole || null,
  );

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Recipient[]>([]);
  const [selected, setSelected] = useState<Recipient[]>([]);
  const [audience, setAudience] = useState<Audience>("selected");
  const [excluded, setExcluded] = useState<Recipient[]>([]);
  const [audienceCount, setAudienceCount] = useState<{
    eligible: number;
    total: number;
  } | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isBulk = audience !== "selected";

  useEffect(() => {
    let active = true;
    (async () => {
      if (!isBulk) {
        if (active) setAudienceCount(null);
        return;
      }
      try {
        const data = await api.admin.previewEmailAudience(
          excluded.map((item) => item._id),
          audience,
        );
        if (active) setAudienceCount(data);
      } catch {
        if (active) setAudienceCount(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [audience, excluded, isBulk]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!canSend) {
      router.push("/admin");
    }
  }, [authLoading, canSend, router, user]);

  useEffect(() => {
    let active = true;
    const t = setTimeout(async () => {
      const trimmed = query.trim();
      if (trimmed.length < 2) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const data = await api.admin.searchUsers(trimmed);
        if (active) setResults(data.users || []);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query]);

  const remainingResults = useMemo(
    () =>
      results.filter(
        (item) =>
          !selected.some((picked) => picked._id === item._id) &&
          !excluded.some((picked) => picked._id === item._id),
      ),
    [results, selected, excluded],
  );

  async function handleSend() {
    setConfirmOpen(false);
    setStatus(null);
    setSending(true);
    try {
      const data = await api.admin.sendEmail({
        subject: subject.trim(),
        message: message.trim(),
        ctaLabel: ctaLabel.trim() || undefined,
        ctaUrl: ctaUrl.trim() || undefined,
        userIds: selected.map((item) => item._id),
        audience,
        excludedUserIds: excluded.map((item) => item._id),
      });
      if (data.queued) {
        const days = data.estimatedDays || 1;
        setStatus({
          kind: "success",
          text: `Campaign queued for ${data.totalRecipients} recipient${data.totalRecipients === 1 ? "" : "s"}. Our email provider's daily send limit means this will go out in batches over about ${days} day${days === 1 ? "" : "s"} — track progress on the campaigns page.`,
        });
      } else {
        setStatus({
          kind: "success",
          text: `Email sent to ${data.sent} recipient${data.sent === 1 ? "" : "s"}${data.failed ? `, ${data.failed} failed` : ""}.`,
        });
      }
    } catch (err) {
      setStatus({
        kind: "error",
        text: err instanceof Error ? err.message : "Failed to send email.",
      });
    } finally {
      setSending(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className='min-h-screen flex items-center justify-center text-slate-500'>
        Loading...
      </div>
    );
  }

  if (!canSend) {
    return (
      <div className='min-h-screen flex items-center justify-center text-slate-500'>
        Access restricted
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#F8FAFF] px-4 py-8'>
      <div className='mx-auto max-w-4xl'>
        <div className='mb-4 flex items-center justify-between gap-3'>
          <button
            onClick={() => router.push("/admin")}
            className='inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'>
            Back to admin
          </button>
          <button
            onClick={() => router.push("/admin/email/campaigns")}
            className='inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'>
            Campaign history
          </button>
        </div>

        <div className='rounded-[2rem] border border-slate-200 bg-white p-4 sm:p-5 shadow-sm'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.24em] text-slate-400'>
                Admin email
              </p>
              <h1 className='mt-2 text-2xl font-black text-slate-950'>
                Send email to users
              </h1>
              <p className='mt-2 text-sm text-slate-600'>
                Send a personalised note to one user, a selected set of users,
                or a bulk audience of funmates and/or seekers.
              </p>
            </div>
            <div className='self-start rounded-2xl bg-slate-950 px-4 py-3 text-right text-white'>
              <p className='text-[11px] uppercase tracking-[0.2em] text-white/60'>
                Selected
              </p>
              <p className='text-2xl font-black'>{selected.length}</p>
            </div>
          </div>

          <div className='mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]'>
            <div className='space-y-4'>
              <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4'>
                <label className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
                  Audience
                </label>
                <div className='mt-2 grid grid-cols-2 gap-2'>
                  {AUDIENCE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type='button'
                      onClick={() => setAudience(option.value)}
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold ${audience === option.value ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600"}`}>
                      {option.label}
                    </button>
                  ))}
                </div>
                {isBulk && (
                  <p className='mt-2 text-xs text-slate-500'>
                    Includes real{" "}
                    {audience === "all_funmates_and_seekers"
                      ? "funmate and seeker"
                      : `${AUDIENCE_NOUN[audience]}`}{" "}
                    accounts with email addresses. Large sends go out in
                    throttled batches over a few days because of our email
                    provider&apos;s daily limit — you can exclude specific users
                    below.
                  </p>
                )}
                <label className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
                  Search users
                </label>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='Search by name, username, or email'
                  className='mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100'
                />
                <p className='mt-2 text-[11px] text-slate-500'>
                  Type at least 2 characters to load matching users.
                </p>
              </div>

              <div className='rounded-2xl border border-slate-200 bg-white'>
                <div className='border-b border-slate-200 px-4 py-3'>
                  <h2 className='text-sm font-semibold text-slate-900'>
                    Search results
                  </h2>
                </div>
                <div className='max-h-72 overflow-y-auto'>
                  {searching ? (
                    <div className='px-4 py-6 text-sm text-slate-500'>
                      Searching...
                    </div>
                  ) : remainingResults.length === 0 ? (
                    <div className='px-4 py-6 text-sm text-slate-500'>
                      No users found.
                    </div>
                  ) : (
                    remainingResults.map((item) => (
                      <button
                        key={item._id}
                        onClick={() =>
                          isBulk
                            ? setExcluded((current) => [...current, item])
                            : setSelected((current) => [...current, item])
                        }
                        className='flex w-full items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 last:border-0'>
                        <div>
                          <p className='text-sm font-semibold text-slate-950'>
                            {item.name}
                          </p>
                          <p className='text-xs text-slate-500'>
                            @{item.username} · {item.email}
                          </p>
                        </div>
                        <span className='rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600'>
                          {isBulk ? "Exclude" : "Add"}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className='rounded-2xl border border-slate-200 bg-white p-4'>
                <div className='flex items-center justify-between'>
                  <h2 className='text-sm font-semibold text-slate-900'>
                    {isBulk ? "Excluded users" : "Selected recipients"}
                  </h2>
                  <button
                    onClick={() => (isBulk ? setExcluded([]) : setSelected([]))}
                    className='text-xs font-semibold text-slate-500 hover:text-slate-800'>
                    Clear all
                  </button>
                </div>
                <div className='mt-3 flex flex-wrap gap-2'>
                  {(isBulk ? excluded : selected).length === 0 ? (
                    <p className='text-sm text-slate-500'>
                      {isBulk
                        ? "No users excluded."
                        : "No recipients selected yet."}
                    </p>
                  ) : (
                    (isBulk ? excluded : selected).map((item) => (
                      <button
                        key={item._id}
                        onClick={() =>
                          isBulk
                            ? setExcluded((current) =>
                                current.filter(
                                  (picked) => picked._id !== item._id,
                                ),
                              )
                            : setSelected((current) =>
                                current.filter(
                                  (picked) => picked._id !== item._id,
                                ),
                              )
                        }
                        className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700'>
                        <span>{item.name}</span>
                        <span className='text-slate-400'>×</span>
                      </button>
                    ))
                  )}
                </div>
                {isBulk && audienceCount && (
                  <p className='mt-3 text-xs font-semibold text-slate-600'>
                    {audienceCount.total} recipients will receive this email (
                    {excluded.length} excluded).
                  </p>
                )}
              </div>
            </div>

            <div className='space-y-4'>
              <div className='rounded-2xl border border-slate-200 bg-white p-4'>
                <label className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
                  Subject
                </label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder='Email subject'
                  className='mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100'
                />
              </div>

              <div className='rounded-2xl border border-slate-200 bg-white p-4'>
                <label className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder='Write the message here'
                  rows={7}
                  className='mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100'
                />
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='rounded-2xl border border-slate-200 bg-white p-4'>
                  <label className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
                    CTA label
                  </label>
                  <input
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                    placeholder='View details'
                    className='mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100'
                  />
                </div>
                <div className='rounded-2xl border border-slate-200 bg-white p-4'>
                  <label className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
                    CTA URL
                  </label>
                  <input
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    placeholder='https://...'
                    className='mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100'
                  />
                </div>
              </div>

              <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4'>
                <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
                  Preview
                </p>
                <div className='mt-3 rounded-2xl border border-slate-200 bg-white p-4'>
                  <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-400'>
                    Subject
                  </p>
                  <p className='mt-1 text-sm font-semibold text-slate-950'>
                    {subject || "Your subject will appear here"}
                  </p>
                  <p className='mt-3 text-sm leading-6 text-slate-600 whitespace-pre-line'>
                    {message || "Your message preview will appear here."}
                  </p>
                  {ctaLabel && ctaUrl && (
                    <div className='mt-4'>
                      <span className='inline-flex rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white'>
                        {ctaLabel}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {status && (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    status.kind === "success"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border border-rose-200 bg-rose-50 text-rose-700"
                  }`}>
                  {status.text}
                </div>
              )}

              <button
                onClick={() => {
                  setStatus(null);
                  if (!subject.trim() || !message.trim()) {
                    setStatus({
                      kind: "error",
                      text: "Subject and message are required.",
                    });
                    return;
                  }
                  if (audience === "selected" && selected.length === 0) {
                    setStatus({
                      kind: "error",
                      text: "Select at least one recipient.",
                    });
                    return;
                  }
                  setConfirmOpen(true);
                }}
                disabled={sending}
                className='w-full rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-60'>
                {sending
                  ? "Sending..."
                  : isBulk
                    ? `Send to ${audienceCount?.total ?? "all"} ${audience === "all_funmates_and_seekers" ? "users" : `${AUDIENCE_NOUN[audience]}s`}`
                    : `Send to ${selected.length || 0} user${selected.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {confirmOpen && (
        <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center px-3 sm:px-4'>
          <div
            className='absolute inset-0 bg-slate-950/45 backdrop-blur-sm'
            onClick={() => !sending && setConfirmOpen(false)}
          />
          <div className='relative w-full max-w-md rounded-t-[1.75rem] sm:rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl'>
            <p className='text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400'>
              Confirm send
            </p>
            <h2 className='mt-2 text-xl font-black text-slate-950'>
              Send this email now?
            </h2>
            <p className='mt-2 text-sm leading-6 text-slate-600'>
              This message will be delivered to{" "}
              {isBulk
                ? (audienceCount?.total ?? "the eligible")
                : selected.length}{" "}
              recipient{isBulk || selected.length !== 1 ? "s" : ""}
              {isBulk
                ? ", in throttled batches over the next day or two if the list is large"
                : ""}
              .
            </p>

            <div className='mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700'>
              <p className='font-semibold text-slate-900'>{subject}</p>
              <p className='mt-2 line-clamp-5 whitespace-pre-line leading-6'>
                {message}
              </p>
            </div>

            <div className='mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end'>
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={sending}
                className='rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-60'>
                Cancel
              </button>
              <button
                onClick={() => void handleSend()}
                disabled={sending}
                className='rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60'>
                {sending ? "Sending..." : "Yes, send email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
