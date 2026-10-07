export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 text-center">
      <div className="max-w-md">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
          404
        </p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The page you’re looking for doesn’t exist or has been moved.
        </p>
      </div>
    </main>
  );
}
