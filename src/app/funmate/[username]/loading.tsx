export default function FunmateLoading() {
  return (
    <main className='min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-5xl animate-pulse'>
        <div className='mb-6 h-5 w-24 rounded-full bg-slate-200' />
        <div className='grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]'>
          <div className='aspect-[4/5] rounded-[2rem] bg-slate-200' />
          <div className='space-y-4 rounded-[2rem] bg-white p-6 shadow-sm'>
            <div className='h-8 w-2/3 rounded bg-slate-200' />
            <div className='h-4 w-1/3 rounded bg-slate-200' />
            <div className='h-24 rounded-2xl bg-slate-100' />
            <div className='h-12 rounded-2xl bg-slate-200' />
          </div>
        </div>
      </div>
    </main>
  );
}
