"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getAdminRedirect } from "@/lib/adminGuards";
import { canAdminAccess } from "@/lib/adminAccess";
import { friendlyApiError, friendlyApiMessage } from "@/lib/apiMessages";

type ReportStatus = "all" | "open" | "reviewing" | "resolved" | "dismissed";
type ReportSort = "newest" | "oldest";

type Report = {
  _id: string;
  reason: string;
  subReason?: string;
  details?: string;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  adminNotes?: string;
  createdAt: string;
  evidenceKeys?: string[];
  reporterId: {
    _id: string;
    name: string;
    username: string;
    email: string;
  } | null;
  reportedUserId: {
    _id: string;
    name: string;
    username: string;
    email: string;
    role?: string;
    isSuspended?: boolean;
    isActivated?: boolean;
    verificationStatus?: string;
    activationStatus?: string;
  } | null;
  reportedUsername: string;
  resolvedBy?: {
    _id: string;
    name: string;
    username: string;
    email: string;
  } | null;
  resolvedAt?: string | null;
  updatedAt?: string;
  assignedTo?: {
    _id: string;
    name: string;
    username: string;
    email: string;
  } | null;
  history?: Array<{
    status: Report["status"];
    adminNotes?: string;
    changedAt: string;
    changedBy?: { name?: string; username?: string };
  }>;
};

type ReportStats = {
  total: number;
  open: number;
  reviewing: number;
  resolved: number;
  dismissed: number;
  highPriority: number;
};

type EvidencePreview = {
  key: string;
  url: string;
  isVideo: boolean;
};

