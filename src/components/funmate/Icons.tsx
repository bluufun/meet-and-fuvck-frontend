// Shared icon set — minimal outline style, consistent stroke width.
// Kept as plain inline SVG (no extra dependency) to match the rest of the codebase.

type IconProps = { className?: string };

export function IconChevronLeft({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      className={className}
      stroke='currentColor'
      strokeWidth={2.25}>
      <path strokeLinecap='round' strokeLinejoin='round' d='M15 19l-7-7 7-7' />
    </svg>
  );
}

export function IconLock({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      className={className}
      stroke='currentColor'
      strokeWidth={1.8}>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z'
      />
    </svg>
  );
}

export function IconChat({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      className={className}
      stroke='currentColor'
      strokeWidth={1.7}>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M20.25 12c0 4.556-4.03 8.25-9 8.25-1.07 0-2.094-.166-3.046-.473a.75.75 0 00-.557.039l-2.682 1.272a.6.6 0 01-.84-.66l.564-2.366a.75.75 0 00-.196-.696C2.94 15.857 2.25 14.014 2.25 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z'
      />
      <circle cx='8.25' cy='12' r='0.75' fill='currentColor' stroke='none' />
      <circle cx='12' cy='12' r='0.75' fill='currentColor' stroke='none' />
      <circle cx='15.75' cy='12' r='0.75' fill='currentColor' stroke='none' />
    </svg>
  );
}

export function IconEye({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      className={className}
      stroke='currentColor'
      strokeWidth={1.8}>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5-9.75-7.5-9.75-7.5z'
      />
      <circle
        cx='12'
        cy='12'
        r='2.75'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

export function IconLocation({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      className={className}
      stroke='currentColor'
      strokeWidth={1.8}>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
      />
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
      />
    </svg>
  );
}

export function IconCalendar({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      className={className}
      stroke='currentColor'
      strokeWidth={1.7}>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M6.75 3v2.25M17.25 3v2.25M3.75 8.25h16.5M5.25 5.25h13.5A1.5 1.5 0 0120.25 6.75v12a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-12a1.5 1.5 0 011.5-1.5z'
      />
    </svg>
  );
}

export function IconCap({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      className={className}
      stroke='currentColor'
      strokeWidth={1.6}>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M12 3.75L2.25 8.25 12 12.75l9.75-4.5L12 3.75z'
      />
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M6 10.5v4.5c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5'
      />
      <path strokeLinecap='round' strokeLinejoin='round' d='M21.75 8.25v5.25' />
    </svg>
  );
}

export function IconBriefcase({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      className={className}
      stroke='currentColor'
      strokeWidth={1.7}>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M3.75 9.75A2.25 2.25 0 016 7.5h12a2.25 2.25 0 012.25 2.25v7.5A2.25 2.25 0 0118 19.5H6a2.25 2.25 0 01-2.25-2.25v-7.5z'
      />
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M9 7.5V6a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0115 6v1.5'
      />
      <path strokeLinecap='round' strokeLinejoin='round' d='M3.75 13.5h16.5' />
    </svg>
  );
}

export function IconSparkle({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg viewBox='0 0 24 24' fill='currentColor' className={className}>
      <path d='M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z' />
      <path d='M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.456-2.456L14.25 6l1.035-.259a3.375 3.375 0 002.456-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z' />
    </svg>
  );
}

export function IconTag({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      className={className}
      stroke='currentColor'
      strokeWidth={1.7}>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.5 1.5 0 002.122 0l4.318-4.318a1.5 1.5 0 000-2.122l-9.58-9.581A2.25 2.25 0 009.568 3z'
      />
      <circle cx='6.75' cy='6.75' r='0.75' fill='currentColor' stroke='none' />
    </svg>
  );
}

export function IconUser({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      className={className}
      stroke='currentColor'
      strokeWidth={1.7}>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z'
      />
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M4.501 20.118a7.5 7.5 0 0114.998 0'
      />
    </svg>
  );
}

export function IconCoin({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      className={className}
      stroke='currentColor'
      strokeWidth={1.6}>
      <circle cx='12' cy='12' r='8.25' />
      <path
        strokeLinecap='round'
        d='M12 7.5v9M14.5 9.6c0-1-.9-1.7-2.2-1.7-1.4 0-2.4.8-2.4 1.9 0 2.6 4.9 1.2 4.9 3.8 0 1.2-1.1 1.9-2.5 1.9-1.4 0-2.5-.7-2.6-1.8'
      />
    </svg>
  );
}

export function IconClose({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      className={className}
      stroke='currentColor'
      strokeWidth={2.2}>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M6 18L18 6M6 6l12 12'
      />
    </svg>
  );
}

export function IconCheck({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      className={className}
      stroke='currentColor'
      strokeWidth={2.5}>
      <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
    </svg>
  );
}
