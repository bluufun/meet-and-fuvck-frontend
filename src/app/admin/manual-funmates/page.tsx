"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { canAdminAccess } from "@/lib/adminAccess";
import { api } from "@/lib/api";
import { GENDERS } from "@/lib/profileOptions";

type ManualFunmate = {
  _id: string;
  name: string;
  username: string;
  age?: number;
  gender?: string;
  state?: string;
  city?: string;
  whatsapp?: string;
  profileMedia: string[];
  thumbnailUrl: string | null;
  createdAt: string;
};

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT Abuja",
];

const emptyForm = {
  username: "",
  name: "",
  age: "",
  gender: "",
  state: "",
  city: "",
  bio: "",
  whatsapp: "",
};

export default function ManualFunmatesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const canManage = canAdminAccess(
    user?.adminPermissions,
    "manage_users",
    user?.adminRole || null,
  );

  const [loading, setLoading] = useState(true);
  const [showManualFunmates, setShowManualFunmates] = useState(true);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [funmates, setFunmates] = useState<ManualFunmate[]>([]);
  const [total, setTotal] = useState(0);

  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState<File[]>([]);
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deleteAllText, setDeleteAllText] = useState("");
  const [deletingAll, setDeletingAll] = useState(false);

  const loadFunmates = useCallback(async () => {
    const data = await api.admin.manualFunmates.list({ limit: 50 });
    setFunmates(data.funmates);
    setTotal(data.total);
    setShowManualFunmates(data.showManualFunmates);
  }, []);

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
    loadFunmates()
      .catch(() => {
        if (active) setStatus({ kind: "error", text: "Could not load manual funmates." });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, canManage, router, user, loadFunmates]);

  async function handleToggleVisibility() {
    setTogglingVisibility(true);
    try {
      const data = await api.admin.manualFunmates.settings.update(
        !showManualFunmates,
      );
      setShowManualFunmates(data.showManualFunmates);
    } catch (error) {
      setStatus({
        kind: "error",
        text: error instanceof Error ? error.message : "Could not update visibility.",
      });
    } finally {
      setTogglingVisibility(false);
    }
  }

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    setFiles(selected.slice(0, 6));
  }

  async function handleCreate() {
    setStatus(null);

    if (!form.username || !form.name || !form.age || !form.gender || !form.state || !form.city) {
      setStatus({ kind: "error", text: "Username, name, age, gender, state, and city are required." });
      return;
    }
    if (files.length === 0) {
      setStatus({ kind: "error", text: "Add at least one photo or video." });
      return;
    }

    setCreating(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      files.forEach((file) => formData.append("files", file));

      await api.admin.manualFunmates.create(formData);
      setStatus({ kind: "success", text: `@${form.username} was created successfully.` });
      setForm(emptyForm);
      setFiles([]);
      const fileInput = document.getElementById("manual-funmate-files") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
      await loadFunmates();
    } catch (error) {
      setStatus({
        kind: "error",
        text: error instanceof Error ? error.message : "Could not create manual funmate.",
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteOne(userId: string, username: string) {
    if (!window.confirm(`Delete @${username}? This cannot be undone.`)) return;
    setDeletingId(userId);
    try {
      await api.admin.manualFunmates.delete(userId);
      await loadFunmates();
    } catch (error) {
      setStatus({
        kind: "error",
        text: error instanceof Error ? error.message : "Could not delete that funmate.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteAll() {
    if (deleteAllText.trim().toUpperCase() !== "DELETE ALL") return;
    setDeletingAll(true);
    try {
      const data = await api.admin.manualFunmates.deleteAll();
      setStatus({ kind: "success", text: `Deleted ${data.deletedCount} manual funmate(s).` });
      setConfirmDeleteAll(false);
      setDeleteAllText("");
      await loadFunmates();
    } catch (error) {
      setStatus({
        kind: "error",
        text: error instanceof Error ? error.message : "Could not delete all manual funmates.",
      });
    } finally {
      setDeletingAll(false);
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

        {/* Visibility toggle */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Manual funmates
              </p>
              <h1 className="mt-2 text-2xl font-black text-slate-950">
                Add funmate manually
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Profiles added here go through the same watermark and storage
                pipeline as real uploads, and appear on the landing page and
                Discover exactly like organic profiles — unless hidden below.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-500">
                  {showManualFunmates ? "Visible to seekers" : "Hidden from seekers"}
                </p>
                <p className="text-[11px] text-slate-400">{total} manual funmate(s)</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={showManualFunmates}
                onClick={handleToggleVisibility}
                disabled={togglingVisibility}
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                  showManualFunmates ? "bg-emerald-500" : "bg-slate-300"
                } disabled:opacity-60`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                    showManualFunmates ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {status && (
          <div
            className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
              status.kind === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {status.text}
          </div>
        )}

        {/* Create form */}
        <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-slate-950">New profile</h2>
          <p className="mt-1 text-sm text-slate-500">
            Skin tone, height, education, occupation, appearance, orientation,
            and experiences are picked automatically. Bust size is set for
            female profiles only.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Username
              </label>
              <input
                value={form.username}
                onChange={(e) => updateField("username", e.target.value.toLowerCase())}
                placeholder="e.g. amaka_lagos"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Name
              </label>
              <input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g. Amaka"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Age
              </label>
              <input
                type="number"
                min={18}
                max={80}
                value={form.age}
                onChange={(e) => updateField("age", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Gender
              </label>
              <select
                value={form.gender}
                onChange={(e) => updateField("gender", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              >
                <option value="">Select gender</option>
                {GENDERS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                State
              </label>
              <select
                value={form.state}
                onChange={(e) => updateField("state", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              >
                <option value="">Select state</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                City
              </label>
              <input
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                placeholder="e.g. Ikeja"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                WhatsApp number (optional)
              </label>
              <input
                value={form.whatsapp}
                onChange={(e) => updateField("whatsapp", e.target.value)}
                placeholder="11-digit number"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Bio / description
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                maxLength={200}
                rows={3}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Photos / videos (up to 6, watermarked automatically)
              </label>
              <input
                id="manual-funmate-files"
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                multiple
                onChange={handleFileChange}
                className="mt-2 w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none file:mr-3 file:rounded-full file:border-0 file:bg-slate-950 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
              />
              {files.length > 0 && (
                <p className="mt-2 text-xs text-slate-500">{files.length} file(s) selected</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={creating}
              className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {creating ? "Creating..." : "Create funmate"}
            </button>
          </div>
        </div>

        {/* Existing manual funmates */}
        <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-slate-950">
              Manually added funmates ({total})
            </h2>
            {total > 0 && (
              <button
                type="button"
                onClick={() => setConfirmDeleteAll(true)}
                className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                Delete all manual funmates
              </button>
            )}
          </div>

          {funmates.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">No manual funmates yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {funmates.map((fm) => (
                <div key={fm._id} className="flex items-center gap-4 py-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {fm.thumbnailUrl && (
                      <img
                        src={fm.thumbnailUrl}
                        alt={fm.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {fm.name} <span className="text-slate-400">@{fm.username}</span>
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {fm.age ? `${fm.age} · ` : ""}
                      {fm.gender ? `${fm.gender} · ` : ""}
                      {fm.city}{fm.city && fm.state ? ", " : ""}{fm.state}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDeleteOne(fm._id, fm.username)}
                    disabled={deletingId === fm._id}
                    className="shrink-0 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                  >
                    {deletingId === fm._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete-all confirmation */}
      {confirmDeleteAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-950">
              Delete all manual funmates?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              This permanently deletes every profile added through this page,
              including their media. This cannot be undone. Type{" "}
              <span className="font-semibold">DELETE ALL</span> to confirm.
            </p>
            <input
              value={deleteAllText}
              onChange={(e) => setDeleteAllText(e.target.value)}
              placeholder="DELETE ALL"
              className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmDeleteAll(false);
                  setDeleteAllText("");
                }}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteAll()}
                disabled={deleteAllText.trim().toUpperCase() !== "DELETE ALL" || deletingAll}
                className="rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {deletingAll ? "Deleting..." : "Delete all"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}