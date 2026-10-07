"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { canAdminAccess } from "@/lib/adminAccess";
import { api } from "@/lib/api";

type SocialLinks = {
  telegram: string;
  instagram: string;
  tiktok: string;
  whatsapp: string;
};

const DEFAULT_LINKS: SocialLinks = {
  telegram: "https://t.me/",
  instagram: "https://instagram.com/",
  tiktok: "https://tiktok.com/",
  whatsapp: "https://wa.me/",
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const canManage = canAdminAccess(user?.adminPermissions, "manage_users", user?.adminRole || null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [links, setLinks] = useState<SocialLinks>(DEFAULT_LINKS);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!canManage) {
      router.replace("/admin");
      return;
    }

    let active = true;
    api.admin.socialLinks
      .get()
      .then((data) => {
        if (active) setLinks({ ...DEFAULT_LINKS, ...(data.links || {}) });
      })
      .catch(() => {
        if (active) setLinks(DEFAULT_LINKS);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, canManage, router, user]);

  const hasChanges = useMemo(
    () =>
      Object.entries(links).some(
        ([key, value]) =>
          String(value || "").trim() !== DEFAULT_LINKS[key as keyof SocialLinks],
      ),
    [links],
  );

  function updateField(field: keyof SocialLinks, value: string) {
    setLinks((current) => ({ ...current, [field]: value }));
  }

  async function handleSave() {
    setStatus(null);
    setSaving(true);
    try {
      const data = await api.admin.socialLinks.update(links);
      setLinks({ ...DEFAULT_LINKS, ...(data.links || {}) });
      setStatus({ kind: "success", text: "Social links updated successfully." });
    } catch (error) {
      setStatus({
        kind: "error",
        text: error instanceof Error ? error.message : "Failed to update social links.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFF]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1E3A8A] border-t-transparent" />
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFF] text-slate-500">
        Access restricted
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF] px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => router.push("/admin")}
          className="mb-4 inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back to admin
        </button>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Settings
              </p>
              <h1 className="mt-2 text-2xl font-black text-slate-950">
                Social links
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Update the links shown across the contact page and the mobile menu sidebar.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-950 px-4 py-3 text-white">
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                Live links
              </p>
              <p className="text-2xl font-black">4</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {(
              [
                ["telegram", "Telegram"],
                ["instagram", "Instagram"],
                ["tiktok", "TikTok"],
                ["whatsapp", "WhatsApp"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {label} URL
                </label>
                <input
                  value={links[key]}
                  onChange={(e) => updateField(key, e.target.value)}
                  placeholder={DEFAULT_LINKS[key]}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                />
              </div>
            ))}
          </div>

          {status && (
            <div
              className={`mt-5 rounded-2xl px-4 py-3 text-sm ${
                status.kind === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {status.text}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Changes update the shared social settings immediately after save.
            </p>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || !hasChanges}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save social links"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
