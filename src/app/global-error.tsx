"use client";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-white px-6 text-center text-slate-900">
        <main className="max-w-md">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Error
          </p>
          <h1 className="mt-4 text-2xl font-bold">
            Something went wrong
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            We hit a rendering issue while loading this page. Please try again.
          </p>
          <button
            onClick={() => unstable_retry()}
            className="mt-6 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">
            Try again
          </button>
          {error?.digest ? (
            <p className="mt-4 text-xs text-slate-400">Ref: {error.digest}</p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
