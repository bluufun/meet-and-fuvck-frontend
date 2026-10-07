"use client";

import type { ComponentType } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, CircleDollarSign, Users } from "lucide-react";
import Drawer from "@/components/ui/Drawer";

const TIERS = [
  { invites: "10", earn: "₦10,000" },
  { invites: "100", earn: "₦100,000" },
  { invites: "1,000", earn: "₦1,000,000" },
];

function InfoCard({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className='flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3'>
      <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#1E3A8A] shadow-sm'>
        <Icon className='h-4 w-4' />
      </span>
      <p className='text-sm leading-relaxed text-slate-600'>
        <span className='font-semibold text-slate-900'>{title}</span>{" "}
        {description}
      </p>
    </div>
  );
}

export default function EarnDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  return (
    <Drawer open={open} onClose={onClose} title='Earn with Bluufun'>
      <div className='space-y-5'>
        <div className='space-y-3'>
          <InfoCard
            icon={Users}
            title='Invite a funmate'
            description='and earn ₦1,000 the moment their account gets activated.'
          />
          <InfoCard
            icon={CircleDollarSign}
            title='Keep earning'
            description='Earn 20% of every subscription or boost purchased by your referrals for their first 2 months.'
          />
        </div>

        <div>
          <p className='mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400'>
            Activation earnings
          </p>
          <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white'>
            {TIERS.map((tier, index) => (
              <div
                key={tier.invites}
                className={`flex items-center justify-between px-4 py-3 ${index !== TIERS.length - 1 ? "border-b border-slate-100" : ""}`}>
                <span className='text-sm text-slate-600'>
                  {tier.invites} activated
                </span>
                <span className='text-sm font-bold text-slate-900'>
                  {tier.earn}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5'>
          <p className='text-sm leading-relaxed text-slate-600'>
            That&apos;s just activations. Your referrals also boost their
            accounts weekly, and you keep 20% of that every week automatically.
          </p>
          <p className='mt-2 text-sm font-semibold text-slate-900'>
            ₦5,000 - ₦100,000+ passively, weekly, depending on how many people
            you&apos;ve brought in.
          </p>
        </div>

        <button
          type='button'
          // onClick={() => {
          //   onClose();
          //   router.push("/dashboard");
          // }}
          className='flex w-full items-center disabled:bg-gray-400 justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#163172]'
          disabled>
          Coming Soon
          <ArrowRight className='h-4 w-4' />
        </button>
        <div className='flex items-center gap-2 text-xs text-slate-400'>
          <BadgeCheck className='h-4 w-4' />
          Payouts are handled from your dashboard.
        </div>
      </div>
    </Drawer>
  );
}
