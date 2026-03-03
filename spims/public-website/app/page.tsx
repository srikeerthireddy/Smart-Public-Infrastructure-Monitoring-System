export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12 sm:px-10">
        <header className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Smart Public Infrastructure Monitoring System
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">Public Website</h1>
          <p className="max-w-3xl text-base text-zinc-600 dark:text-zinc-300 sm:text-lg">
            This portal is for citizens and stakeholders to view high-level public
            infrastructure updates from SPIMS.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Purpose
            </h2>
            <p className="mt-2 text-sm">
              Public-facing view of city infrastructure monitoring.
            </p>
          </article>

          <article className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Access Type
            </h2>
            <p className="mt-2 text-sm">Read-only information for general users.</p>
          </article>

          <article className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Backend Health
            </h2>
            <a
              className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              href="http://localhost:5000/health"
              target="_blank"
              rel="noopener noreferrer"
            >
              Check API status
            </a>
          </article>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xl font-semibold">Available Dashboards</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <a
              className="rounded-lg border border-zinc-200 px-4 py-3 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
            >
              Admin Dashboard (3000)
            </a>
            <a
              className="rounded-lg border border-zinc-200 px-4 py-3 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              href="http://localhost:4200"
              target="_blank"
              rel="noopener noreferrer"
            >
              Enterprise Dashboard (4200)
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
