"use client";

import {
  EDUCATION_LEVELS,
  OCCUPATIONS,
  GENDERS,
  ORIENTATIONS,
  CURRENT_WANTS,
  INTENTS,
  BODY_TYPES,
  HEIGHTS,
  SKIN_TONES,
  BUST_SIZES,
  EXPERIENCES,
  labelOf,
} from "@/lib/profileOptions";

interface ProfileDetailsCardProps {
  user: any;
  onEdit: () => void;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className='mb-5 last:mb-0'>
      <p className='text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-2.5'>
        {title}
      </p>
      {children}
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string | null }) {
  return (
    <div className='bg-[#F8FAFF] rounded-xl px-3.5 py-2.5'>
      <p className='text-[10px] text-[#94A3B8] mb-0.5'>{label}</p>
      <p
        className={`text-sm font-semibold ${value ? "text-[#0F172A]" : "text-[#CBD5E1]"}`}>
        {value || "—"}
      </p>
    </div>
  );
}

function ChipList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className='text-sm text-[#CBD5E1]'>—</p>;
  return (
    <div className='flex flex-wrap gap-1.5'>
      {items.map((i) => (
        <span
          key={i}
          className='text-xs bg-[#EFF6FF] text-[#1E3A8A] px-2.5 py-1 rounded-full font-medium'>
          {i}
        </span>
      ))}
    </div>
  );
}

export default function ProfileDetailsCard({
  user,
  onEdit,
}: ProfileDetailsCardProps) {
  return (
    <div className='bg-white border border-[#E2E8F0] rounded-2xl p-4 mb-3'>
      <div className='flex items-center justify-between mb-4'>
        <p className='text-sm font-semibold text-[#0F172A]'>Profile details</p>
        <button
          onClick={onEdit}
          className='text-xs font-medium text-[#1E3A8A] bg-[#EFF6FF] px-3 py-1.5 rounded-full'>
          Edit
        </button>
      </div>

      <Section title='Basics'>
        <div className='grid grid-cols-2 gap-2'>
          <InfoPill label='Age' value={user.age ? `${user.age} yrs` : null} />
          <InfoPill
            label='Location'
            value={[user.lga, user.state].filter(Boolean).join(", ") || null}
          />
          <InfoPill label='Gender' value={labelOf(GENDERS, user.gender)} />
          <InfoPill
            label='Orientation'
            value={labelOf(ORIENTATIONS, user.orientation)}
          />
        </div>
      </Section>

      <Section title='Education & work'>
        <div className='grid grid-cols-2 gap-2'>
          <InfoPill
            label='Education'
            value={labelOf(EDUCATION_LEVELS, user.education)}
          />
          <InfoPill
            label='Occupation'
            value={labelOf(OCCUPATIONS, user.occupation)}
          />
        </div>
      </Section>

      <Section title='Appearance'>
        <div className='mb-2'>
          <ChipList
            items={(user.bodyType || []).map((b: string) =>
              labelOf(BODY_TYPES, b),
            )}
          />
        </div>
        <div className='grid grid-cols-2 gap-2'>
          <InfoPill label='Height' value={labelOf(HEIGHTS, user.height)} />
          <InfoPill
            label='Skin tone'
            value={labelOf(SKIN_TONES, user.skinTone)}
          />
          <InfoPill
            label='Bust size'
            value={labelOf(BUST_SIZES, user.bustSize)}
          />
        </div>
      </Section>

      <Section title='Looking for'>
        <div className='grid grid-cols-2 gap-2'>
          <InfoPill
            label='Here for'
            value={
              user.intent?.map((i: string) => labelOf(INTENTS, i)).join(", ") ||
              null
            }
          />
          <InfoPill
            label='Right now'
            value={labelOf(CURRENT_WANTS, user.currentWant)}
          />
        </div>
      </Section>

      <Section title='Contact'>
        <InfoPill label='WhatsApp' value={user.whatsapp || null} />
      </Section>

      {user.experiences && user.experiences.length > 0 && (
        <Section title='Experiences'>
          <ChipList
            items={user.experiences.map((e: string) => labelOf(EXPERIENCES, e))}
          />
        </Section>
      )}
    </div>
  );
}
