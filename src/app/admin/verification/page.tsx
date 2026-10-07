"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getAdminRedirect } from "@/lib/adminGuards";
import { canAdminAccess } from "@/lib/adminAccess";

interface PendingUser {
  _id: string;
  name: string;
  username: string;
  email: string;
  faceVerifySessionStatus?:
    | "manual_review_pending"
    | "verified"
    | "failed"
    | "existing_user"
    | null;
  faceVerifySessionToken?: string | null;
  faceVerifyStartedAt?: string | null;
  faceVerifyLastError?: string | null;
  createdAt: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("bf_token")}` };
}

function faceVerifyStatusLabel(
  status?: PendingUser["faceVerifySessionStatus"],
) {
  switch (status) {
    case "manual_review_pending":
      return "Under manual review";
    case "verified":
      return "Verified";
    case "failed":
      return "Verification failed";
    case "existing_user":
      return "Matched face";
    default:
      return "Manual review";
  }
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const redirect = getAdminRedirect("/admin/verification", authLoading, user);
  const authBlocked = authLoading || !user;
  const canReviewVerification = canAdminAccess(
    user?.adminPermissions,
    "verification",
    user?.adminRole || null,
  );
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [reviewUsers, setReviewUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const useIsomorphicLayoutEffect =
    typeof window === "undefined" ? useEffect : useLayoutEffect;

  useIsomorphicLayoutEffect(() => {
    if (redirect) {
      router.replace(redirect);
      return;
    }
    if (!canReviewVerification) return;
    fetchPendingUsers();
  }, [authLoading, canReviewVerification, redirect, router, user]);

  async function fetchPendingUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/admin/pending-verifications`, {
        headers: authHeader(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const users = ((data.users || []) as PendingUser[]).filter(
        (user) => user.faceVerifySessionStatus === "manual_review_pending",
      );
      setPendingUsers(users);
      setReviewUsers(users);
    } catch (err: any) {
      setError("Failed to load pending users. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (authBlocked || redirect || loading)
    return (
      <div className='h-[80vh] bg-[#F8FAFF] flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-8 h-8 border-2 border-[#1E3A8A] border-t-transparent rounded-full animate-spin mx-auto mb-3' />
          <p className='text-[#64748B] text-sm'>Loading verifications…</p>
        </div>
      </div>
    );

  if (!canReviewVerification) {
    return (
      <div className='h-[80vh] bg-[#F8FAFF] flex items-center justify-center px-4 text-center'>
        <div className='max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm'>
          <h1 className='text-xl font-bold text-slate-950'>
            Access restricted
          </h1>
          <p className='mt-2 text-sm leading-6 text-slate-600'>
            Your admin account cannot review verifications.
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

  if (error)
    return (
      <div className='h-[80vh] bg-[#F8FAFF] flex items-center justify-center px-4'>
        <div className='text-center max-w-sm'>
          <p className='text-red-500 text-sm mb-4'>{error}</p>
          <button
            onClick={fetchPendingUsers}
            className='bg-[#1E3A8A] text-white px-6 py-2.5 rounded-xl text-sm font-medium'>
            Retry
          </button>
        </div>
      </div>
    );

  return (
    <div className='h-[80vh] py-6 px-4'>
      <div className='max-w-2xl mx-auto'>
        {/* Header */}
        <div className='mb-6'>
          <button
            onClick={() => router.push("/admin")}
            className='mb-4 inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'>
            Back to admin
          </button>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <h1 className='text-xl font-bold text-[#0F172A]'>
                Verifications
              </h1>
              <p className='text-[#64748B] text-xs mt-0.5'>
                Review FaceVerify sessions
              </p>
            </div>
            <span className='bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full'>
              {pendingUsers.length} manual reviews
            </span>
          </div>
        </div>

        {reviewUsers.length > 0 && (
          <div className='mb-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800'>
            {reviewUsers.length} manual review case
            {reviewUsers.length === 1 ? "" : "s"} need admin attention.
          </div>
        )}

        {pendingUsers.length === 0 ? (
          <div className='text-center py-20 text-[#94A3B8]'>
            <p className='text-base font-medium'>All caught up!</p>
            <p className='text-sm mt-1'>No manual review verifications.</p>
          </div>
        ) : (
          <div className='flex flex-col gap-3 pb-10'>
            {pendingUsers.map((u) => (
              <div
                key={u._id}
                className='bg-white border border-[#E2E8F0] rounded-2xl p-4'>
                {/* Top row: photo + info */}
                <div className='flex gap-3 items-start'>
                  <div className='w-14 h-16 rounded-xl bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex items-center justify-center flex-shrink-0 text-white font-bold'>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='font-semibold text-[#0F172A] text-sm leading-snug truncate'>
                      {u.name}
                    </p>
                    <p className='text-xs text-[#64748B] truncate mt-0.5'>
                      @{u.username}
                    </p>
                    <p className='text-xs text-[#64748B] truncate'>{u.email}</p>

                    <div className='mt-2'>
                      <span className='text-xs text-[#94A3B8]'>
                        FaceVerify{" "}
                      </span>
                      <code className='text-xs font-mono text-[#0F172A] bg-[#F1F5F9] px-1.5 py-0.5 rounded'>
                        {faceVerifyStatusLabel(u.faceVerifySessionStatus)}
                      </code>
                    </div>
                    {u.faceVerifyLastError && (
                      <p className='mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800'>
                        {u.faceVerifyLastError}
                      </p>
                    )}

                    {u.faceVerifyStartedAt && (
                      <p className='text-[10px] text-[#94A3B8] mt-1'>
                        Started{" "}
                        {new Date(u.faceVerifyStartedAt).toLocaleDateString(
                          "en-NG",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </p>
                    )}

                    <p className='text-[10px] text-[#94A3B8] mt-1'>
                      {new Date(u.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Full-width Review button */}
                <button
                  onClick={() => router.push(`/admin/verify/${u._id}`)}
                  className='mt-3 w-full bg-[#1E3A8A] hover:bg-[#1e40af] active:bg-[#1e3374] text-white py-3 rounded-xl text-sm font-semibold transition'>
                  Review →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
