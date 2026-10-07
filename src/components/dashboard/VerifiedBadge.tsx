interface VerifiedBadgeProps {
  golden?: boolean;
  className?: string;
}

export default function VerifiedBadge({ golden = false, className = "w-3.5 h-3.5" }: VerifiedBadgeProps) {
  return (
    <svg viewBox="0 0 22 22" className={`${className} shrink-0`} aria-label="Verified">
      <path
        d="M11 1.5 L13.5 4 L17 3.5 L17.5 7 L21 8.5 L19.5 11.5 L21 14.5 L17.5 16 L17 19.5 L13.5 19 L11 21.5 L8.5 19 L5 19.5 L4.5 16 L1 14.5 L2.5 11.5 L1 8.5 L4.5 7 L5 3.5 L8.5 4 Z"
        fill={golden ? "#F59E0B" : "#1D9BF0"}
      />
      <path
        d="M7.5 11.5l2.5 2.5 4.5-5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}