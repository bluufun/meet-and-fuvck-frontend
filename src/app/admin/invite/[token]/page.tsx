"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function AdminInvitePage() {
  const router = useRouter();
  const { token } = useParams<{ token: string }>();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?redirectTo=${encodeURIComponent(`/admin/invite/${token}`)}`);
    }
  }, [loading, router, token, user]);

  async function acceptInvite() {
    if (!user) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/admin/invites/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bf_token")}`,
        },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not accept invite");
      setDone(true);
      setTimeout(() => router.replace("/admin"), 1400);
    } catch (err) {
      setError((err as Error).message || "Could not accept invite");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading invite...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <button
          onClick={() => router.push("/admin")}
          className="mb-4 inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back to admin
        </button>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
          Admin invite
        </p>
        <h1 className="mt-2 text-2xl font-black text-slate-950">
          Accept your Bluufun admin invite
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Signed in as <span className="font-semibold text-slate-900">{user.email}</span>. Your account email must match the invite email before access is granted.
        </p>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Safety check</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            This invite only becomes active for the logged-in account that matches the invited email. No one can claim it from a different account.
          </p>
        </div>

        {error && (
          <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}
        {done && (
          <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Invite accepted. Redirecting...
          </p>
        )}

        <button
          onClick={() => void acceptInvite()}
          disabled={busy}
          className="mt-5 w-full rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Accepting..." : "Accept invite"}
        </button>
      </div>
    </div>
  );
}
