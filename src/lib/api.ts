import { friendlyApiMessage } from "@/lib/apiMessages";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("bf_token");
}

type FetchOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (res.status === 403 && data?.code === "SUSPENDED") {
    localStorage.removeItem("bf_token");
    window.location.href = `/login?message=${encodeURIComponent(friendlyApiMessage(data?.message, "Your account has been suspended. Contact support."))}`;
    throw new Error("SUSPENDED");
  }

  if (!res.ok) {
    throw new Error(
      friendlyApiMessage(
        data?.message,
        "Something went wrong. Please try again.",
      ),
    );
  }

  return data as T;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    register: (body: {
      name: string;
      username: string;
      email: string;
      password: string;
      referralCode?: string; // ← add
    }) =>
      apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    login: (body: { email: string; password: string }) =>
      apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    me: () => apiFetch("/api/auth/me"),

    checkUsername: (username: string) =>
      apiFetch<{ available: boolean }>(
        `/api/auth/check-username?username=${encodeURIComponent(username)}`,
      ),

    sendVerification: (email: string) =>
      apiFetch("/api/auth/send-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),

    verifyEmail: (email: string, code: string) =>
      apiFetch("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email, code }),
      }),

    forgotPassword: (email: string) =>
      apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),

    resetPassword: (token: string, password: string) =>
      apiFetch(`/api/auth/reset-password/${token}`, {
        method: "POST",
        body: JSON.stringify({ password }),
      }),
  },

  // ── Referrals ────────────────────────────────────────────────────────────
  referrals: {
    mine: () =>
      apiFetch<{
        referralCode: string;
        activationCoins: number;
        boostCoins: number;
        totalCoins: number;
        successfulReferrals: number;
      }>("/api/referrals/me"),

    adminLeaderboard: () =>
      apiFetch<{
        leaderboard: Array<{
          referrerId: string;
          name: string;
          username: string;
          referralCode: string;
          activationCoins: number;
          boostCoins: number;
          totalCoins: number;
          successfulReferrals: number;
        }>;
      }>("/api/referrals/admin/all"),

    adminTrace: (referrerId: string) =>
      apiFetch<{
        entries: Array<{
          _id: string;
          type: "activation" | "boost";
          coins: number;
          createdAt: string;
          refereeId: {
            _id: string;
            name: string;
            username: string;
            email: string;
          };
        }>;
      }>(`/api/referrals/admin/${referrerId}/trace`),
  },

  admin: {
    searchUsers: (q: string) =>
      apiFetch<{
        users: Array<{
          _id: string;
          name: string;
          username: string;
          email: string;
          role?: string;
          isSuspended?: boolean;
          verificationStatus?: string;
          isVerified?: boolean;
        }>;
      }>(`/api/admin/users/search?q=${encodeURIComponent(q)}`),
    sendEmail: (body: {
      subject: string;
      message: string;
      ctaLabel?: string;
      ctaUrl?: string;
      userIds: string[];
      audience?:
        | "selected"
        | "all_funmates"
        | "all_seekers"
        | "all_funmates_and_seekers";
      excludedUserIds?: string[];
    }) =>
      apiFetch<{
        message: string;
        queued: boolean;
        // present when queued === false (immediate "selected" send)
        sent?: number;
        failed?: number;
        total?: number;
        recipients?: Array<{
          _id: string;
          name: string;
          username: string;
          email: string;
        }>;
        // present when queued === true (bulk audience -> EmailCampaign)
        campaignId?: string;
        totalRecipients?: number;
        estimatedDays?: number;
      }>("/api/admin/email/send", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    previewEmailAudience: (
      excludedUserIds: string[],
      audience:
        | "all_funmates"
        | "all_seekers"
        | "all_funmates_and_seekers" = "all_funmates",
    ) =>
      apiFetch<{ eligible: number; excluded: number; total: number }>(
        `/api/admin/email/audience-preview?audience=${encodeURIComponent(audience)}&excludedUserIds=${encodeURIComponent(excludedUserIds.join(","))}`,
      ),
    listEmailCampaigns: (page = 1) =>
      apiFetch<{
        campaigns: Array<{
          _id: string;
          subject: string;
          audience: string;
          status: "queued" | "sending" | "completed" | "cancelled";
          totalRecipients: number;
          sentCount: number;
          failedCount: number;
          createdAt: string;
          completedAt?: string | null;
        }>;
        total: number;
        page: number;
        pages: number;
      }>(`/api/admin/email/campaigns?page=${page}`),
    getEmailCampaign: (campaignId: string) =>
      apiFetch<{
        campaign: {
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
        failedRecipients: Array<{
          email: string;
          name: string;
          lastError?: string;
        }>;
      }>(`/api/admin/email/campaigns/${campaignId}`),
    cancelEmailCampaign: (campaignId: string) =>
      apiFetch<{ message: string; campaignId: string }>(
        `/api/admin/email/campaigns/${campaignId}/cancel`,
        {
          method: "POST",
        },
      ),
    socialLinks: {
      get: () =>
        apiFetch<{
          links: {
            telegram: string;
            instagram: string;
            tiktok: string;
            whatsapp: string;
          };
          defaults: {
            telegram: string;
            instagram: string;
            tiktok: string;
            whatsapp: string;
          };
        }>("/api/admin/social-links"),
      update: (body: {
        telegram: string;
        instagram: string;
        tiktok: string;
        whatsapp: string;
      }) =>
        apiFetch<{
          message: string;
          links: {
            telegram: string;
            instagram: string;
            tiktok: string;
            whatsapp: string;
          };
        }>("/api/admin/social-links", {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
    },
    manualFunmates: {
      list: (params?: { page?: number; limit?: number }) => {
        const query = new URLSearchParams();
        if (params?.page) query.set("page", String(params.page));
        if (params?.limit) query.set("limit", String(params.limit));
        const qs = query.toString();
        return apiFetch<{
          funmates: Array<{
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
          }>;
          total: number;
          page: number;
          pages: number;
          showManualFunmates: boolean;
        }>(`/api/admin/manual-funmates${qs ? `?${qs}` : ""}`);
      },
      create: async (formData: FormData) => {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("bf_token")
            : null;
        const res = await fetch(`${BASE}/api/admin/manual-funmates`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: formData,
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(
            friendlyApiMessage(
              data?.message,
              "Could not create manual funmate. Please try again.",
            ),
          );
        }
        return data as { message: string; user: Record<string, unknown> };
      },
      delete: (userId: string) =>
        apiFetch<{ message: string; userId: string }>(
          `/api/admin/manual-funmates/${userId}`,
          { method: "DELETE" },
        ),
      deleteAll: () =>
        apiFetch<{ message: string; deletedCount: number }>(
          "/api/admin/manual-funmates",
          { method: "DELETE" },
        ),
      settings: {
        get: () =>
          apiFetch<{ showManualFunmates: boolean }>(
            "/api/admin/manual-funmates/settings",
          ),
        update: (showManualFunmates: boolean) =>
          apiFetch<{ showManualFunmates: boolean }>(
            "/api/admin/manual-funmates/settings",
            {
              method: "PATCH",
              body: JSON.stringify({ showManualFunmates }),
            },
          ),
      },
    },
  },

  settings: {
    socialLinks: () =>
      apiFetch<{
        links: {
          telegram: string;
          instagram: string;
          tiktok: string;
          whatsapp: string;
        };
        defaults: {
          telegram: string;
          instagram: string;
          tiktok: string;
          whatsapp: string;
        };
      }>("/api/settings/social-links"),
  },

  notifications: {
    list: (params?: { page?: number; limit?: number }) => {
      const search = new URLSearchParams();
      if (params?.page) search.set("page", String(params.page));
      if (params?.limit) search.set("limit", String(params.limit));
      const query = search.toString();
      return apiFetch<{
        items: Array<{
          _id: string;
          type: string;
          title: string;
          body: string;
          link?: string | null;
          metadata?: Record<string, unknown> | null;
          readAt?: string | null;
          createdAt: string;
        }>;
        total: number;
        page: number;
        pages: number;
      }>(`/api/notifications${query ? `?${query}` : ""}`);
    },

    unreadCount: () =>
      apiFetch<{ unreadCount: number }>("/api/notifications/unread-count"),

    markRead: (id: string) =>
      apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" }),

    markAllRead: () =>
      apiFetch(`/api/notifications/read-all`, { method: "PATCH" }),
  },
};
