"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface FullUser {
  _id: string;
  name: string;
  username: string;
  email: string;
  whatsapp?: string;
  verificationStatus:
    | "not_started"
    | "pending"
    | "manual_review_pending"
    | "approved"
    | "rejected";
  verificationSource?:
    | "admin_review"
    | "faceverify_webhook"
    | "faceverify_redirect"
    | null;
  faceVerifySessionStatus?:
    | "existing_user"
    | "verification_required"
    | "pending"
    | "manual_review_pending"
    | "verified"
    | "failed"
    | null;
  faceVerifySessionToken?: string | null;
  faceVerifyStartedAt?: string | null;
  faceVerifyConfirmedAt?: string | null;
  faceVerifyLastError?: string;
  faceVerifyVerifyUrl?: string | null;
  faceVerifyExpiresAt?: string | null;
  faceVerifyConfidence?: number | null;
  faceVerifyQualityScore?: number | null;
  faceVerifyLivenessPassed?: boolean | null;
  faceVerifyDuplicate?: boolean | null;
  faceVerifyMatchedUsername?: string | null;
  faceVerifyRisk?: "LOW" | "MEDIUM" | "HIGH" | null;
  faceVerifyReason?: string | null;
  faceVerifyFrontImageUrl?: string | null;
  createdAt: string;
  age?: number;
  state?: string;
  lga?: string;
  education?: string;
  occupation?: string;
  gender?: string;
  orientation?: string;
  bodyType?: string[];
  height?: string;
  skinTone?: string;
  bustSize?: string;
  experiences?: string[];
  intent?: string[];
  currentWant?: string;
  vibeBio?: string;
  role?: string;
  profileMedia?: string[];
  profileMediaUrls?: string[];
  matchedUserUsername?: string | null;
  adminNotes?: string;
}

