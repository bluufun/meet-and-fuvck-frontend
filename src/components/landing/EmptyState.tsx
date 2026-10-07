// components/landing/EmptyState.tsx
export default function EmptyState({
  tab,
}: {
  tab: "for_you" | "premium" | "regular";
}) {
  return (
    <div className='absolute inset-0 flex flex-col items-center justify-center gap-4 px-10 text-center bg-[#0F172A]'>
      <div className='w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center'>
        <svg
          className='w-8 h-8 text-white/40'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
          strokeWidth={1.6}>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
      </div>
      <div>
        <p className='text-white font-bold mb-1.5'>
          {tab === "premium"
            ? "No premium funmates yet"
            : "No funmates here yet"}
        </p>
        <p className='text-white/45 text-sm leading-relaxed'>
          {tab === "premium"
            ? "Premium funmates appear here once they boost their account."
            : "Check back soon! New funmates join every day."}
        </p>
      </div>
    </div>
  );
}
