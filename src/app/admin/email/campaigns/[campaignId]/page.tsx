"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { canAdminAccess } from "@/lib/adminAccess";
import { api } from "@/lib/api";

type CampaignDetail = {
  _id: string;
  subject: string;
  message: string;
  audience: string;
  status: "queued" | "sending" | "completed" | "cancelled";
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  pendingCount: number;
  createdAt: string;
  completedAt?: string | null;
};

const AUDIENCE_LABEL: Record<string, string> = {
  all_funmates: "All funmates",
  all_seekers: "All seekers",
  all_funmates_and_seekers: "All funmates + seekers",
};

export default function EmailCampaignDetailPage() {
  const router = useRouter();
  const { campaignId } = useParams<{ campaignId: string }>();
  const { user, loading: authLoading } = useAuth();
  const canSend = canAdminAccess(
    user?.adminPermissions,
    "manage_users",
    user?.adminRole || null,
  );

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [failedRecipients, setFailedRecipients] = useState<
    Array<{ email: string; name: string; lastError?: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!campaignId) return;
    try {
      const data = await api.admin.getEmailCampaign(campaignId);
      setCampaign(data.campaign);
      setFailedRecipients(data.failedRecipients || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load campaign.");
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

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
    if (!canSend) return;
    let active = true;
    (async () => {
      if (active) await load();
    })();
    // Live-ish progress: the background job drains a batch every few
    // minutes, so poll while the campaign is still in flight.
    const interval = setInterval(() => {
      void load();
    }, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [canSend, load]);

  async function handleCancel() {
    if (!campaign) return;
    setCancelling(true);
    try {
      await api.admin.cancelEmailCampaign(campaign._id);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel campaign.",
      );
    } finally {
      setCancelling(false);
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

  const progressPct =
    campaign && campaign.totalRecipients > 0
      ? Math.round(
          ((campaign.sentCount + campaign.failedCount) /
            campaign.totalRecipients) *
            100,
        )
      : 0;

  return (
    <div className='min-h-screen bg-[#F8FAFF] px-4 py-8'>
      <div className='mx-auto max-w-3xl'>
        <button
          onClick={() => router.push("/admin/email/campaigns")}
          className='mb-4 inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'>
          Back to campaigns
        </button>

        {loading ? (
          <p className='text-sm text-slate-500'>Loading campaign...</p>
        ) : !campaign ? (
          <p className='text-sm text-rose-600'>
            {error || "Campaign not found."}
          </p>
        ) : (
          <div className='rounded-[2rem] border border-slate-200 bg-white p-4 sm:p-5 shadow-sm'>
            <p className='text-xs font-semibold uppercase tracking-[0.24em] text-slate-400'>
              {AUDIENCE_LABEL[campaign.audience] || campaign.audience}
            </p>
            <h1 className='mt-2 text-2xl font-black text-slate-950'>
              {campaign.subject}
            </h1>
            <p className='mt-2 text-sm text-slate-600 whitespace-pre-line'>
              {campaign.message}
            </p>

            <div className='mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4'>
              <div className='flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500'>
                <span>Progress</span>
                <span>{progressPct}%</span>
              </div>
              <div className='mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200'>
                <div
                  className='h-full rounded-full bg-slate-950 transition-all'
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className='mt-3 grid grid-cols-3 gap-2 text-center'>
                <div>
                  <p className='text-lg font-black text-emerald-600'>
                    {campaign.sentCount}
                  </p>
                  <p className='text-[11px] uppercase tracking-wide text-slate-500'>
                    Sent
                  </p>
                </div>
                <div>
                  <p className='text-lg font-black text-rose-600'>
                    {campaign.failedCount}
                  </p>
                  <p className='text-[11px] uppercase tracking-wide text-slate-500'>
                    Failed
                  </p>
                </div>
                <div>
                  <p className='text-lg font-black text-slate-700'>
                    {campaign.pendingCount}
                  </p>
                  <p className='text-[11px] uppercase tracking-wide text-slate-500'>
                    Pending
                  </p>
                </div>
              </div>
            </div>

            <p className='mt-4 text-sm text-slate-600'>
              Status:{" "}
              <span className='font-semibold text-slate-900'>
                {campaign.status}
              </span>
              {campaign.status !== "completed" &&
                campaign.status !== "cancelled" && (
                  <>
                    {" "}
                    — sending resumes automatically each day within our
                    provider&apos;s daily limit.
                  </>
                )}
            </p>

            {error && <p className='mt-3 text-sm text-rose-600'>{error}</p>}

            {failedRecipients.length > 0 && (
              <div className='mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4'>
                <h2 className='text-sm font-semibold text-rose-800'>
                  Recent failures
                </h2>
                <ul className='mt-2 space-y-1.5 text-xs text-rose-700'>
                  {failedRecipients.map((r, i) => (
                    <li key={`${r.email}-${i}`}>
                      {r.name} ({r.email})
                      {r.lastError ? ` — ${r.lastError}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(campaign.status === "queued" ||
              campaign.status === "sending") && (
              <button
                onClick={() => void handleCancel()}
                disabled={cancelling}
                className='mt-5 rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60'>
                {cancelling ? "Cancelling..." : "Cancel remaining sends"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
