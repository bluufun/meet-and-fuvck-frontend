"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { canAdminAccess } from "@/lib/adminAccess";
import { getAdminRedirect } from "@/lib/adminGuards";

interface AdminLink {
  label: string;
  href: string;
  desc: string;
  icon: React.ReactNode;
}

interface AdminGroup {
  title: string;
  links: AdminLink[];
}

function Icon({ path }: { path: string }) {
  return (
    <svg
      className='w-5 h-5'
      fill='none'
      viewBox='0 0 24 24'
      stroke='currentColor'
      strokeWidth={1.8}>
      <path strokeLinecap='round' strokeLinejoin='round' d={path} />
    </svg>
  );
}

const GROUPS: AdminGroup[] = [
  {
    title: "Insights",
    links: [
      {
        label: "Market Analytics",
        href: "/admin/market-analytics",
        desc: "City demographics, profile views, and WhatsApp engagement",
        icon: <Icon path='M9 17V9m5 8V5m5 12v-6M4 21h16M4 21V5' />,
      },
    ],
  },
  {
    title: "People",
    links: [
      {
        label: "Users",
        href: "/admin/users",
        desc: "All registered accounts",
        icon: (
          <Icon path='M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-4a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4' />
        ),
      },
      {
        label: "Manual Boosts",
        href: "/admin/boosts/manual",
        desc: "Grant a free seven-day boost to a funmate",
        icon: <Icon path='M12 3v18m9-9H3m14.5-6.5L6.5 18.5' />,
      },
      {
        label: "Verification",
        href: "/admin/verification",
        desc: "Review pending ID/profile verifications",
        icon: (
          <Icon path='M9 12.75l1.5 1.5L15 9.75m5.25 2.25a9 9 0 11-18 0 9 9 0 0118 0z' />
        ),
      },
      {
        label: "Referrals",
        href: "/admin/referals",
        desc: "Referral activity and payouts",
        icon: (
          <Icon path='M18 20a6 6 0 00-12 0M12 14a4 4 0 100-8 4 4 0 000 8zM22 20a4.5 4.5 0 00-3-4.24M20 8a2.5 2.5 0 010 5' />
        ),
      },
      {
        label: "Support",
        href: "/admin/support",
        desc: "User reports and moderation queue",
        icon: (
          <Icon path='M12 9v2m0 4h.01M4.93 19h14.14A2 2 0 0020 17.34l-6.93-12a2 2 0 00-3.46 0l-6.93 12A2 2 0 004.93 19z' />
        ),
      },
      {
        label: "Admins",
        href: "/admin/admins",
        desc: "Invite and manage admin access",
        icon: (
          <Icon path='M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-4a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4 4 4 0 004 4' />
        ),
      },
      {
        label: "Email Users",
        href: "/admin/email",
        desc: "Send a personal or bulk admin email",
        icon: (
          <Icon path='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
        ),
      },
      {
        label: "Pricing",
        href: "/admin/pricing",
        desc: "Update boost and activation costs",
        icon: (
          <Icon path='M12 8c-1.66 0-3 .9-3 2s1.34 2 3 2 3 .9 3 2-1.34 2-3 2m0-8V6m0 10v2m0-14a9 9 0 100 18 9 9 0 000-18z' />
        ),
      },
      {
        label: "Settings",
        href: "/admin/settings",
        desc: "Update social links and platform defaults",
        icon: (
          <Icon path='M12 6V4m0 16v-2m8-6h2M2 12h2m12.95 5.95l1.41 1.41M4.64 4.64l1.41 1.41M18.36 4.64l-1.41 1.41M4.64 19.36l1.41-1.41' />
        ),
      },
      {
        label: "Manual Funmates",
        href: "/admin/manual-funmates",
        desc: "Add funmate profiles by hand and control their visibility",
        icon: (
          <Icon path='M12 4.5v15m7.5-7.5h-15M12 4.5a3 3 0 100 6 3 3 0 000-6z' />
        ),
      },
    ],
  },
  {
    title: "Money",
    links: [
      {
        label: "Earnings",
        href: "/admin/earnings",
        desc: "Platform revenue overview",
        icon: (
          <Icon path='M12 8c-1.66 0-3 .9-3 2s1.34 2 3 2 3 .9 3 2-1.34 2-3 2m0-8V6m0 10v2m0-14a9 9 0 100 18 9 9 0 000-18z' />
        ),
      },
      {
        label: "Transactions",
        href: "/admin/transactions",
        desc: "Full coin transaction log",
        icon: (
          <Icon path='M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4' />
        ),
      },
      {
        label: "Pending Top-ups",
        href: "/admin/pendingtopup",
        desc: "Top-ups awaiting confirmation",
        icon: <Icon path='M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z' />,
      },
      {
        label: "Withdrawals",
        href: "/admin/withdrawals",
        desc: "Withdrawal requests to review",
        icon: <Icon path='M12 4v16m0 0l-6-6m6 6l6-6' />,
      },
    ],
  },
];