type MediaReplacementRequest = {
  _id: string;
  userId: {
    _id: string;
    name: string;
    username: string;
    email: string;
    role?: string;
    isActivated?: boolean;
    verificationStatus?: string;
    profileMedia?: string[];
  };
  oldKey: string;
  newKey: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt?: string;
  adminNotes?: string;
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("bf_token")}` };
}

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function labelForReason(reason: string) {
  const map: Record<string, string> = {
    harassment: "Harassment or abuse",
    impersonation: "Impersonation",
    scam: "Scam or fraud",
    nudity: "Explicit content",
    underage: "Underage suspicion",
    hate: "Hate or discrimination",
    spam: "Spam or misleading profile",
    cold_reception: "Unwelcoming or dismissive behavior",
    fake_identity: "Fake identity",
    off_platform_solicitation: "Off-platform solicitation",
    other: "Other",
  };
  return map[reason] || reason.replace(/_/g, " ");
}

function severityForReason(reason: string) {
  if (["underage", "scam", "fake_identity", "impersonation"].includes(reason))
    return "high";
  if (["nudity", "hate", "off_platform_solicitation"].includes(reason))
    return "medium";
  return "normal";
}

function statusTone(status: Report["status"]) {
  switch (status) {
    case "open":
      return "amber";
    case "reviewing":
      return "sky";
    case "resolved":
      return "emerald";
    case "dismissed":
      return "slate";
  }
}

function statusStyle(tone: string) {
  const styles: Record<string, string> = {
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    sky: "bg-sky-50 text-sky-700 border-sky-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    slate: "bg-slate-50 text-slate-600 border-slate-200",
  };
  return styles[tone] || styles.slate;
}

function severityStyle(severity: string) {
  return severity === "high"
    ? "bg-rose-50 text-rose-700 border-rose-200"
    : severity === "medium"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-slate-50 text-slate-700 border-slate-200";
}

function humanVerificationStatus(status?: string) {
  switch (status) {
    case "approved":
      return "Verified";
    case "rejected":
      return "Not verified";
    case "pending":
      return "Pending";
    case "manual_review_pending":
      return "Under review";
    case "not_started":
      return "Not started";
    default:
      return status ? status.replace(/_/g, " ") : "Unknown";
  }
}

export function AdminSupportWorkspace({
  initialTab = "reports",
  standalone = false,
}: {
  initialTab?: "reports" | "gallery";
  standalone?: boolean;
}) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const redirect = getAdminRedirect("/admin/support", authLoading, user);
  const authBlocked = authLoading || !user;
  const canUseReports = canAdminAccess(
    user?.adminPermissions,
    "reports",
    user?.adminRole || null,
  );
  const canModerateUsers =
    canAdminAccess(
      user?.adminPermissions,
      "moderation",
      user?.adminRole || null,
    ) ||
    canAdminAccess(
      user?.adminPermissions,
      "manage_users",
      user?.adminRole || null,
    );
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState<ReportStatus>("open");
  const [sort, setSort] = useState<ReportSort>("newest");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [reportTotal, setReportTotal] = useState(0);
  const [reportStats, setReportStats] = useState<ReportStats>({
    total: 0,
    open: 0,
    reviewing: 0,
    resolved: 0,
    dismissed: 0,
    highPriority: 0,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [evidence, setEvidence] = useState<EvidencePreview[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [mediaReplacements, setMediaReplacements] = useState<
    MediaReplacementRequest[]
  >([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [selectedReplacementId, setSelectedReplacementId] = useState<
    string | null
  >(null);
  const [selectedReplacement, setSelectedReplacement] =
    useState<MediaReplacementRequest | null>(null);
  const [replacementPreview, setReplacementPreview] = useState<{
    old?: EvidencePreview;
    next?: EvidencePreview;
  }>({});
  const [activeTab, setActiveTab] = useState<"reports" | "gallery">(initialTab);

  useEffect(() => {
    if (redirect) {
      router.replace(redirect);
      return;
    }
    if (!canUseReports) return;
    if (activeTab === "reports") void fetchReports();
    if (activeTab === "gallery") void fetchMediaReplacements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authLoading,
    filter,
    activeTab,
    canUseReports,
    redirect,
    router,
    user,
    page,
    sort,
  ]);

  const stats = useMemo(() => {
    return reports.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.status] += 1;
        return acc;
      },
      { total: 0, open: 0, reviewing: 0, resolved: 0, dismissed: 0 },
    );
  }, [reports]);

  async function fetchReports(nextPage = page) {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({
        status: filter,
        page: String(nextPage),
        limit: "20",
        sort,
      });
      if (search.trim().length >= 2) qs.set("search", search.trim());
      const [res, statsRes] = await Promise.all([
        fetch(`${API}/api/reports?${qs.toString()}`, { headers: authHeader() }),
        fetch(`${API}/api/reports/stats`, { headers: authHeader() }),
      ]);
      const data = await res.json().catch(() => ({}));
      const statsData = await statsRes.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to load reports");
      setReports((data.reports || []) as Report[]);
      setPages(data.pages || 1);
      setReportTotal(data.total || 0);
      if (statsRes.ok) setReportStats(statsData as ReportStats);
      const nextReports = (data.reports || []) as Report[];
      if (!nextReports.some((item) => item._id === selectedId)) {
        setSelectedId(null);
        setSelectedReport(null);
        setEvidence([]);
      }
    } catch (err) {
      setError(friendlyApiError(err, "Could not load reports."));
    } finally {
      setLoading(false);
    }
  }

  async function fetchReportDetail(reportId: string) {
    setDrawerLoading(true);
    try {
      const report = reports.find((item) => item._id === reportId);
      setSelectedReport(report || null);
      if (canModerateUsers) setAdminNotes(report?.adminNotes || "");
      const evidenceKeys = report?.evidenceKeys || [];
      const previews: EvidencePreview[] = [];

      const results = await Promise.all(
        evidenceKeys.map(async (key) => {
          const res = await fetch(
            `${API}/api/media/signed-url?key=${encodeURIComponent(key)}`,
            { headers: authHeader() },
          );
          const data = await res.json().catch(() => ({}));
          return res.ok
            ? { key, url: data.url, isVideo: /\.(mp4|webm|mov)$/i.test(key) }
            : null;
        }),
      );
      previews.push(...(results.filter(Boolean) as EvidencePreview[]));

      setEvidence(previews);
    } catch {
      setEvidence([]);
    } finally {
      setDrawerLoading(false);
    }
  }

  async function fetchMediaReplacements() {
    setMediaLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/media-replacements/pending`, {
        headers: authHeader(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data.message || "Failed to load replacements");
      setMediaReplacements((data.requests || []) as MediaReplacementRequest[]);
      if (
        !data.requests?.some(
          (item: MediaReplacementRequest) => item._id === selectedReplacementId,
        )
      ) {
        setSelectedReplacementId(null);
        setSelectedReplacement(null);
        setReplacementPreview({});
      }
    } catch (err) {
      setError(friendlyApiError(err, "Could not load media replacements."));
    } finally {
      setMediaLoading(false);
    }
  }

  async function openReplacement(requestId: string) {
    setSelectedReplacementId(requestId);
    const request =
      mediaReplacements.find((item) => item._id === requestId) || null;
    setSelectedReplacement(request);
    if (!request) return;
    try {
      const [oldRes, nextRes] = await Promise.all([
        fetch(
          `${API}/api/media/signed-url?key=${encodeURIComponent(request.oldKey)}`,
          {
            headers: authHeader(),
          },
        ),
        fetch(
          `${API}/api/media/signed-url?key=${encodeURIComponent(request.newKey)}`,
          {
            headers: authHeader(),
          },
        ),
      ]);
      const oldData = await oldRes.json().catch(() => ({}));
      const nextData = await nextRes.json().catch(() => ({}));
      setReplacementPreview({
        old: oldRes.ok
          ? {
              key: request.oldKey,
              url: oldData.url,
              isVideo: /\.(mp4|webm|mov)$/i.test(request.oldKey),
            }
          : undefined,
        next: nextRes.ok
          ? {
              key: request.newKey,
              url: nextData.url,
              isVideo: /\.(mp4|webm|mov)$/i.test(request.newKey),
            }
          : undefined,
      });
    } catch {
      setReplacementPreview({});
    }
  }

  async function reviewReplacement(status: "approved" | "rejected") {
    if (!selectedReplacement || !canModerateUsers) return;
    setActionBusy(true);
    try {
      const res = await fetch(
        `${API}/api/admin/media-replacements/${selectedReplacement._id}/review`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeader() },
          body: JSON.stringify({ status, adminNotes }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Update failed");
      await fetchMediaReplacements();
      setSelectedReplacement(null);
      setReplacementPreview({});
      setAdminNotes("");
    } catch (err) {
      setError(friendlyApiError(err, "Could not update replacement."));
    } finally {
      setActionBusy(false);
    }
  }

  async function openReport(reportId: string) {
    setSelectedId(reportId);
    await fetchReportDetail(reportId);
  }

  async function updateReport(
    status: "open" | "reviewing" | "resolved" | "dismissed",
    assignedTo?: string | null,
  ) {
    if (!selectedReport || !canModerateUsers) return;
    setActionBusy(true);
    try {
      if (status === "dismissed" || status === "resolved") {
        const confirmed = window.confirm(`Mark this report as ${status}?`);
        if (!confirmed) return;
      }
      const res = await fetch(
        `${API}/api/reports/${selectedReport._id}/review`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeader() },
          body: JSON.stringify({
            status,
            adminNotes,
            ...(assignedTo !== undefined ? { assignedTo } : {}),
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Update failed");
      await fetchReports();
      setSelectedReport({ ...selectedReport, status, adminNotes });
      await fetchReportDetail(selectedReport._id);
      setSuccess(`Report ${status === "open" ? "reopened" : status}.`);
    } catch (err) {
      setError(friendlyApiError(err, "Could not update report."));
    } finally {
      setActionBusy(false);
    }
  }

  async function suspendReportedUser() {
    if (!selectedReport?.reportedUserId?._id) return;
    if (
      !window.confirm(
        `Suspend @${selectedReport.reportedUsername}? This blocks the account until an admin unsuspends it.`,
      )
    )
      return;
    setActionBusy(true);
    try {
      const res = await fetch(
        `${API}/api/admin/users/${selectedReport.reportedUserId._id}/suspend`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeader() },
          body: JSON.stringify({
            reason: `Reported via support: ${selectedReport.reason}`,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Suspend failed");
      setError("");
      await fetchReports();
      await fetchReportDetail(selectedReport._id);
      setSuccess(`@${selectedReport.reportedUsername} was suspended.`);
    } catch (err) {
      setError(
        friendlyApiMessage((err as Error).message, "Could not suspend user."),
      );
    } finally {
      setActionBusy(false);
    }
  }

  const detailPortal =
    mounted && selectedReport
      ? createPortal(
          <div className='fixed inset-0 z-[90]'>
            <button
              onClick={() => {
                setSelectedId(null);
                setSelectedReport(null);
                setEvidence([]);
              }}
              className='absolute inset-0 bg-slate-950/40 backdrop-blur-[6px]'
            />
            <aside className='absolute right-0 top-0 h-full w-full max-w-[30rem] overflow-y-auto border-l border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]'>
              <div className='sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur'>
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <p className='text-[11px] font-semibold uppercase tracking-[0.26em] text-rose-500'>
                      Report detail
                    </p>
                    <h2 className='mt-2 text-2xl font-black text-slate-950'>
                      @{selectedReport.reportedUsername}
                    </h2>
                    <p className='mt-1 text-sm text-slate-600'>
                      Reported by @
                      {selectedReport.reporterId?.username || "deleted account"}{" "}
                      ·{" "}
                      {new Date(selectedReport.createdAt).toLocaleString(
                        "en-NG",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedId(null);
                      setSelectedReport(null);
                      setEvidence([]);
                    }}
                    className='rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50'>
                    Close
                  </button>
                </div>
                <div className='mt-4 flex flex-wrap gap-2'>
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                      statusStyle(statusTone(selectedReport.status)),
                    )}>
                    {selectedReport.status}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                      severityStyle(severityForReason(selectedReport.reason)),
                    )}>
                    {severityForReason(selectedReport.reason)} severity
                  </span>
                  <span className='rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600'>
                    {labelForReason(selectedReport.reason)}
                  </span>
                </div>
              </div>

              <div className='space-y-5 px-6 py-5'>
                <section className='rounded-3xl border border-slate-200 p-4'>
                  <h3 className='text-sm font-semibold text-slate-900'>
                    Reporter
                  </h3>
                  <div className='mt-3 grid gap-2 text-sm text-slate-600'>
                    <p className='font-medium text-slate-900'>
                      {selectedReport.reporterId?.name || "Deleted account"}
                    </p>
                    <p>@{selectedReport.reporterId?.username || "—"}</p>
                    <p>
                      {selectedReport.reporterId?.email ||
                        "No longer available"}
                    </p>
                  </div>
                  <p className='mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800'>
                    The reporter is visible to admins so moderation stays
                    accountable.
                  </p>
                </section>

                <section className='rounded-3xl border border-slate-200 p-4'>
                  <h3 className='text-sm font-semibold text-slate-900'>
                    Reported profile
                  </h3>
                  <div className='mt-3 flex flex-wrap gap-2'>
                    <span
                      className={cn(
                        "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                        selectedReport.reportedUserId?.isSuspended
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700",
                      )}>
                      {selectedReport.reportedUserId?.isSuspended
                        ? "Suspended"
                        : "Active"}
                    </span>
                    <span className='rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600'>
                      {selectedReport.reportedUserId?.role || "Deleted account"}
                    </span>
                    <span className='rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600'>
                      {humanVerificationStatus(
                        selectedReport.reportedUserId?.verificationStatus,
                      )}
                    </span>
                  </div>
                  <div className='mt-3 grid gap-2 text-sm text-slate-600'>
                    <p className='font-medium text-slate-900'>
                      {selectedReport.reportedUserId?.name || "Deleted account"}
                    </p>
                    <p>
                      @
                      {selectedReport.reportedUserId?.username ||
                        selectedReport.reportedUsername ||
                        "—"}
                    </p>
                    <p>
                      {selectedReport.reportedUserId?.email ||
                        "No longer available"}
                    </p>
                  </div>
                  <div className='mt-4 flex flex-wrap gap-2'>
                    <button
                      onClick={() =>
                        void updateReport(
                          selectedReport.status,
                          user?.id || null,
                        )
                      }
                      disabled={actionBusy || !user?.id}
                      className='rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 disabled:opacity-60'>
                      {selectedReport.assignedTo?._id === user?.id
                        ? "Assigned to you"
                        : "Assign to me"}
                    </button>
                    {selectedReport.reportedUserId && (
                      <Link
                        href={`/funmate/${selectedReport.reportedUsername}`}
                        className='rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'>
                        Open profile
                      </Link>
                    )}
                    {canModerateUsers && selectedReport.reportedUserId && (
                      <button
                        onClick={() => void suspendReportedUser()}
                        disabled={actionBusy}
                        className='rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60'>
                        Suspend user
                      </button>
                    )}
                  </div>
                </section>

                <section className='rounded-3xl border border-slate-200 p-4'>
                  <h3 className='text-sm font-semibold text-slate-900'>
                    Report details
                  </h3>
                  {selectedReport.subReason && (
                    <p className='mt-2 text-sm font-medium text-slate-800'>
                      {selectedReport.subReason}
                    </p>
                  )}
                  {selectedReport.details ? (
                    <p className='mt-2 text-sm leading-6 text-slate-600'>
                      {selectedReport.details}
                    </p>
                  ) : (
                    <p className='mt-2 text-sm text-slate-400'>
                      No extra details provided.
                    </p>
                  )}
                </section>

                <section className='rounded-3xl border border-slate-200 p-4'>
                  <h3 className='text-sm font-semibold text-slate-900'>
                    Evidence
                  </h3>
                  {drawerLoading ? (
                    <div className='mt-3 rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500'>
                      Loading evidence...
                    </div>
                  ) : evidence.length > 0 ? (
                    <div className='mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2'>
                      {evidence.map((item) => (
                        <div
                          key={item.key}
                          className='overflow-hidden rounded-2xl border border-slate-200 bg-slate-50'>
                          {item.isVideo ? (
                            <video
                              src={item.url}
                              controls
                              className='h-52 w-full object-cover'
                            />
                          ) : (
                            <img
                              src={item.url}
                              alt='Evidence'
                              className='h-52 w-full object-cover'
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='mt-3 rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500'>
                      No evidence was uploaded.
                    </div>
                  )}
                </section>

                <section className='rounded-3xl border border-slate-200 p-4'>
                  <h3 className='text-sm font-semibold text-slate-900'>
                    Moderation note
                  </h3>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    placeholder='Write the internal moderation note...'
                    className='mt-3 w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100'
                  />
                  {selectedReport.history &&
                    selectedReport.history.length > 0 && (
                      <div className='mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3'>
                        <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400'>
                          Activity history
                        </p>
                        <div className='mt-2 space-y-2'>
                          {selectedReport.history
                            .slice(-5)
                            .reverse()
                            .map((entry, index) => (
                              <p
                                key={`${entry.changedAt}-${index}`}
                                className='text-xs text-slate-600'>
                                <span className='font-semibold capitalize'>
                                  {entry.status}
                                </span>{" "}
                                ·{" "}
                                {entry.changedBy?.name ||
                                  entry.changedBy?.username ||
                                  "Admin"}{" "}
                                ·{" "}
                                {new Date(entry.changedAt).toLocaleString(
                                  "en-NG",
                                )}
                              </p>
                            ))}
                        </div>
                      </div>
                    )}
                  <div className='mt-4 flex flex-wrap gap-2'>
                    {(selectedReport.status === "resolved" ||
                      selectedReport.status === "dismissed") && (
                      <button
                        onClick={() => void updateReport("open")}
                        disabled={actionBusy}
                        className='rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 disabled:opacity-60'>
                        Reopen report
                      </button>
                    )}
                    <button
                      onClick={() => void updateReport("reviewing")}
                      disabled={actionBusy}
                      className='rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-60'>
                      Mark reviewing
                    </button>
                    <button
                      onClick={() => void updateReport("resolved")}
                      disabled={actionBusy}
                      className='rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60'>
                      Resolve
                    </button>
                    <button
                      onClick={() => void updateReport("dismissed")}
                      disabled={actionBusy}
                      className='rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60'>
                      Dismiss
                    </button>
                  </div>
                </section>
              </div>
            </aside>
          </div>,
          document.body,
        )
      : null;

  const replacementDetailPortal =
    mounted && selectedReplacement
      ? createPortal(
          <div className='fixed inset-0 z-[90]'>
            <button
              onClick={() => {
                setSelectedReplacement(null);
                setReplacementPreview({});
              }}
              className='absolute inset-0 bg-slate-950/40 backdrop-blur-[6px]'
            />
            <aside className='absolute right-0 top-0 h-full w-full max-w-[30rem] overflow-y-auto border-l border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]'>
              <div className='sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur'>
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <p className='text-[11px] font-semibold uppercase tracking-[0.26em] text-amber-500'>
                      Gallery replacement
                    </p>
                    <h2 className='mt-2 text-2xl font-black text-slate-950'>
                      @{selectedReplacement.userId.username}
                    </h2>
                    <p className='mt-1 text-sm text-slate-600'>
                      Review the old media and the uploaded replacement side by
                      side.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedReplacement(null);
                      setReplacementPreview({});
                    }}
                    className='rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50'>
                    Close
                  </button>
                </div>
              </div>
              <div className='space-y-5 px-6 py-5'>
                <section className='rounded-3xl border border-slate-200 p-4'>
                  <h3 className='text-sm font-semibold text-slate-900'>
                    Media comparison
                  </h3>
                  <div className='mt-4 grid gap-3 sm:grid-cols-2'>
                    {[replacementPreview.old, replacementPreview.next].map(
                      (item, idx) => (
                        <div
                          key={idx}
                          className='overflow-hidden rounded-2xl border border-slate-200 bg-slate-50'>
                          {item ? (
                            item.isVideo ? (
                              <video
                                src={item.url}
                                controls
                                className='h-52 w-full object-cover'
                              />
                            ) : (
                              <img
                                src={item.url}
                                alt=''
                                className='h-52 w-full object-cover'
                              />
                            )
                          ) : (
                            <div className='flex h-52 items-center justify-center text-sm text-slate-400'>
                              Preview unavailable
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </section>
                <section className='rounded-3xl border border-slate-200 p-4'>
                  <h3 className='text-sm font-semibold text-slate-900'>
                    Moderation note
                  </h3>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    placeholder='Optional admin note...'
                    className='mt-3 w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100'
                  />
                  <div className='mt-4 flex flex-wrap gap-2'>
                    <button
                      onClick={() => void reviewReplacement("approved")}
                      disabled={actionBusy}
                      className='rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60'>
                      Approve replacement
                    </button>
                    <button
                      onClick={() => void reviewReplacement("rejected")}
                      disabled={actionBusy}
                      className='rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60'>
                      Reject replacement
                    </button>
                  </div>
                </section>
              </div>
            </aside>
          </div>,
          document.body,
        )
      : null;

  if (!mounted) return null;

  if (authBlocked || redirect) {
    return (
      <div className='h-[80vh] bg-slate-50 flex items-center justify-center'>
        <div className='w-8 h-8 border-2 border-[#1E3A8A] border-t-transparent rounded-full animate-spin' />
      </div>
    );
  }

  if (!canUseReports) {
    return (
      <div className='h-[80vh] flex items-center justify-center px-4 text-center'>
        <div className='max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm'>
          <h1 className='text-xl font-bold text-slate-950'>
            Access restricted
          </h1>
          <p className='mt-2 text-sm leading-6 text-slate-600'>
            Your admin account does not currently have moderation access.
          </p>
          <button
            onClick={() => router.push("/admin")}
            className='mt-5 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white'>
            Back to admin
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='h-[80vh] bg-slate-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-950 border-t-transparent' />
          <p className='text-sm text-slate-500'>Loading reports...</p>
        </div>
      </div>
    );
  }

  const openCount = reportStats.open;

  return (
    <div className=' px-4 py-6 text-slate-900'>
      {detailPortal}
      {replacementDetailPortal}
      <div className='mx-auto max-w-5xl'>
        <div className='mb-6 rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur'>
          <div className='flex flex-col justify-between gap-4 lg:flex-row lg:items-end'>
            <div>
              <p className='text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400'>
                Support
              </p>
              <h1 className='mt-2 text-3xl font-black tracking-tight text-slate-950'>
                {activeTab === "reports"
                  ? "Reports queue"
                  : "Gallery moderation"}
              </h1>
              <p className='mt-2 max-w-2xl text-sm leading-6 text-slate-600'>
                {activeTab === "reports"
                  ? "Review user reports, inspect evidence, and resolve safety issues with a clear, prioritized queue."
                  : "Review gallery replacement requests and compare submitted media before approving or rejecting changes."}
              </p>
            </div>
            <div className='flex items-center justify-end flex-wrap gap-2'>
              <button
                onClick={() => router.push("/admin")}
                className='rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'>
                Back to admin
              </button>
              {standalone && (
                <button
                  onClick={() =>
                    router.push(
                      activeTab === "reports"
                        ? "/admin/support/gallery"
                        : "/admin/support/reports",
                    )
                  }
                  className='rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'>
                  {activeTab === "reports"
                    ? "Gallery moderation"
                    : "Reports queue"}
                </button>
              )}
              <button
                onClick={() =>
                  void (activeTab === "reports"
                    ? fetchReports()
                    : fetchMediaReplacements())
                }
                className='rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800'>
                Refresh
              </button>
            </div>
          </div>

          {activeTab === "reports" && (
            <div className='mt-5 grid grid-cols-2 gap-3 md:grid-cols-5'>
              <StatCard label='Total' value={reportStats.total} tone='slate' />
              <StatCard
                label='Open'
                value={reportStats.open}
                tone='amber'
                emphasis
              />
              <StatCard
                label='Reviewing'
                value={reportStats.reviewing}
                tone='sky'
              />
              <StatCard
                label='Resolved'
                value={reportStats.resolved}
                tone='emerald'
              />
              <StatCard
                label='High priority'
                value={reportStats.highPriority}
                tone='rose'
              />
            </div>
          )}
          {activeTab === "gallery" && (
            <div className='mt-5 grid max-w-xs grid-cols-1 gap-3'>
              <StatCard
                label='Pending replacements'
                value={mediaReplacements.length}
                tone='amber'
                emphasis
              />
            </div>
          )}

          {activeTab === "reports" && (
            <div className='mt-4 flex flex-col gap-2 sm:flex-row'>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setPage(1);
                    void fetchReports(1);
                  }
                }}
                placeholder='Search username, reason or report details'
                className='min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100'
              />
              <button
                onClick={() => {
                  setPage(1);
                  void fetchReports(1);
                }}
                className='rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50'>
                Search
              </button>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as ReportSort);
                  setPage(1);
                }}
                className='rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700'>
                <option value='newest'>Newest first</option>
                <option value='oldest'>Oldest first</option>
              </select>
            </div>
          )}

          {activeTab === "reports" && (
            <div className='mt-5 flex flex-wrap gap-2'>
              {(
                [
                  "all",
                  "open",
                  "reviewing",
                  "resolved",
                  "dismissed",
                ] as ReportStatus[]
              ).map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setFilter(item);
                    setSelectedId(null);
                    setSelectedReport(null);
                    setEvidence([]);
                  }}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold capitalize transition",
                    filter === item
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  )}>
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className='mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
            {error}
          </div>
        )}
        {success && (
          <button
            onClick={() => setSuccess("")}
            className='mb-4 w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-sm text-emerald-700'>
            {success} <span className='float-right font-semibold'>Dismiss</span>
          </button>
        )}

        {!standalone && (
          <div className='mb-5 flex flex-wrap gap-2 rounded-[1.5rem] border border-slate-200 bg-white p-2 w-fit'>
            <button
              type='button'
              onClick={() => setActiveTab("reports")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                activeTab === "reports"
                  ? "bg-slate-950 text-white"
                  : "bg-transparent text-slate-600 hover:bg-slate-50",
              )}>
              Reports
            </button>
            <button
              type='button'
              onClick={() => setActiveTab("gallery")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                activeTab === "gallery"
                  ? "bg-slate-950 text-white"
                  : "bg-transparent text-slate-600 hover:bg-slate-50",
              )}>
              Gallery moderation
            </button>
          </div>
        )}

        {activeTab === "reports" ? (
          <div
            className={cn(
              "grid gap-4",
              selectedReport &&
                "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]",
            )}>
            <div className='space-y-3'>
              {reports.map((report) => {
                const active = selectedId === report._id;
                const severity = severityForReason(report.reason);
                return (
                  <button
                    key={report._id}
                    onClick={() => void openReport(report._id)}
                    className={cn(
                      "w-full rounded-[1.75rem] border p-5 text-left shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(15,23,42,0.08)]",
                      active
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-white",
                    )}>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <p
                          className={cn(
                            "truncate text-base font-bold",
                            active ? "text-white" : "text-slate-950",
                          )}>
                          @{report.reportedUsername}
                        </p>
                        <p
                          className={cn(
                            "mt-1 text-sm",
                            active ? "text-white/70" : "text-slate-500",
                          )}>
                          Reported by @
                          {report.reporterId?.username || "deleted account"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                          active
                            ? "border-white/20 bg-white/10 text-white"
                            : statusStyle(statusTone(report.status)),
                        )}>
                        {report.status}
                      </span>
                    </div>
                    <div className='mt-4 flex flex-wrap gap-2'>
                      <span
                        className={cn(
                          "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                          active
                            ? "border-white/20 bg-white/10 text-white"
                            : severityStyle(severity),
                        )}>
                        {severity} severity
                      </span>
                      <span
                        className={cn(
                          "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                          active
                            ? "border-white/20 bg-white/10 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-600",
                        )}>
                        {labelForReason(report.reason)}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "mt-4 line-clamp-2 text-sm leading-6",
                        active ? "text-white/80" : "text-slate-600",
                      )}>
                      {report.details ||
                        report.subReason ||
                        "No details added."}
                    </p>
                  </button>
                );
              })}
              {reports.length === 0 && (
                <div className='rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-500'>
                  {openCount === 0
                    ? "No open reports."
                    : "No reports match this filter."}
                </div>
              )}
              {reports.length > 0 && (
                <div className='flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600'>
                  <span>
                    {reportTotal} reports · page {page} of {pages}
                  </span>
                  <div className='flex gap-2'>
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((value) => value - 1)}
                      className='rounded-xl border px-3 py-1.5 disabled:opacity-40'>
                      Previous
                    </button>
                    <button
                      disabled={page >= pages}
                      onClick={() => setPage((value) => value + 1)}
                      className='rounded-xl border px-3 py-1.5 disabled:opacity-40'>
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "grid gap-4",
              selectedReplacement &&
                "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]",
            )}>
            <div className='space-y-3'>
              {mediaLoading ? (
                <div className='rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-500'>
                  Loading replacements...
                </div>
              ) : (
                mediaReplacements.map((request) => {
                  const active = selectedReplacementId === request._id;
                  return (
                    <button
                      key={request._id}
                      onClick={() => void openReplacement(request._id)}
                      className={cn(
                        "w-full rounded-[1.75rem] border p-5 text-left shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(15,23,42,0.08)]",
                        active
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-white",
                      )}>
                      <div className='flex items-start justify-between gap-3'>
                        <div className='min-w-0'>
                          <p
                            className={cn(
                              "text-base font-bold",
                              active ? "text-white" : "text-slate-950",
                            )}>
                            @{request.userId.username}
                          </p>
                          <p
                            className={cn(
                              "mt-1 text-sm",
                              active ? "text-white/70" : "text-slate-500",
                            )}>
                            {request.userId.name} · {request.userId.email}
                          </p>
                        </div>
                        <span className='rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700'>
                          Pending
                        </span>
                      </div>
                      <p
                        className={cn(
                          "mt-4 line-clamp-2 text-sm leading-6",
                          active ? "text-white/80" : "text-slate-600",
                        )}>
                        Media replacement request submitted for review.
                      </p>
                    </button>
                  );
                })
              )}
              {!mediaLoading && mediaReplacements.length === 0 && (
                <div className='rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-500'>
                  No pending media replacements.
                </div>
              )}
            </div>

            {selectedReplacement && (
              <div className='rounded-[1.75rem] border border-slate-200 bg-white p-6 text-slate-500'>
                {selectedReplacement ? (
                  <div className='text-left'>
                    <p className='text-sm font-semibold text-slate-900'>
                      @{selectedReplacement.userId.username}
                    </p>
                    <p className='mt-1 text-sm text-slate-600'>
                      Review the old media and the uploaded replacement side by
                      side.
                    </p>
                    <div className='mt-4 grid gap-3 sm:grid-cols-2'>
                      {[replacementPreview.old, replacementPreview.next].map(
                        (item, idx) => (
                          <div
                            key={idx}
                            className='overflow-hidden rounded-2xl border border-slate-200 bg-slate-50'>
                            {item ? (
                              item.isVideo ? (
                                <video
                                  src={item.url}
                                  controls
                                  className='h-52 w-full object-cover'
                                />
                              ) : (
                                <img
                                  src={item.url}
                                  alt=''
                                  className='h-52 w-full object-cover'
                                />
                              )
                            ) : (
                              <div className='flex h-52 items-center justify-center text-sm text-slate-400'>
                                Preview unavailable
                              </div>
                            )}
                          </div>
                        ),
                      )}
                    </div>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      placeholder='Optional admin note...'
                      className='mt-4 w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100'
                    />
                    <div className='mt-4 flex flex-wrap gap-2'>
                      <button
                        onClick={() => void reviewReplacement("approved")}
                        disabled={actionBusy}
                        className='rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60'>
                        Approve replacement
                      </button>
                      <button
                        onClick={() => void reviewReplacement("rejected")}
                        disabled={actionBusy}
                        className='rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60'>
                        Reject replacement
                      </button>
                    </div>
                  </div>
                ) : (
                  <p>Loading review details...</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminSupportPage() {
  return <AdminSupportWorkspace />;
}

function StatCard({
  label,
  value,
  tone,
  emphasis = false,
}: {
  label: string;
  value: number;
  tone: "slate" | "amber" | "sky" | "emerald" | "rose";
  emphasis?: boolean;
}) {
  const toneMap: Record<string, string> = {
    slate: "bg-white ring-1 ring-slate-200 text-slate-900",
    amber: "bg-amber-50 ring-1 ring-amber-200 text-amber-800",
    sky: "bg-sky-50 ring-1 ring-sky-200 text-sky-800",
    emerald: "bg-emerald-50 ring-1 ring-emerald-200 text-emerald-800",
    rose: "bg-rose-50 ring-1 ring-rose-200 text-rose-800",
  };

  return (
    <div
      className={cn(
        "rounded-2xl p-4",
        toneMap[tone],
        emphasis && "shadow-[0_12px_30px_rgba(251,191,36,0.12)]",
      )}>
      <p className='text-[11px] uppercase tracking-[0.22em] text-slate-400'>
        {label}
      </p>
      <p className='mt-2 text-2xl font-black'>{value}</p>
    </div>
  );
}
