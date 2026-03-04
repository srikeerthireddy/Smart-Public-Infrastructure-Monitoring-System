"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AuthSession {
  token: string;
  userId: number;
  username: string;
  role: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("spims_main_session");
    if (!stored) {
      // No session, redirect to home
      router.push("/");
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      setSession(parsed);
    } catch (e) {
      localStorage.removeItem("spims_main_session");
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("spims_main_session");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-zinc-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const isAdmin = session.role === "admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation */}
      <nav className="border-b border-white/20 bg-white/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-lg">
                S
              </div>
              <div>
                <span className="text-xl font-bold text-zinc-900">SPIMS Dashboard</span>
                <p className="text-xs text-zinc-500">Welcome, {session.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {session.username.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-zinc-900">{session.username}</p>
                  <p className="text-xs text-zinc-500 capitalize">{session.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Welcome Section */}
        <section className="mb-10">
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-8 shadow-lg">
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">
              Welcome back, {session.username}!
            </h1>
            <p className="text-lg text-zinc-600">
              You are logged in as <span className="font-semibold capitalize">{session.role}</span>
            </p>
          </div>
        </section>

        {/* Dashboard Navigation Cards */}
        <section>
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">Access Your Portals</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Admin Portal Card - Only visible for admin role */}
            {isAdmin && (
              <Link
                href="/admin"
                className="group relative overflow-hidden rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 shadow-lg transition-all hover:shadow-2xl hover:scale-[1.02]"
              >
                <div className="relative z-10">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-900 mb-2">Admin Portal</h3>
                  <p className="text-zinc-600 mb-4">
                    Strategic monitoring and city-level analytics for government authorities
                  </p>
                  <ul className="space-y-2 text-sm text-zinc-600 mb-6">
                    <li className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      City-wide overview metrics
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Energy analytics & trends
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Fault monitoring (view-only)
                    </li>
                  </ul>
                  <div className="flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all">
                    Access Admin Portal
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-2xl"></div>
              </Link>
            )}

            {/* Enterprise Portal Card */}
            <Link
              href="/enterprise"
              className="group relative overflow-hidden rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-8 shadow-lg transition-all hover:shadow-2xl hover:scale-[1.02]"
            >
              <div className="relative z-10">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 mb-2">Enterprise Portal</h3>
                <p className="text-zinc-600 mb-4">
                  Operational control center for infrastructure management
                </p>
                <ul className="space-y-2 text-sm text-zinc-600 mb-6">
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Building energy tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Streetlight management
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Fault resolution actions
                  </li>
                </ul>
                <div className="flex items-center gap-2 text-purple-600 font-semibold group-hover:gap-3 transition-all">
                  Access Enterprise Portal
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full blur-2xl"></div>
            </Link>
          </div>
        </section>

        {/* Access Notice for Non-Admin */}
        {!isAdmin && (
          <section className="mt-8">
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600 flex-shrink-0">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 mb-1">Limited Access</h3>
                  <p className="text-sm text-zinc-700">
                    Your account does not have admin privileges. Admin Portal is only accessible to government authorities with admin credentials.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-zinc-200 bg-white px-6 py-8">
        <div className="mx-auto max-w-7xl text-center text-sm text-zinc-600">
          <p>© 2026 SPIMS. All rights reserved.</p>
          <p className="mt-2">Smart Public Infrastructure Monitoring System</p>
        </div>
      </footer>
    </div>
  );
}