type TimelineItem = {
  title: string;
  detail: string;
  tone?: "neutral" | "warning" | "success" | "danger" | "info";
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("bf_token")}` };
}

function Field({
  label,
  value,
}: {
  label: string;
  value?: string | string[] | number | null;
}) {
  const empty = !value || (Array.isArray(value) && value.length === 0);
  const display = empty
    ? "—"
    : Array.isArray(value)
      ? value.join(", ")
      : String(value);
  return (
    <div className='flex justify-between items-start gap-3 py-2.5 border-b border-[#F1F5F9] last:border-0'>
      <span className='text-xs text-[#94A3B8] shrink-0 w-28'>{label}</span>
      <span
        className={`text-xs text-right flex-1 min-w-0 break-words ${empty ? "text-[#CBD5E1]" : "text-[#0F172A] font-medium"}`}>
        {display}
      </span>
    </div>
  );
}

const MAPS: Record<string, Record<string, string>> = {
  education: {
    secondary: "Secondary school",
    diploma: "Diploma / HND",
    bsc: "BSc",
    msc: "MSc",
    phd: "PhD",
    vocational: "Vocational",
    none: "Prefer not to say",
  },
  occupation: {
    corporate: "Corporate worker",
    business: "Business owner",
    corper: "NYSC Corper",
    student: "Student",
    creative: "Creative",
    tech: "Tech professional",
    medical: "Healthcare",
    handwork: "Skilled trade",
    civil_service: "Civil servant",
    freelance: "Freelancer",
    unemployed: "Unemployed",
    prefer_not: "Prefer not to say",
  },
  gender: {
    male: "Male",
    female: "Female",
    trans: "Transgender",
    nonbinary: "Non-binary",
    prefer_not: "Prefer not to say",
  },
  orientation: {
    straight: "Straight",
    bisexual: "Bisexual",
    gay: "Gay",
    lesbian: "Lesbian",
    prefer_not: "Prefer not to say",
  },
  intent: {
    fun: "Fun & good times",
    relationship: "Relationship",
    both: "Open to both",
  },
  currentWant: {
    just_chilling: "Just chilling",
    meet_asap: "Ready to meet",
    good_convo: "Good conversation",
    weekend_plan: "Weekend plans",
    travel_buddy: "Travel buddy",
    date_night: "Date night",
    gym_partner: "Gym partner",
    movie_night: "Movie night",
    emotional_support: "Emotional support",
    networking_now: "Networking",
    exploring: "Just exploring",
    serious_connection: "Serious connection",
  },
};

const r = (key: string, val?: string) =>
  val ? (MAPS[key]?.[val] ?? val) : undefined;

const statusStyle: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

function humanVerificationStatus(status: FullUser["verificationStatus"]) {
  switch (status) {
    case "approved":
      return "Verified";
    case "rejected":
      return "Not verified";
    default:
      return "Pending";
  }
}

function humanFaceVerifyStatus(status?: FullUser["faceVerifySessionStatus"]) {
  switch (status) {
    case "existing_user":
      return "Matched face";
    case "verification_required":
      return "Session started";
    case "manual_review_pending":
      return "Under review";
    case "verified":
      return "Verified";
    case "failed":
      return "Failed";
    default:
      return "Not started";
  }
}

function humanVerificationSource(source?: FullUser["verificationSource"]) {
  switch (source) {
    case "admin_review":
      return "Admin review";
    case "faceverify_webhook":
      return "FaceVerify webhook";
    case "faceverify_redirect":
      return "FaceVerify callback";
    default:
      return "Not set";
  }
}

function humanRisk(risk?: FullUser["faceVerifyRisk"]) {
  switch (risk) {
    case "LOW":
      return "Low risk";
    case "MEDIUM":
      return "Medium risk";
    case "HIGH":
      return "High risk";
    default:
      return "Not set";
  }
}

function mediaUrlFromKey(value?: string | null) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return value;
  return `${API}/${value.replace(/^\/+/, "")}`;
}

function MediaRail({
  title,
  items,
}: {
  title: string;
  items: Array<string | null | undefined>;
}) {
  const urls = items
    .map((item) => mediaUrlFromKey(item))
    .filter(Boolean) as string[];
  return (
    <div className='rounded-2xl border border-[#E2E8F0] bg-white p-4'>
      <p className='text-xs font-semibold text-[#0F172A] mb-3'>{title}</p>
      {urls.length > 0 ? (
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
          {urls.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className='overflow-hidden rounded-2xl border border-slate-100 bg-slate-50'>
              <img
                src={url}
                alt={`${title} ${index + 1}`}
                className='h-44 w-full object-cover'
              />
            </div>
          ))}
        </div>
      ) : (
        <div className='rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500'>
          No gallery media available for review.
        </div>
      )}
    </div>
  );
}

function buildTimeline(user: FullUser): TimelineItem[] {
  const items: TimelineItem[] = [
    {
      title: "Profile submitted",
      detail: `User account created on ${new Date(
        user.createdAt,
      ).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}.`,
      tone: "neutral",
    },
  ];

  if (user.faceVerifyStartedAt) {
    items.push({
      title: "Verification started",
      detail: `FaceVerify session started on ${new Date(user.faceVerifyStartedAt).toLocaleString("en-NG")}.`,
      tone: "info",
    });
  }

  if (user.faceVerifyVerifyUrl) {
    items.push({
      title: "Session link issued",
      detail: "FaceVerify returned a verification link and session metadata.",
      tone: "info",
    });
  }

  if (user.faceVerifySessionStatus === "verification_required") {
    items.push({
      title: "Awaiting FaceVerify",
      detail:
        "The session is still in progress and has not reached manual review.",
      tone: "info",
    });
  }

  if (user.faceVerifySessionStatus === "manual_review_pending") {
    items.push({
      title: "Manual review queued",
      detail: user.faceVerifyDuplicate
        ? `FaceVerify marked this as a probable duplicate${user.matchedUserUsername ? ` against @${user.matchedUserUsername}` : ""}.`
        : "FaceVerify completed and the case was sent for admin review.",
      tone: "warning",
    });
  }

  if (typeof user.faceVerifyLivenessPassed === "boolean") {
    items.push({
      title: "Liveness check",
      detail: user.faceVerifyLivenessPassed
        ? "FaceVerify says the live check passed."
        : "FaceVerify says the live check did not pass.",
      tone: user.faceVerifyLivenessPassed ? "success" : "warning",
    });
  }

  if (typeof user.faceVerifyDuplicate === "boolean") {
    items.push({
      title: "Duplicate check",
      detail: user.faceVerifyDuplicate
        ? `Possible duplicate detected${user.matchedUserUsername ? ` with @${user.matchedUserUsername}` : ""}.`
        : "No duplicate face match flagged.",
      tone: user.faceVerifyDuplicate ? "warning" : "success",
    });
  }

  if (user.faceVerifyLastError) {
    items.push({
      title: "Latest reason",
      detail: user.faceVerifyLastError,
      tone: user.faceVerifySessionStatus === "failed" ? "danger" : "warning",
    });
  }

  if (user.faceVerifyConfirmedAt) {
    items.push({
      title: "Session confirmed",
      detail: `FaceVerify returned a final result on ${new Date(user.faceVerifyConfirmedAt).toLocaleString("en-NG")}.`,
      tone: "success",
    });
  }

  if (user.verificationStatus === "approved") {
    items.push({
      title: "Verification approved",
      detail: `Marked verified via ${humanVerificationSource(user.verificationSource)}.`,
      tone: "success",
    });
  }

  if (user.verificationStatus === "rejected") {
    items.push({
      title: "Verification rejected",
      detail: "The account was not approved.",
      tone: "danger",
    });
  }

  if (user.faceVerifyReason) {
    items.push({
      title: "FaceVerify reason",
      detail: user.faceVerifyReason,
      tone: "warning",
    });
  }

  return items;
}

export default function VerifyUserPage() {
  const router = useRouter();
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<FullUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);
  const isManualReview =
    user?.faceVerifySessionStatus === "manual_review_pending";
  const timeline = user ? buildTimeline(user) : [];

  async function fetchUser() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/admin/user/${userId}`, {
        headers: authHeader(),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const u: FullUser = data.user;
      setUser(u);
      setAdminNotes(u.adminNotes || "");
    } catch (err: unknown) {
      console.error("Failed to load user details:", err);
      setError("Failed to load user details. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => fetchUser());
  }, [userId]);

  async function handleDecision(status: "approved" | "rejected") {
    if (!user) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/admin/verify/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ status, adminNotes }),
      });
      if (!res.ok) throw new Error("Failed");
      setDone(status);
    } catch {
      alert("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-[#F8FAFF] flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-8 h-8 border-2 border-[#1E3A8A] border-t-transparent rounded-full animate-spin mx-auto mb-3' />
          <p className='text-[#64748B] text-sm'>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className='min-h-screen bg-[#F8FAFF] flex items-center justify-center px-4'>
        <div className='text-center'>
          <p className='text-red-500 text-sm mb-4'>
            {error || "User not found"}
          </p>
          <button
            onClick={() => router.push("/admin")}
            className='text-[#1E3A8A] underline text-sm'>
            Back
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className='min-h-screen bg-[#F8FAFF] flex items-center justify-center px-6'>
        <div className='text-center w-full max-w-xs'>
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${done === "approved" ? "bg-emerald-100" : "bg-red-100"}`}>
            <span className='text-2xl'>{done === "approved" ? "✓" : "✕"}</span>
          </div>
          <h2 className='text-lg font-bold text-[#0F172A] mb-2'>
            {user.name} {done === "approved" ? "approved" : "rejected"}
          </h2>
          <p className='text-[#64748B] text-sm mb-6'>
            {done === "approved"
              ? "They'll receive platform access."
              : "Marked as rejected."}
          </p>
          <button
            onClick={() => router.push("/admin")}
            className='w-full bg-[#1E3A8A] text-white py-3.5 rounded-xl text-sm font-semibold'>
            Back to list
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#F8FAFF]'>
      <div className='max-w-2xl mx-auto px-4 py-5 pb-32'>
        <button
          onClick={() => router.push("/admin")}
          className='flex items-center gap-1.5 text-sm text-slate-700 mb-5 bg-white rounded-xl p-3 border'>
          Back to admin
        </button>

        <div className='flex items-center gap-3 mb-5'>
          <div className='w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#1E3A8A] font-bold shrink-0'>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className='flex-1 min-w-0'>
            <h1 className='text-base font-bold text-[#0F172A] truncate'>
              {user.name}
            </h1>
            <p className='text-xs text-[#64748B] truncate'>
              @{user.username} ·{" "}
              {new Date(user.createdAt).toLocaleDateString("en-NG", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize shrink-0 ${statusStyle[user.verificationStatus] ?? "bg-gray-100 text-gray-600"}`}>
            {humanVerificationStatus(user.verificationStatus)}
          </span>
        </div>

        {!isManualReview && (
          <div className='mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900'>
            This profile is not in the manual review queue. The actionable cases
            here are manual review items created by FaceVerify v2 or admin
            review.
          </div>
        )}

        <div className='space-y-3'>
          <div className='bg-white border border-[#E2E8F0] rounded-2xl p-4'>
            <p className='text-xs font-semibold text-[#0F172A] mb-3'>
              FaceVerify session
            </p>
            <Field
              label='Session status'
              value={humanFaceVerifyStatus(user.faceVerifySessionStatus)}
            />
            <Field
              label='Verification source'
              value={humanVerificationSource(user.verificationSource)}
            />
            <Field label='Session token' value={user.faceVerifySessionToken} />
            <Field label='Verify URL' value={user.faceVerifyVerifyUrl} />
            <Field
              label='Expires at'
              value={
                user.faceVerifyExpiresAt
                  ? new Date(user.faceVerifyExpiresAt).toLocaleString("en-NG")
                  : null
              }
            />
            <Field
              label='Started at'
              value={
                user.faceVerifyStartedAt
                  ? new Date(user.faceVerifyStartedAt).toLocaleString("en-NG")
                  : null
              }
            />
            <Field
              label='Confirmed at'
              value={
                user.faceVerifyConfirmedAt
                  ? new Date(user.faceVerifyConfirmedAt).toLocaleString("en-NG")
                  : null
              }
            />
            <Field
              label='Confidence'
              value={
                typeof user.faceVerifyConfidence === "number"
                  ? `${user.faceVerifyConfidence.toFixed(0)}%`
                  : null
              }
            />
            <Field
              label='Quality score'
              value={
                typeof user.faceVerifyQualityScore === "number"
                  ? user.faceVerifyQualityScore.toFixed(2)
                  : null
              }
            />
            <Field
              label='Liveness'
              value={
                typeof user.faceVerifyLivenessPassed === "boolean"
                  ? user.faceVerifyLivenessPassed
                    ? "Passed"
                    : "Failed"
                  : null
              }
            />
            <Field label='Risk' value={humanRisk(user.faceVerifyRisk)} />
            <Field
              label='Duplicate'
              value={
                typeof user.faceVerifyDuplicate === "boolean"
                  ? user.faceVerifyDuplicate
                    ? "Yes"
                    : "No"
                  : null
              }
            />
            <Field
              label='Matched user'
              value={
                user.matchedUserUsername
                  ? `@${user.matchedUserUsername}`
                  : user.faceVerifyMatchedUsername || "No name found"
              }
            />
            <Field label='Reason' value={user.faceVerifyReason} />
            <Field label='Last error' value={user.faceVerifyLastError} />
            <Field label='Email' value={user.email} />
            <Field label='WhatsApp' value={user.whatsapp} />
          </div>

          <div className='grid gap-3 lg:grid-cols-2'>
            <MediaRail
              title='FaceVerify capture'
              items={[user.faceVerifyFrontImageUrl]}
            />
            <MediaRail
              title='Uploaded gallery'
              items={
                (user.profileMediaUrls && user.profileMediaUrls.length > 0
                  ? user.profileMediaUrls
                  : user.profileMedia) || []
              }
            />
          </div>

          <div className='bg-white border border-[#E2E8F0] rounded-2xl p-4'>
            <p className='text-xs font-semibold text-[#0F172A] mb-3'>
              Review timeline
            </p>
            <div className='space-y-3'>
              {timeline.map((item, index) => {
                const toneClasses: Record<
                  NonNullable<TimelineItem["tone"]>,
                  string
                > = {
                  neutral: "border-slate-200 bg-slate-50 text-slate-700",
                  info: "border-sky-200 bg-sky-50 text-sky-800",
                  warning: "border-amber-200 bg-amber-50 text-amber-900",
                  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
                  danger: "border-rose-200 bg-rose-50 text-rose-700",
                };
                return (
                  <div
                    key={`${item.title}-${index}`}
                    className={`rounded-2xl border px-4 py-3 ${toneClasses[item.tone || "neutral"]}`}>
                    <div className='flex items-start gap-3'>
                      <span className='mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/70 text-[11px] font-bold'>
                        {index + 1}
                      </span>
                      <div className='min-w-0 flex-1'>
                        <p className='text-sm font-semibold'>{item.title}</p>
                        <p className='mt-1 text-xs leading-5 opacity-90'>
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className='bg-white border border-[#E2E8F0] rounded-2xl p-4'>
            <p className='text-xs font-semibold text-[#0F172A] mb-2'>
              Profile details
            </p>
            <Field label='Role' value={user.role} />
            <Field
              label='Here for'
              value={user.intent?.map((i) => MAPS.intent?.[i] ?? i)}
            />
            <Field label='Age' value={user.age ? `${user.age} yrs` : null} />
            <Field label='State' value={user.state} />
            <Field label='LGA' value={user.lga} />
            <Field label='Education' value={r("education", user.education)} />
            <Field
              label='Occupation'
              value={r("occupation", user.occupation)}
            />
            <Field label='Gender' value={r("gender", user.gender)} />
            <Field
              label='Orientation'
              value={r("orientation", user.orientation)}
            />
            <Field label='Body type' value={user.bodyType} />
            <Field label='Height' value={user.height} />
            <Field label='Skin tone' value={user.skinTone} />
            <Field label='Bust size' value={user.bustSize} />
            <Field
              label='Right now'
              value={r("currentWant", user.currentWant)}
            />
            <Field label='Experiences' value={user.experiences} />
          </div>

          <div className='bg-white border border-[#E2E8F0] rounded-2xl p-4'>
            <p className='text-xs font-semibold text-[#0F172A] mb-2'>
              Vibe bio
            </p>
            {user.vibeBio ? (
              <p className='text-sm text-[#334155] leading-relaxed'>
                {user.vibeBio}
              </p>
            ) : (
              <p className='text-sm text-[#CBD5E1] italic'>No bio written</p>
            )}
          </div>

          <div className='bg-white border border-[#E2E8F0] rounded-2xl p-4'>
            <p className='text-xs font-semibold text-[#0F172A] mb-2'>
              Admin notes
            </p>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              placeholder='Reason for approving or rejecting...'
              className='w-full rounded-xl border border-[#CBD5E1] bg-white px-3 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 transition resize-none'
            />
          </div>
        </div>
      </div>

      <div className='fixed bottom-15 left-0 right-0 bg-white border-t border-[#E2E8F0] px-4 py-3 safe-area-inset-bottom'>
        <div className='max-w-2xl mx-auto flex gap-3'>
          <button
            onClick={() => handleDecision("rejected")}
            disabled={submitting || !isManualReview}
            className='flex-1 border-2 border-red-200 bg-red-50 active:bg-red-100 text-red-700 font-semibold py-3.5 rounded-xl transition disabled:opacity-50 text-sm'>
            {submitting ? "..." : "✕ Reject"}
          </button>
          <button
            onClick={() => handleDecision("approved")}
            disabled={submitting || !isManualReview}
            className='flex-1 bg-emerald-600 active:bg-emerald-800 text-white font-semibold py-3.5 rounded-xl transition disabled:opacity-50 text-sm'>
            {submitting ? "..." : "✓ Approve"}
          </button>
        </div>
      </div>
    </div>
  );
}
