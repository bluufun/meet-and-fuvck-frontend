"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import BookingRatesEditor from "@/components/booking/BookingRatesEditor";
import type { BookingRate } from "@/lib/bookingRates";
import { X } from "lucide-react";
import {
  BODY_TYPES,
  BUST_SIZES,
  CURRENT_WANTS,
  EDUCATION_LEVELS,
  EXPERIENCES,
  GENDERS,
  HEIGHTS,
  INTENTS,
  OCCUPATIONS,
  ORIENTATIONS,
  SKIN_TONES,
} from "@/lib/profileOptions";
import { NIGERIA_STATES, getLGAs } from "@/lib/nigeria-locations";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface EditProfileModalProps {
  user: any;
  onClose: () => void;
  onSaved: (user: any) => void;
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border-2 px-3.5 py-2 text-xs font-medium transition ${
        selected
          ? "border-[#1E3A8A] bg-[#EFF6FF] text-[#1E3A8A]"
          : "border-[#E2E8F0] text-[#334155]"
      }`}>
      {label}
    </button>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { id: string; label: string }[];
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-base outline-none transition focus:border-[#3B82F6]">
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function EditProfileModal({
  user,
  onClose,
  onSaved,
}: EditProfileModalProps) {
  const [form, setForm] = useState({
    age: user.age?.toString() || "",
    whatsapp: user.whatsapp || "",
    whatsappLocked: Boolean(user.whatsappLocked),
    whatsappUnlockPriceNgn: user.whatsappUnlockPriceNgn?.toString() || "",
    state: user.state || "",
    lga: user.lga || "",
    education: user.education || "",
    occupation: user.occupation || "",
    gender: user.gender || "",
    orientation: user.orientation || "",
    bodyType: user.bodyType || [],
    height: user.height || "",
    skinTone: user.skinTone || "",
    bustSize: user.bustSize || "",
    intent: user.intent || [],
    currentWant: user.currentWant || "",
    experiences: user.experiences || [],
    vibeBio: user.vibeBio || "",
    bookingRates: (user as typeof user & { bookingRates?: BookingRate[] }).bookingRates || [],
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ age?: string; whatsapp?: string; price?: string }>({});
  const [saveError, setSaveError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const whatsappRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const ageRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(min-width: 1280px)");
    const update = () => setIsDesktop(mediaQuery.matches);
    update();

    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mounted, onClose]);

  const lgas = form.state ? getLGAs(form.state) : [];

  function toggleArr(field: "bodyType" | "experiences", id: string) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(id)
        ? prev[field].filter((value: string) => value !== id)
        : [...prev[field], id],
    }));
  }

  async function handleSave() {
    const nextErrors: { age?: string; whatsapp?: string; price?: string } = {};
    if (!form.age || Number(form.age) < 18) nextErrors.age = "Age must be at least 18.";
    if (!form.whatsapp.trim()) nextErrors.whatsapp = "WhatsApp number is required.";
    if (form.whatsappLocked && (!form.whatsappUnlockPriceNgn || Number(form.whatsappUnlockPriceNgn) < 100)) {
      nextErrors.price = "Unlock price must be at least ₦100.";
    }
    setErrors(nextErrors);
    setSaveError("");
    if (Object.keys(nextErrors).length) {
      if (nextErrors.age) ageRef.current?.focus();
      else if (nextErrors.whatsapp) whatsappRef.current?.focus();
      else priceRef.current?.focus();
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/users/me/funmate-profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bf_token")}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message || "We couldn't save your changes. Please try again.");
      }
      const data = await res.json();
      onSaved(data.user);
      setShowSuccess(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "We couldn't save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const fields = (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">Booking rates</p>
        <BookingRatesEditor value={form.bookingRates} onChange={(bookingRates) => setForm((prev) => ({ ...prev, bookingRates }))} />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
          Basics
        </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-[#334155]">Age</label>
            <input
              type="number"
              min={18}
              max={80}
              required
              ref={ageRef}
              value={form.age}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, age: e.target.value }))
              }
              className={`w-full rounded-xl border px-3 py-2.5 text-base outline-none focus:border-[#3B82F6] focus:ring-3 focus:ring-[#3B82F6]/15 ${errors.age ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/15" : "border-[#CBD5E1]"}`}
            />
            {errors.age && <p className="mt-1 text-xs font-medium text-rose-600">{errors.age}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#334155]">WhatsApp</label>
            <input
              type="tel"
              required
              maxLength={11}
              ref={whatsappRef}
              value={form.whatsapp}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, whatsapp: e.target.value.replace(/\D/g, "").slice(0, 11) }))
              }
              className={`w-full rounded-xl border px-3 py-2.5 text-base outline-none focus:border-[#3B82F6] focus:ring-3 focus:ring-[#3B82F6]/15 ${errors.whatsapp ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/15" : "border-[#CBD5E1]"}`}
              />
              {errors.whatsapp && <p className="mt-1 text-xs font-medium text-rose-600">{errors.whatsapp}</p>}
            </div>
          </div>
            <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 shadow-sm">
              <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A]">
                <input
                  type="checkbox"
                  checked={form.whatsappLocked}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, whatsappLocked: e.target.checked }))
                }
                className="h-4 w-4 rounded border-[#CBD5E1] text-[#1E3A8A]"
              />
              Keep WhatsApp private
            </label>
            <p className="mt-1 text-xs leading-5 text-emerald-900/70">
              Leave your number open for free, or make people pay to view it by setting your unlock price in NGN.
            </p>
            {form.whatsappLocked && (
              <div className="mt-3">
                <label className="mb-1 block text-xs text-[#334155]">Unlock price in NGN</label>
                <input
                  type="number"
                  min={100}
                  required
                  ref={priceRef}
                  value={form.whatsappUnlockPriceNgn}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, whatsappUnlockPriceNgn: e.target.value }))
                  }
                  placeholder="e.g. 500"
                  className={`w-full rounded-xl border px-3 py-2.5 text-base outline-none focus:border-[#3B82F6] focus:ring-3 focus:ring-[#3B82F6]/15 ${errors.price ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/15" : "border-[#CBD5E1]"}`}
                />
                {errors.price && <p className="mt-1 text-xs font-medium text-rose-600">{errors.price}</p>}
              </div>
            )}
          </div>
        </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
          Location
        </p>
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="State"
            value={form.state}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, state: value, lga: "" }))
            }
            options={NIGERIA_STATES.map((state) => ({
              id: state.state,
              label: state.state,
            }))}
            placeholder="State"
          />
          <SelectField
            label="LGA"
            value={form.lga}
            onChange={(value) => setForm((prev) => ({ ...prev, lga: value }))}
            options={lgas.map((lga) => ({ id: lga, label: lga }))}
            placeholder="LGA"
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
          Education & work
        </p>
        <div className="space-y-3">
          <SelectField
            label="Education"
            value={form.education}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, education: value }))
            }
            options={EDUCATION_LEVELS}
            placeholder="Education"
          />
          <SelectField
            label="Occupation"
            value={form.occupation}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, occupation: value }))
            }
            options={OCCUPATIONS}
            placeholder="Occupation"
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
          Identity
        </p>
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Gender"
            value={form.gender}
            onChange={(value) => setForm((prev) => ({ ...prev, gender: value }))}
            options={GENDERS}
            placeholder="Gender"
          />
          <SelectField
            label="Orientation"
            value={form.orientation}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, orientation: value }))
            }
            options={ORIENTATIONS}
            placeholder="Orientation"
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
          Appearance
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          {BODY_TYPES.map((bodyType) => (
            <Chip
              key={bodyType.id}
              label={bodyType.label}
              selected={form.bodyType.includes(bodyType.id)}
              onClick={() => toggleArr("bodyType", bodyType.id)}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Height"
            value={form.height}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, height: value }))
            }
            options={HEIGHTS}
            placeholder="Height"
          />
          <SelectField
            label="Skin tone"
            value={form.skinTone}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, skinTone: value }))
            }
            options={SKIN_TONES}
            placeholder="Skin tone"
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <SelectField
            label="Bust size"
            value={form.bustSize}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, bustSize: value }))
            }
            options={BUST_SIZES}
            placeholder="Bust size"
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
          Looking for
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          {INTENTS.map((intent) => (
            <Chip
              key={intent.id}
              label={intent.label}
              selected={form.intent.includes(intent.id)}
              onClick={() => setForm((prev) => ({ ...prev, intent: [intent.id] }))}
            />
          ))}
        </div>
        <SelectField
          label="Right now"
          value={form.currentWant}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, currentWant: value }))
          }
          options={CURRENT_WANTS}
          placeholder="Right now..."
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
          Experiences
        </p>
        <div className="flex flex-wrap gap-2">
          {EXPERIENCES.map((experience) => (
            <Chip
              key={experience.id}
              label={experience.label}
              selected={form.experiences.includes(experience.id)}
              onClick={() => toggleArr("experiences", experience.id)}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
          Vibe bio
        </p>
        <textarea
          value={form.vibeBio}
          rows={4}
          maxLength={200}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, vibeBio: e.target.value }))
          }
          className="w-full resize-none rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-base outline-none"
        />
        <p className="mt-1 text-right text-xs text-[#94A3B8]">
          {form.vibeBio.length}/200
        </p>
      </div>
    </div>
  );

  const mobileContent = (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#F1F5F9] bg-white px-5 py-4">
          <h2 className="text-base font-bold text-[#0F172A]">Edit profile</h2>
          <button
            onClick={onClose}
            className="text-xl leading-none text-[#94A3B8]">
            x
          </button>
        </div>

        <div className="p-5">{saveError && <p className="mb-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700">{saveError}</p>}{fields}</div>

        <div className="sticky bottom-0 flex gap-3 border-t border-[#F1F5F9] bg-white p-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-[#E2E8F0] py-3.5 text-sm font-medium text-[#64748B]">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl bg-[#1E3A8A] py-3.5 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );

  const desktopContent = (
    <div className="fixed inset-0 z-[80]" aria-hidden={false}>
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/20 backdrop-blur-md transition-opacity duration-300"
      />

      <aside
        onClick={(event) => event.stopPropagation()}
        className="absolute bottom-0 right-4 flex h-[min(86vh,760px)] w-[min(980px,calc(100vw-50rem))] flex-col overflow-hidden rounded-t-[2rem] border border-slate-200 bg-white shadow-[0_-24px_80px_rgba(15,23,42,0.16)] transition-transform duration-300 ease-out"
        style={{ transform: "translateY(0)" }}>
        <div className="shrink-0 border-b border-slate-100 px-6 pb-4 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Profile controls
              </p>
              <h2 className="mt-2 text-base font-bold text-[#0F172A]">
                Edit profile
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Update your profile from the desktop drawer without changing the
                mobile bottom sheet.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Close profile editor">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {saveError && <p className="mb-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700">{saveError}</p>}
          {fields}
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-white px-6 py-4">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-[#E2E8F0] py-3.5 text-sm font-medium text-[#64748B]">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-xl bg-[#1E3A8A] py-3.5 text-sm font-semibold text-white disabled:opacity-50">
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );

  if (!mounted) return null;

  return createPortal(
    <>
      {isDesktop ? desktopContent : mobileContent}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/30 px-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="profile-success-title">
          <div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" /></svg>
            </div>
            <h2 id="profile-success-title" className="mt-5 text-xl font-bold text-slate-900">Profile updated successfully</h2>
            <p className="mt-2 text-sm text-slate-500">Your profile changes have been saved.</p>
            <button type="button" autoFocus onClick={onClose} className="mt-6 w-full rounded-xl bg-[#1E3A8A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#172f72]">Done</button>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
