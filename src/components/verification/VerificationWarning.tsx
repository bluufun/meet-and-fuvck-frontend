type VerificationWarningProps = {
  className?: string;
  tone?: "amber" | "slate";
};

const WARNING_TEXT =
  "Find good lighting, remove sunglasses or masks, and keep your face centered when the camera opens. Takes about 15-20 seconds.";

export function VerificationWarning({
  className = "",
  tone = "amber",
}: VerificationWarningProps) {
  const styles =
    tone === "amber"
      ? "border border-amber-100 bg-amber-50 text-amber-900"
      : "border border-slate-200 bg-white text-slate-700";

  return (
    <div
      className={`rounded-2xl px-4 py-3 text-xs leading-6 sm:text-sm ${styles} ${className}`.trim()}>
      <div className='flex items-center gap-3'>
        <span>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='lucide lucide-lightbulb-icon lucide-lightbulb'>
            <path d='M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5' />
            <path d='M9 18h6' />
            <path d='M10 22h4' />
          </svg>
        </span>
        <h3 className='font-semibold'>For best results</h3>
      </div>
      {WARNING_TEXT}
    </div>
  );
}

export const verificationWarningText = WARNING_TEXT;
