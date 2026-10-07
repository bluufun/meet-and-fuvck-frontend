"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAdminLivePresence } from "@/hooks/useAdminLivePresence";
import { getAdminRedirect } from "@/lib/adminGuards";
import { canAdminAccess } from "@/lib/adminAccess";

type StatusFilter = "all" | "active" | "suspended";
type UserTab = "funmates" | "seekers" | "suspended" | "all";
type QuickFilter = "all" | "pending-verifications" | "no-gallery";

type AdminUser = {
  _id: string;
  name: string;
  username: string;
  email: string;
  role?: string;
  isSuspended?: boolean;
  isVerified?: boolean;
  isActivated?: boolean;
  verificationStatus?:
    | "pending"
    | "approved"
    | "rejected"
    | "manual_review_pending"
    | "verification_required";
  verificationSource?:
    | "admin_review"
    | "faceverify_webhook"
    | "faceverify_redirect"
    | null;
  activationStatus?: "none" | "pending" | "activated";
  boostStatus?: "none" | "pending";
  boostTier?: string | null;
  pendingBoostTier?: string | null;
  lastActiveAt?: string | null;
  createdAt: string;
  profileMedia?: string[];
  profileMediaUrls?: string[];
  mediaUrls?: string[];
  onDeleteMedia?: (index: number) => void;
};

type FullUser = AdminUser & {
  adminRole?: string;
  suspensionReason?: string;
  suspendedAt?: string | null;
  activationCoins?: number;
  activationAmount?: number;
  activationPaidAt?: string | null;
  boostPaidAt?: string | null;
  boostExpiresAt?: string | null;
  boostAmount?: number;
  boostCoins?: number;
  whatsapp?: string;
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
  faceVerifySessionStatus?: string | null;
  faceVerifySessionToken?: string | null;
  faceVerifyStartedAt?: string | null;
  faceVerifyConfirmedAt?: string | null;
  faceVerifyLastError?: string;
  profileMedia?: string[];
  profileMediaUrls?: string[];
  mediaUrls?: string[];
  adminNotes?: string;
};

type PendingAdminAction = {
  user: AdminUser;
  action:
    | "suspend"
    | "unsuspend"
    | "change-to-seeker"
    | "verify-approve"
    | "verify-reject"
    | "activation-approve"
    | "activation-reset"
    | "boost-approve"
    | "boost-clear";
};

