"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { canAdminAccess } from "@/lib/adminAccess";
import { api } from "@/lib/api";

type Campaign = {
  _id: string;
  subject: string;
  audience: string;
  status: "queued" | "sending" | "completed" | "cancelled";
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  completedAt?: string | null;
};

const AUDIENCE_LABEL: Record<string, string> = {
  all_funmates: "All funmates",
  all_seekers: "All seekers",
  all_funmates_and_seekers: "All funmates + seekers",
};

const STATUS_STYLE: Record<Campaign["status"], string> = {
  queued: "bg-slate-100 text-slate-600",
  sending: "bg-sky-100 text-sky-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
};

export default function EmailCampaignsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const canSend = canAdminAccess(
    user?.adminPermissions,
    "manage_users",
    user?.adminRole || null,
  );

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

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
    api.admin
      .listEmailCampaigns(1)
      .then((data) => {
        if (active) setCampaigns(data.campaigns || []);
      })
      .catch(() => {
        if (active) setCampaigns([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [canSend]);

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
      <div className='mx-auto max-w-3xl'>
        <button
          onClick={() => router.push("/admin/email")}
          className='mb-4 inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'>
          Back to compose
        </button>

        <div className='rounded-[2rem] border border-slate-200 bg-white p-4 sm:p-5 shadow-sm'>
          <p className='text-xs font-semibold uppercase tracking-[0.24em] text-slate-400'>
            Admin email
          </p>
          <h1 className='mt-2 text-2xl font-black text-slate-950'>
            Bulk email campaigns
          </h1>
          <p className='mt-2 text-sm text-slate-600'>
            Bulk sends to funmates or seekers are queued and drained in batches
            to respect our email provider&apos;s daily send limit. Track
            progress here.
          </p>

          <div className='mt-5 space-y-3'>
            {loading ? (
              <p className='text-sm text-slate-500'>Loading campaigns...</p>
            ) : campaigns.length === 0 ? (
              <p className='text-sm text-slate-500'>
                No bulk campaigns sent yet.
              </p>
            ) : (
              campaigns.map((campaign) => (
                <button
                  key={campaign._id}
                  onClick={() =>
                    router.push(`/admin/email/campaigns/${campaign._id}`)
                  }
                  className='flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-left transition hover:bg-slate-100'>
                  <div>
                    <p className='text-sm font-semibold text-slate-950'>
                      {campaign.subject}
                    </p>
                    <p className='mt-1 text-xs text-slate-500'>
                      {AUDIENCE_LABEL[campaign.audience] || campaign.audience} ·{" "}
                      {new Date(campaign.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className='flex shrink-0 flex-col items-end gap-1.5'>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLE[campaign.status]}`}>
                      {campaign.status}
                    </span>
                    <span className='text-xs font-semibold text-slate-600'>
                      {campaign.sentCount}/{campaign.totalRecipients} sent
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