export default function AdminHomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const permissions = user?.adminPermissions || [];
  const role = user?.adminRole || null;
  const redirect = getAdminRedirect("/admin", loading, user);

  const useIsomorphicLayoutEffect =
    typeof window === "undefined" ? useEffect : useLayoutEffect;

  useIsomorphicLayoutEffect(() => {
    if (redirect) {
      router.replace(redirect);
    }
  }, [redirect, router]);

  if (loading || redirect) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#F8FAFC]'>
        <div className='h-8 w-8 animate-spin rounded-full border-2 border-[#1E3A8A] border-t-transparent' />
      </div>
    );
  }

  const groups = GROUPS.map((group) => ({
    ...group,
    links: group.links.filter((link) => {
      if (link.href === "/admin/market-analytics")
        return canAdminAccess(permissions, "analytics", role);
      if (link.href === "/admin/users")
        return canAdminAccess(permissions, "manage_users", role);
      if (link.href === "/admin/support")
        return canAdminAccess(permissions, "reports", role);
      if (link.href === "/admin/admins")
        return canAdminAccess(permissions, "manage_users", role);
      if (link.href === "/admin/verification")
        return canAdminAccess(permissions, "verification", role);
      if (link.href === "/admin/withdrawals")
        return canAdminAccess(permissions, "withdrawals", role);
      if (link.href === "/admin/email")
        return canAdminAccess(permissions, "manage_users", role);
      if (link.href === "/admin/settings")
        return canAdminAccess(permissions, "manage_users", role);
      if (
        link.href === "/admin/earnings" ||
        link.href === "/admin/transactions" ||
        link.href === "/admin/pendingtopup"
      )
        return (
          canAdminAccess(permissions, "analytics", role) ||
          canAdminAccess(permissions, "withdrawals", role)
        );
      return true;
    }),
  })).filter((group) => group.links.length > 0);

  return (
    <div className='min-h-screen bg-[#F8FAFC] px-4 py-8'>
      <div className='max-w-3xl mx-auto'>
        <div className='mb-8'>
          <h1 className='text-2xl font-bold text-[#0F172A]'>Admin</h1>
          <p className='text-[#64748B] text-sm mt-1'>
            Quick access to every admin page.
          </p>
        </div>

        <div className='space-y-8 pb-10'>
          {groups.map((group) => (
            <div key={group.title}>
              <h2 className='text-[#64748B] text-xs font-semibold uppercase tracking-wide mb-3'>
                {group.title}
              </h2>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                {group.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className='flex items-start gap-3 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-4 hover:border-[#3B82F6]/40 hover:shadow-sm transition'>
                    <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex items-center justify-center text-white shrink-0'>
                      {link.icon}
                    </div>
                    <div className='min-w-0'>
                      <p className='text-[#0F172A] font-semibold text-sm'>
                        {link.label}
                      </p>
                      <p className='text-[#64748B] text-xs mt-0.5 leading-relaxed'>
                        {link.desc}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