type Stats = {
  total: number;
  suspended: number;
  verified: number;
  activated: number;
  activeNow: number;
  activeToday: number;
  activeThisWeek: number;
  funmates?: number;
  seekers?: number;
  pendingVerifications?: number;
  noGalleryUploads?: number;
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("bf_token")}` };
}

function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusChip(
  label: string,
  tone: "emerald" | "amber" | "rose" | "slate" = "slate",
) {
  const styles: Record<typeof tone, string> = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize",
        styles[tone],
      )}>
      {label}
    </span>
  );
}

function verificationLabel(
  user: Pick<AdminUser, "verificationStatus" | "isVerified">,
) {
  if (user.verificationStatus === "approved" || user.isVerified) {
    return { label: "Verified", tone: "emerald" as const };
  }
  if (user.verificationStatus === "rejected") {
    return { label: "Not verified", tone: "rose" as const };
  }
  return { label: "Pending", tone: "amber" as const };
}

function verificationSourceLabel(source?: AdminUser["verificationSource"]) {
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

function hasUploadedMedia(
  user: Pick<AdminUser, "profileMedia"> & {
    profileMediaUrls?: string[];
    mediaUrls?: string[];
  },
) {
  return (
    (user.profileMedia?.length ?? 0) > 0 ||
    (user.profileMediaUrls?.length ?? 0) > 0 ||
    (user.mediaUrls?.length ?? 0) > 0
  );
}

function activationLabel(
  user: Pick<AdminUser, "activationStatus" | "isActivated">,
) {
  if (user.activationStatus === "activated" || user.isActivated) {
    return { label: "Activated", tone: "emerald" as const };
  }
  if (user.activationStatus === "pending") {
    return { label: "Activation pending", tone: "amber" as const };
  }
  return { label: "Not activated", tone: "slate" as const };
}

function mediaVisibilityLabel(
  user: Pick<
    AdminUser,
    "role" | "activationStatus" | "isActivated" | "profileMedia"
  > & {
    profileMediaUrls?: string[];
    mediaUrls?: string[];
  },
) {
  if (user.activationStatus === "activated" || user.isActivated) {
    return hasUploadedMedia(user)
      ? { label: "Visible in feed", tone: "emerald" as const }
      : { label: "Hidden until media upload", tone: "amber" as const };
  }
  return { label: "Not active in feed", tone: "slate" as const };
}

function isFunmateUser(role?: string) {
  return role === "funmate";
}

function displayRoleLabel(role?: string) {
  return isFunmateUser(role) ? "funmate" : "seeker";
}

function faceVerifyLabel(status?: string | null) {
  switch (status) {
    case "verification_required":
      return "Verification required";
    case "existing_user":
      return "Matched face";
    case "manual_review_pending":
      return "Under review";
    case "verified":
      return "Verified";
    case "pending":
      return "Pending review";
    case "failed":
      return "Verification failed";
    default:
      return status ? status.replace(/_/g, " ") : "—";
  }
}

function currentWantLabel(value?: string | null) {
  switch (value) {
    case "meet_asap":
      return "Ready to meet";
    case "just_chilling":
      return "Just chilling";
    case "good_convo":
      return "Good conversation";
    case "weekend_plan":
      return "Weekend plans";
    case "travel_buddy":
      return "Travel buddy";
    case "date_night":
      return "Date night";
    case "gym_partner":
      return "Gym partner";
    case "movie_night":
      return "Movie night";
    case "emotional_support":
      return "Emotional support";
    case "networking_now":
      return "Networking";
    case "serious_connection":
      return "Serious connection";
    case "exploring":
      return "Just exploring";
    default:
      return value ? value.replace(/_/g, " ") : "—";
  }
}

type UserActionPermission =
  | "manage_users"
  | "verification"
  | "activation"
  | "boosts";

function canUseUserAction(
  permissions: string[] | undefined,
  role: string | null | undefined,
  action: UserActionPermission,
) {
  if (role === "super-admin") return true;
  const list = permissions || [];
  if (list.includes("*")) return true;
  if (action === "manage_users") return list.includes("manage_users");
  if (action === "verification") return list.includes("verification");
  if (action === "activation") return list.includes("manage_users");
  if (action === "boosts") return list.includes("manage_users");
  return false;
}

function UserField({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className='flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0'>
      <span className='w-32 shrink-0 text-[11px] uppercase tracking-[0.16em] text-slate-400'>
        {label}
      </span>
      <span className='min-w-0 flex-1 text-right text-sm text-slate-800'>
        {value ?? "—"}
      </span>
    </div>
  );
}

function DetailPanel({
  user,
  onClose,
  onAction,
  onDelete,
  canSuspend,
  canVerify,
  canActivate,
  canBoost,
  canDelete,
  onDeleteMedia,
}: {
  user: FullUser;
  onClose: () => void;
  onAction: (
    action:
      | "suspend"
      | "unsuspend"
      | "change-to-seeker"
      | "verify-approve"
      | "verify-reject"
      | "activation-approve"
      | "activation-reset"
      | "boost-approve"
      | "boost-clear",
  ) => void;
  onDelete: () => void;
  canSuspend: boolean;
  canVerify: boolean;
  canActivate: boolean;
  canBoost: boolean;
  canDelete: boolean;
  onDeleteMedia?: (index: number) => void;
}) {
  const isFunmate = isFunmateUser(user.role);
  const actionGridClass = isFunmate
    ? "mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2"
    : "mt-3 grid grid-cols-1 gap-2";

  return (
    <div className='fixed inset-0 z-[80]'>
      <button
        aria-label='Close detail panel'
        onClick={onClose}
        className='absolute inset-0 bg-slate-950/35 backdrop-blur-[6px]'
      />
      <aside className='absolute right-0 top-0 h-full w-full max-w-[44rem] overflow-y-auto border-l border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]'>
        <div className='sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <p className='text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400'>
                User dossier
              </p>
              <h2 className='mt-2 text-xl font-bold text-slate-900'>
                {user.name}
              </h2>
              <p className='mt-1 text-sm text-slate-500'>
                @{user.username} · {user.email}
              </p>
            </div>
            <button
              onClick={onClose}
              className='rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50'>
              Close
            </button>
          </div>
        </div>

        <div className='space-y-5 px-6 py-5'>
          <section className='rounded-3xl border border-slate-200 bg-slate-50/80 p-4'>
            <div className='flex flex-wrap gap-2'>
              {statusChip(displayRoleLabel(user.role), "slate")}
              {isFunmateUser(user.role) && (
                <>
                  {statusChip(
                    user.isSuspended ? "suspended" : "active",
                    user.isSuspended ? "rose" : "emerald",
                  )}
                  {statusChip(
                    verificationLabel(user).label,
                    verificationLabel(user).tone,
                  )}
                  {statusChip(
                    verificationSourceLabel(user.verificationSource),
                    "slate",
                  )}
                  {statusChip(
                    activationLabel(user).label,
                    activationLabel(user).tone,
                  )}
                  {statusChip(
                    mediaVisibilityLabel(user).label,
                    mediaVisibilityLabel(user).tone,
                  )}
                </>
              )}
            </div>
            <div className='mt-4 grid grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white px-3'>
              <UserField label='Created' value={formatDate(user.createdAt)} />
              <UserField
                label='Last active'
                value={formatDate(user.lastActiveAt)}
              />
              <UserField label='Boost tier' value={user.boostTier ?? "—"} />
              <UserField
                label='Pending boost'
                value={user.pendingBoostTier ?? "—"}
              />
              <UserField
                label='Suspension reason'
                value={user.suspensionReason || "—"}
              />
            </div>
          </section>

          {isFunmate && (
            <>
              <section className='rounded-3xl border border-slate-200 p-4'>
                <div className='flex items-center justify-between gap-3'>
                  <div><h3 className='text-sm font-semibold text-slate-900'>Profile media</h3><p className='mt-1 text-xs text-slate-500'>Remove media that violates platform policy.</p></div>
                  <span className='text-xs font-semibold text-slate-400'>{user.profileMediaUrls?.length ?? 0} items</span>
                </div>
                {(user.profileMediaUrls?.length ?? 0) > 0 ? <div className='mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3'>{user.profileMediaUrls?.map((url, index) => <div key={`${url}-${index}`} className='group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50'><div className='relative aspect-square'>{/\.(mp4|webm|mov)$/i.test(user.profileMedia?.[index] || "") ? <video src={url} controls className='h-full w-full object-cover' /> : <img src={url} alt={`Profile media ${index + 1}`} className='h-full w-full object-cover' />}</div><button onClick={() => onDeleteMedia?.(index)} className='w-full border-t border-rose-100 bg-rose-50 px-2 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100'>Delete media</button></div>)}</div> : <p className='mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500'>No profile media uploaded.</p>}
              </section>
              <section className='rounded-3xl border border-slate-200 p-4'>
                <h3 className='text-sm font-semibold text-slate-900'>
                  Profile details
                </h3>
                <div className='mt-3 grid grid-cols-1 rounded-2xl border border-slate-200 px-3'>
                  <UserField label='Phone number' value={user.whatsapp} />
                  <UserField label='Age' value={user.age ?? "—"} />
                  <UserField label='State' value={user.state} />
                  <UserField label='LGA' value={user.lga} />
                  <UserField label='Gender' value={user.gender} />
                  <UserField label='Orientation' value={user.orientation} />
                  <UserField label='Occupation' value={user.occupation} />
                  <UserField label='Education' value={user.education} />
                  <UserField
                    label='Current want'
                    value={currentWantLabel(user.currentWant)}
                  />
                  <UserField
                    label='Body type'
                    value={
                      Array.isArray(user.bodyType)
                        ? user.bodyType.join(", ")
                        : undefined
                    }
                  />
                  <UserField label='Height' value={user.height} />
                  <UserField
                    label='Experiences'
                    value={
                      Array.isArray(user.experiences)
                        ? user.experiences.join(", ")
                        : undefined
                    }
                  />
                </div>
              </section>

              <section className='rounded-3xl border border-slate-200 p-4'>
                <h3 className='text-sm font-semibold text-slate-900'>
                  Verification
                </h3>
                <div className='mt-3 grid grid-cols-1 rounded-2xl border border-slate-200 px-3'>
                  <UserField
                    label='FaceVerify'
                    value={faceVerifyLabel(user.faceVerifySessionStatus)}
                  />
                  <UserField
                    label='Verification source'
                    value={verificationSourceLabel(user.verificationSource)}
                  />
                  <UserField
                    label='Session token'
                    value={user.faceVerifySessionToken ?? "—"}
                  />
                  <UserField
                    label='Started at'
                    value={formatDate(user.faceVerifyStartedAt)}
                  />
                  <UserField
                    label='Confirmed at'
                    value={formatDate(user.faceVerifyConfirmedAt)}
                  />
                  <UserField
                    label='Last error'
                    value={user.faceVerifyLastError || "—"}
                  />
                </div>
              </section>
            </>
          )}

          <section className='rounded-3xl border border-slate-200 p-4'>
            <h3 className='text-sm font-semibold text-slate-900'>
              {isFunmate ? "Account actions" : "Seeker actions"}
            </h3>
            <div className={actionGridClass}>
              {canSuspend && (
                <button
                  onClick={() =>
                    onAction(user.isSuspended ? "unsuspend" : "suspend")
                  }
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm font-semibold transition",
                    user.isSuspended
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
                  )}>
                  {user.isSuspended ? "Unsuspend user" : "Suspend user"}
                </button>
              )}
              {isFunmate && canSuspend && (
                <button
                  onClick={() => onAction("change-to-seeker")}
                  className='rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-100'>
                  Change to seeker
                </button>
              )}
              {canDelete && (
                <button
                  onClick={onDelete}
                  className='rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100'>
                  Delete permanently
                </button>
              )}
              {isFunmate && canVerify && (
                <>
                  <button
                    onClick={() => onAction("verify-approve")}
                    className='rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-100'>
                    Approve verification
                  </button>
                  <button
                    onClick={() => onAction("verify-reject")}
                    className='rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'>
                    Reject verification
                  </button>
                </>
              )}
              {isFunmate && canActivate && (
                <>
                  <button
                    onClick={() => onAction("activation-approve")}
                    className='rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100'>
                    Approve activation
                  </button>
                  <button
                    onClick={() => onAction("activation-reset")}
                    className='rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'>
                    Reset activation
                  </button>
                </>
              )}
              {isFunmate && canBoost && (
                <>
                  <button
                    onClick={() => onAction("boost-approve")}
                    className='rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100'>
                    Approve boost
                  </button>
                  <button
                    onClick={() => onAction("boost-clear")}
                    className='rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'>
                    Clear boost
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

function ActionMenu({
  user,
  onSelect,
  canSuspend,
  canVerify,
  canActivate,
  canBoost,
  canDelete,
}: {
  user: AdminUser;
  onSelect: (
    action:
      | "view"
      | "delete"
      | "suspend"
      | "unsuspend"
      | "change-to-seeker"
      | "verify-approve"
      | "verify-reject"
      | "activation-approve"
      | "activation-reset"
      | "boost-approve"
      | "boost-clear",
  ) => void;
  canSuspend: boolean;
  canVerify: boolean;
  canActivate: boolean;
  canBoost: boolean;
  canDelete: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const actions = [
    ["view", "View details"],
    ...(canSuspend
      ? [
          [
            user.isSuspended ? "unsuspend" : "suspend",
            user.isSuspended ? "Unsuspend user" : "Suspend user",
          ],
        ]
      : []),
    ...(canSuspend && user.role === "funmate"
      ? [["change-to-seeker", "Change to seeker"]]
      : []),
    ...(canVerify
      ? [
          ["verify-approve", "Approve verification"],
          ["verify-reject", "Reject verification"],
        ]
      : []),
    ...(canActivate
      ? [
          ["activation-approve", "Approve activation"],
          ["activation-reset", "Reset activation"],
        ]
      : []),
    ...(canBoost
      ? [
          ["boost-approve", "Approve boost"],
          ["boost-clear", "Clear boost"],
        ]
      : []),
    ...(canDelete ? [["delete", "Delete permanently"]] : []),
  ] as [PendingAdminAction["action"] | "view" | "delete", string][];

  return (
    <div className='relative'>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className='inline-flex h-9 w-9 items-center justify-center -z-4 rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50'
        aria-label={`Open actions for ${user.username}`}>
        <span className='text-lg leading-none'>⋯</span>
      </button>

      {open && (
        <div className='absolute left-0 md:right-0 top-11 z-50 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-[0_20px_40px_rgba(15,23,42,0.12)]'>
          {actions.map(([value, label]) => (
            <button
              key={value}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onSelect(value);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition",
                value === "delete"
                  ? "text-rose-700 hover:bg-rose-50"
                  : "text-slate-700 hover:bg-slate-50",
              )}>
              <span>{label}</span>
              {value === "delete" && (
                <span className='text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-400'>
                  danger
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function adminActionLabel(action: PendingAdminAction["action"]) {
  switch (action) {
    case "suspend":
      return "Suspend user";
    case "unsuspend":
      return "Unsuspend user";
    case "change-to-seeker":
      return "Change to seeker";
    case "verify-approve":
      return "Approve verification";
    case "verify-reject":
      return "Reject verification";
    case "activation-approve":
      return "Approve activation";
    case "activation-reset":
      return "Reset activation";
    case "boost-approve":
      return "Approve boost";
    case "boost-clear":
      return "Clear boost";
  }
}

function adminActionAccent(action: PendingAdminAction["action"]) {
  switch (action) {
    case "unsuspend":
    case "verify-approve":
    case "activation-approve":
    case "boost-approve":
    case "change-to-seeker":
      return "emerald";
    default:
      return "rose";
  }
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const redirect = getAdminRedirect("/admin/users", authLoading, user);
  const authBlocked = authLoading || !user;
  const canManageUsers = canAdminAccess(
    user?.adminPermissions,
    "manage_users",
    user?.adminRole || null,
  );
  const canVerifyUsers = canUseUserAction(
    user?.adminPermissions,
    user?.adminRole,
    "verification",
  );
  const canSuspendUsers = canUseUserAction(
    user?.adminPermissions,
    user?.adminRole,
    "manage_users",
  );
  const canActivateUsers = canUseUserAction(
    user?.adminPermissions,
    user?.adminRole,
    "activation",
  );
  const canBoostUsers = canUseUserAction(
    user?.adminPermissions,
    user?.adminRole,
    "boosts",
  );
  const canDeleteUsers = canUseUserAction(
    user?.adminPermissions,
    user?.adminRole,
    "manage_users",
  );
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<UserTab>("funmates");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<FullUser | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAdminAction | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<FullUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const { count: liveActiveNow, connected: liveConnected } =
    useAdminLivePresence(mounted && canManageUsers);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (redirect) {
      router.replace(redirect);
      return;
    }
    if (!canManageUsers) return;
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authLoading,
    page,
    tab,
    quickFilter,
    canManageUsers,
    redirect,
    router,
    user,
  ]);

  const visibleUsers = useMemo(() => users, [users]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch(`${API}/api/admin/stats`, { headers: authHeader() }),
        fetch(
          `${API}/api/admin/users?page=${page}&limit=20&tab=${tab}&filter=${quickFilter}&search=${encodeURIComponent(search)}`,
          {
            headers: authHeader(),
          },
        ),
      ]);

      if (!statsRes.ok) throw new Error("stats");
      if (!usersRes.ok) throw new Error("users");

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      setStats(statsData);
      setUsers((usersData.users || []) as AdminUser[]);
      setPages(usersData.pages || 1);
    } catch {
      setError("We couldn't load the admin user list right now.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserDetails(userId: string) {
    setDetailLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/user/${userId}`, {
        headers: authHeader(),
      });
      if (!res.ok) throw new Error("detail");
      const data = await res.json();
      setSelectedUser(data.user as FullUser);
    } catch {
      setError("We couldn't load the user details.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function deleteUserMedia(user: FullUser, index: number) {
    const confirmed = window.confirm("Delete this media permanently from the profile and R2 storage?");
    if (!confirmed) return;
    setActionBusyId(user._id);
    try {
      const res = await fetch(`${API}/api/admin/users/${user._id}/media/${index}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ reason: "Policy violation" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not delete media");
      await fetchUserDetails(user._id);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete media");
    } finally {
      setActionBusyId(null);
    }
  }

  async function runAction(
    user: AdminUser,
    action: PendingAdminAction["action"] | "view" | "delete",
  ) {
    setActionBusyId(user._id);
    try {
      if (action === "view") {
        setSelectedId(user._id);
        await fetchUserDetails(user._id);
        return;
      }

      if (action === "delete") {
        setSelectedId(user._id);
        await fetchUserDetails(user._id);
        setDeleteTarget(user as FullUser);
        return;
      }

      if (action === "suspend") {
        const res = await fetch(`${API}/api/admin/users/${user._id}/suspend`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeader() },
          body: JSON.stringify({ reason: "Admin action" }),
        });
        if (!res.ok) throw new Error("suspend");
      } else if (action === "unsuspend") {
        const res = await fetch(
          `${API}/api/admin/users/${user._id}/unsuspend`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...authHeader() },
          },
        );
        if (!res.ok) throw new Error("unsuspend");
      } else if (action === "change-to-seeker") {
        const res = await fetch(
          `${API}/api/admin/users/${user._id}/change-to-seeker`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...authHeader() },
          },
        );
        if (!res.ok) throw new Error("change-to-seeker");
      } else if (action === "verify-approve" || action === "verify-reject") {
        const res = await fetch(`${API}/api/admin/verify/${user._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeader() },
          body: JSON.stringify({
            status: action === "verify-approve" ? "approved" : "rejected",
            adminNotes: "Reviewed from admin users page",
          }),
        });
        if (!res.ok) throw new Error("verify");
      } else if (
        action === "activation-approve" ||
        action === "activation-reset"
      ) {
        const res = await fetch(
          `${API}/api/admin/activations/${user._id}/review`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...authHeader() },
            body: JSON.stringify({ approve: action === "activation-approve" }),
          },
        );
        if (!res.ok) throw new Error("activation");
      } else if (action === "boost-approve" || action === "boost-clear") {
        const res = await fetch(`${API}/api/admin/boosts/${user._id}/review`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeader() },
          body: JSON.stringify({ approve: action === "boost-approve" }),
        });
        if (!res.ok) throw new Error("boost");
      }

      await fetchData();
      if (selectedId === user._id) {
        await fetchUserDetails(user._id);
      }
    } catch {
      setError("That action could not be completed. Please try again.");
    } finally {
      setActionBusyId(null);
    }
  }

  function requestActionConfirmation(
    user: AdminUser,
    action: PendingAdminAction["action"],
  ) {
    setPendingAction({ user, action });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const normalizedConfirm = deleteConfirm
      .trim()
      .toLowerCase()
      .replace(/^@/, "");
    const normalizedUsername = deleteTarget.username
      .toLowerCase()
      .replace(/^@/, "");
    if (normalizedConfirm !== normalizedUsername) return;
    setActionBusyId(deleteTarget._id);
    try {
      const res = await fetch(`${API}/api/admin/users/${deleteTarget._id}`, {
        method: "DELETE",
        headers: authHeader(),
      });
      if (!res.ok) throw new Error("delete");
      setDeleteTarget(null);
      setDeleteConfirm("");
      setSelectedUser(null);
      setSelectedId(null);
      await fetchData();
    } catch {
      setError("Delete failed. Please try again.");
    } finally {
      setActionBusyId(null);
    }
  }

  const detailPortal =
    mounted && selectedUser
      ? createPortal(
          <DetailPanel
            user={selectedUser}
            onClose={() => {
              setSelectedUser(null);
              setSelectedId(null);
            }}
            onDelete={() => setDeleteTarget(selectedUser)}
            onAction={(action) =>
              requestActionConfirmation(
                selectedUser,
                action as PendingAdminAction["action"],
              )
            }
            canSuspend={canSuspendUsers}
            canVerify={canVerifyUsers}
            canActivate={canActivateUsers}
            canBoost={canBoostUsers}
            canDelete={canDeleteUsers}
            onDeleteMedia={(index) => void deleteUserMedia(selectedUser, index)}
          />,
          document.body,
        )
      : null;

  const deletePortal =
    mounted && deleteTarget
      ? createPortal(
          <div className='fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 px-4'>
            <div className='w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.25)]'>
              <p className='text-[11px] font-semibold uppercase tracking-[0.26em] text-rose-500'>
                Permanent delete
              </p>
              <h3 className='mt-2 text-xl font-bold text-slate-900'>
                Delete {deleteTarget.name}?
              </h3>
              <p className='mt-2 text-sm leading-6 text-slate-600'>
                This removes the user and related records permanently. Type{" "}
                <span className='font-semibold text-slate-900'>
                  @{deleteTarget.username}
                </span>{" "}
                to confirm.
              </p>
              <input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={`Type @${deleteTarget.username}`}
                className='mt-5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100'
              />
              <div className='mt-5 flex gap-3'>
                <button
                  onClick={() => {
                    setDeleteTarget(null);
                    setDeleteConfirm("");
                  }}
                  className='flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700'>
                  Cancel
                </button>
                <button
                  onClick={() => void confirmDelete()}
                  disabled={
                    deleteConfirm.trim().toLowerCase() !==
                      `@${deleteTarget.username}`.toLowerCase() &&
                    deleteConfirm.trim().toLowerCase() !==
                      deleteTarget.username.toLowerCase()
                  }
                  className='flex-1 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40'>
                  {actionBusyId === deleteTarget._id
                    ? "Deleting..."
                    : "Delete forever"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  const actionPortal =
    mounted && pendingAction
      ? createPortal(
          <div className='fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/45 px-4'>
            <div className='w-full max-w-lg rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.25)]'>
              <p className='text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400'>
                Confirm action
              </p>
              <h3 className='mt-2 text-xl font-bold text-slate-900'>
                {adminActionLabel(pendingAction.action)}?
              </h3>
              <p className='mt-2 text-sm leading-6 text-slate-600'>
                This will apply immediately to{" "}
                <span className='font-semibold text-slate-900'>
                  @{pendingAction.user.username}
                </span>
                . Please confirm before continuing.
              </p>
              {pendingAction.action === "change-to-seeker" && (
                <div className='mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800'>
                  This will convert the account to a seeker and clear funmate
                  onboarding details, profile media, activation state, boost
                  state, and WhatsApp lock settings. This cannot be undone from
                  this screen.
                </div>
              )}
              <div className='mt-5 flex gap-3'>
                <button
                  onClick={() => setPendingAction(null)}
                  className='flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700'>
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const next = pendingAction;
                    setPendingAction(null);
                    if (next) void runAction(next.user, next.action);
                  }}
                  className={cn(
                    "flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-white",
                    adminActionAccent(pendingAction.action) === "emerald"
                      ? "bg-emerald-600"
                      : "bg-rose-600",
                  )}>
                  {actionBusyId === pendingAction.user._id
                    ? "Working..."
                    : "Confirm"}
                </button>
              </div>
            </div>
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

  if (!canManageUsers) {
    return (
      <div className='h-[80vh] bg-slate-50 flex items-center justify-center px-4 text-center'>
        <div className='max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm'>
          <h1 className='text-xl font-bold text-slate-950'>
            Access restricted
          </h1>
          <p className='mt-2 text-sm leading-6 text-slate-600'>
            Your admin account cannot manage users.
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
          <div className='mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent' />
          <p className='text-sm text-slate-500'>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className=' px-4 py-6 text-slate-900'>
      {detailPortal}
      {deletePortal}
      {actionPortal}
      <div className='mx-auto max-w-3xl'>
        <div className='mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur'>
          <div className='flex flex-col justify-between gap-4 lg:flex-row lg:items-end'>
            <div>
              <p className='text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400'>
                Admin users
              </p>
              <h1 className='mt-2 text-3xl font-black tracking-tight text-slate-950'>
                Control the account graph
              </h1>
              <p className='mt-2 max-w-2xl text-sm leading-6 text-slate-600'>
                Click an activated funmate to open their public profile. Seeker
                and unactivated accounts open a private dossier. Each card keeps
                a compact action menu so the page stays fast to scan.
              </p>
            </div>
            <button
              onClick={() => router.push("/admin")}
              className='rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'>
              Back to admin
            </button>
          </div>

          <div className='grid grid-cols-2 gap-3 md:grid-cols-5'>
            <div className='rounded-2xl bg-slate-950 p-4 text-white'>
              <p className='text-[11px] uppercase tracking-[0.22em] text-white/55'>
                Users
              </p>
              <p className='mt-2 text-2xl font-black'>{stats?.total ?? "—"}</p>
            </div>
            <div className='rounded-2xl bg-white p-4 ring-1 ring-slate-200'>
              <p className='text-[11px] uppercase tracking-[0.22em] text-slate-400'>
                Suspended
              </p>
              <p className='mt-2 text-2xl font-black text-rose-600'>
                {stats?.suspended ?? "—"}
              </p>
            </div>
            <div className='rounded-2xl bg-white p-4 ring-1 ring-slate-200'>
              <p className='text-[11px] uppercase tracking-[0.22em] text-slate-400'>
                Verified
              </p>
              <p className='mt-2 text-2xl font-black text-emerald-600'>
                {stats?.verified ?? "—"}
              </p>
            </div>
            <div className='rounded-2xl bg-white p-4 ring-1 ring-slate-200'>
              <p className='text-[11px] uppercase tracking-[0.22em] text-slate-400'>
                Activated
              </p>
              <p className='mt-2 text-2xl font-black text-sky-600'>
                {stats?.activated ?? "—"}
              </p>
            </div>
            <div className='rounded-2xl bg-white p-4 ring-1 ring-slate-200'>
              <p className='flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] text-slate-400'>
                Active now
                {liveConnected && (
                  <span
                    className='inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500'
                    title='Live'
                  />
                )}
              </p>
              <p className='mt-2 text-2xl font-black text-violet-600'>
                {liveActiveNow ?? stats?.activeNow ?? "—"}
              </p>
            </div>
          </div>

          <div className='flex flex-col gap-3 lg:flex-row lg:items-center'>
            <div className='flex-1'>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void fetchData();
                }}
                placeholder='Search by name, username or email'
                className='w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100'
              />
            </div>
            <div className='inline-flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-1'>
              {(["funmates", "seekers", "suspended", "all"] as UserTab[]).map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setPage(1);
                      setTab(item);
                    }}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold capitalize transition",
                      tab === item
                        ? "bg-white text-slate-950 shadow-sm"
                        : "text-slate-500 hover:text-slate-800",
                    )}>
                    <span>{item}</span>
                    {item === "funmates" && (
                      <span className='inline-flex min-w-6 items-center justify-center rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-black text-sky-700'>
                        {stats?.funmates ?? 0}
                      </span>
                    )}
                    {item === "seekers" && (
                      <span className='inline-flex min-w-6 items-center justify-center rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-black text-slate-700'>
                        {stats?.seekers ?? 0}
                      </span>
                    )}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className='flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <p className='text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400'>
                Quick filters
              </p>
              <p className='mt-1 text-sm text-slate-600'>
                Tap a count to show only those users.
              </p>
            </div>
            <div className='flex flex-wrap gap-2'>
              {quickFilter !== "all" && (
                <button
                  onClick={() => {
                    setPage(1);
                    setQuickFilter("all");
                  }}
                  className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'>
                  Clear filter
                </button>
              )}
              {[
                {
                  key: "pending-verifications",
                  label: "Pending verification",
                  count: stats?.pendingVerifications ?? 0,
                  tone: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
                },
                {
                  key: "no-gallery",
                  label: "No gallery",
                  count: stats?.noGalleryUploads ?? 0,
                  tone: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
                },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    setPage(1);
                    setQuickFilter(
                      quickFilter === item.key
                        ? "all"
                        : (item.key as QuickFilter),
                    );
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                    item.tone,
                    quickFilter === item.key
                      ? "ring-2 ring-offset-2 ring-offset-slate-50 ring-slate-300"
                      : "",
                  )}>
                  <span>{item.label}</span>
                  <span className='inline-flex min-w-6 items-center justify-center rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-black'>
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className='mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
            {error}
          </div>
        )}

        <div className='grid gap-4'>
          {visibleUsers.map((user) => {
            const activatedFunmate =
              user.role === "funmate" && user.isActivated && !user.isSuspended;
            return (
              <article
                key={user._id}
                onMouseEnter={() => {
                  if (activatedFunmate)
                    router.prefetch(
                      `/funmate/${encodeURIComponent(user.username)}`,
                    );
                }}
                onClick={() => {
                  if (activatedFunmate)
                    router.push(
                      `/funmate/${encodeURIComponent(user.username)}`,
                    );
                  else void runAction(user, "view");
                }}
                className='group grid cursor-pointer grid-cols-1 gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(15,23,42,0.08)] sm:grid-cols-[1fr_auto]'>
                <div className='flex min-w-0 items-start gap-4'>
                  <div className='flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-slate-800 to-sky-700 text-lg font-black text-white'>
                    {user.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <h2 className='truncate text-base font-bold text-slate-950'>
                        {user.name}
                      </h2>
                      {statusChip(displayRoleLabel(user.role), "slate")}
                      {isFunmateUser(user.role) && (
                        <>
                          {user.isSuspended
                            ? statusChip("suspended", "rose")
                            : activatedFunmate
                              ? statusChip("active", "emerald")
                              : statusChip("review", "amber")}
                        </>
                      )}
                    </div>
                    <p className='mt-1 truncate text-sm text-slate-500'>
                      @{user.username} · {user.email}
                    </p>
                    {isFunmateUser(user.role) && (
                      <div className='mt-3 flex flex-wrap gap-2'>
                        {statusChip(
                          verificationLabel(user).label,
                          verificationLabel(user).tone,
                        )}
                        {statusChip(
                          activationLabel(user).label,
                          activationLabel(user).tone,
                        )}
                        {statusChip(
                          mediaVisibilityLabel(user).label,
                          mediaVisibilityLabel(user).tone,
                        )}
                        {statusChip(
                          user.boostStatus ?? "none",
                          user.boostStatus === "pending" ? "amber" : "slate",
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className='flex items-center justify-between gap-3 sm:justify-end'>
                  <div className='hidden text-right sm:block'>
                    <p className='text-xs uppercase tracking-[0.18em] text-slate-400'>
                      Created
                    </p>
                    <p className='mt-1 text-sm font-medium text-slate-700'>
                      {new Date(user.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <ActionMenu
                    user={user}
                    onSelect={(action) => {
                      if (action === "change-to-seeker") {
                        requestActionConfirmation(user, action);
                        return;
                      }
                      void runAction(user, action);
                    }}
                    canSuspend={canSuspendUsers}
                    canVerify={canVerifyUsers}
                    canActivate={canActivateUsers}
                    canBoost={canBoostUsers}
                    canDelete={canDeleteUsers}
                  />
                </div>
              </article>
            );
          })}
        </div>

        {visibleUsers.length === 0 && !error && (
          <div className='mt-10 rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center text-slate-500'>
            No users match this filter.
          </div>
        )}

        <div className='mt-6 flex items-center justify-between gap-3'>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className='rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-40'>
            Previous
          </button>
          <p className='text-sm text-slate-500'>
            Page {page} of {pages}
          </p>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className='rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-40'>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
