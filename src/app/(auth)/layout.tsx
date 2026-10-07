import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='md:min-h-screen bg-[#F8FAFF] lg:overflow-hidden'>
      {/* Left decorative panel — hidden on mobile */}
      <div className='hidden lg:fixed lg:left-0 lg:top-0 lg:flex lg:h-screen lg:w-[46%] xl:w-[42%] relative overflow-hidden bg-[#1E3A8A] flex-col items-center justify-center p-12'>
        <div className='absolute top-[-80px] left-[-80px] w-[340px] h-[340px] rounded-full bg-[#3B82F6] opacity-20 animate-pulse' />
        <div className='absolute bottom-[-60px] right-[-60px] w-[260px] h-[260px] rounded-full bg-[#60A5FA] opacity-15 animate-pulse delay-700' />
        <div className='absolute top-[40%] right-[-40px] w-[180px] h-[180px] rounded-full bg-[#93C5FD] opacity-10 animate-pulse delay-300' />

        <div className='relative z-10 text-center max-w-sm'>
          <Link href='/' className='inline-block mb-10'>
            <BrandLogo width={168} height={48} priority />
          </Link>
          <h2 className='text-4xl font-bold text-white leading-tight mb-4'>
            Find your kind of fun.
          </h2>
          <p className='text-[#93C5FD] text-base leading-relaxed'>
            A discreet space to connect with people who share your vibe for
            companionship, hangouts, travel, and more.
          </p>
          <div className='mt-10 flex flex-col gap-3'>
            {[
              { icon: "✦", text: "Verified profiles, real connections" },
              { icon: "◈", text: "Discreet and privacy-first" },
              { icon: "❋", text: "Match by experience & lifestyle" },
            ].map((f) => (
              <div
                key={f.text}
                className='flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 text-left backdrop-blur-sm'>
                <span className='text-[#60A5FA] text-lg'>{f.icon}</span>
                <span className='text-white/90 text-sm'>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right / mobile full-screen form panel */}
      <div className='flex min-h-screen flex-col bg-[#F8FAFF] lg:ml-[46%] xl:ml-[42%] lg:h-screen lg:overflow-y-auto'>
        {/* Mobile top bar */}
        <div className='lg:hidden flex items-center justify-center px-5 pt-6 pb-2'>
          <Link href='/'>
            <BrandLogo width={110} height={38} priority />
          </Link>
        </div>

        {/* Mobile hero strip */}
        <div className='lg:hidden mx-4 mt-2 mb-5 rounded-2xl bg-[#1E3A8A] px-5 py-5 flex items-center gap-4 overflow-hidden relative'>
          <div className='absolute -top-6 -right-6 w-28 h-28 rounded-full bg-[#3B82F6] opacity-20' />
          <div className='relative z-10'>
            <p className='text-white font-bold text-base leading-snug'>
              Find your kind of fun.
            </p>
            <p className='text-[#93C5FD] text-xs mt-0.5'>
              Discreet · Private · Real connections
            </p>
          </div>
        </div>

        {/* Form area */}
        <div className='flex-1 flex items-start lg:items-center justify-center px-5 sm:px-8 lg:px-12 pb-10 lg:pb-0 lg:py-12'>
          <div className='w-full max-w-[560px] rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8'>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
