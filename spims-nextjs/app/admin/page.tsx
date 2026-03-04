"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AuthSession {
  token: string;
  userId: number;
  username: string;
  role: string;
}

type TotalEnergyResponse = {
  area: string;
  totalConsumption: number;
  readings: number;
  lastUpdated: string;
};

type ActiveStreetlightsResponse = {
  active: number;
  off: number;
  fault: number;
  total: number;
};

type FaultsResponse = {
  count: number;
  items: Array<{
    id: number;
    issue: string;
    location: string;
    resolved: boolean;
    timestamp: string;
  }>;
};

type MonthlyReportResponse = {
  month: string;
  energyByDay: Array<{ day: string; totalConsumption: number }>;
  faultsSummary: {
    total_faults: number;
    resolved_faults: number;
    unresolved_faults: number;
  };
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function AdminPage() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [totalEnergy, setTotalEnergy] = useState<TotalEnergyResponse | null>(null);
  const [streetlights, setStreetlights] = useState<ActiveStreetlightsResponse | null>(null);
  const [faults, setFaults] = useState<FaultsResponse | null>(null);
  const [report, setReport] = useState<MonthlyReportResponse | null>(null);

  // Check authentication - only admin role can access
  useEffect(() => {
    const stored = localStorage.getItem("spims_main_session");
    if (!stored) {
      // No session, redirect to home
      router.push("/");
      return;
    }

    try {
      const parsed: AuthSession = JSON.parse(stored);
      
      // Check if user has admin role
      if (parsed.role !== "admin") {
        // Not an admin, redirect to dashboard
        router.push("/dashboard");
        return;
      }
      
      setSession(parsed);
    } catch (e) {
      localStorage.removeItem("spims_main_session");
      router.push("/");
    } finally {
      setAuthLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Only fetch data if authenticated as admin
    if (!session || authLoading) return;

    async function fetchAdminData() {
      try {
        setLoading(true);
        const [energyRes, streetlightsRes, faultsRes, reportRes] = await Promise.all([
          axios.get<TotalEnergyResponse>(`${API_BASE}/total-energy`),
          axios.get<ActiveStreetlightsResponse>(`${API_BASE}/active-streetlights`),
          axios.get<FaultsResponse>(`${API_BASE}/faults?resolved=false&limit=10`),
          axios.get<MonthlyReportResponse>(`${API_BASE}/monthly-report`),
        ]);

        setTotalEnergy(energyRes.data);
        setStreetlights(streetlightsRes.data);
        setFaults(faultsRes.data);
        setReport(reportRes.data);
        setError(null);
      } catch (err) {
        console.error("Admin dashboard fetch error:", err);
        setError("Failed to fetch admin data");
      } finally {
        setLoading(false);
      }
    }

    void fetchAdminData();
    const interval = setInterval(() => {
      void fetchAdminData();
    }, 15000); // Refresh every 15 seconds

    return () => clearInterval(interval);
  }, [session, authLoading]);

  const chartData = useMemo(
    () =>
      (report?.energyByDay ?? []).map((item) => ({
        ...item,
        dayLabel: new Date(item.day).toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
        }),
      })),
    [report]
  );

  const faultTrendData = useMemo(() => {
    if (!report) return [];
    return [
      { name: "Total Faults", value: report.faultsSummary.total_faults, color: "#3b82f6" },
      { name: "Resolved", value: report.faultsSummary.resolved_faults, color: "#22c55e" },
      { name: "Unresolved", value: report.faultsSummary.unresolved_faults, color: "#f97316" },
    ];
  }, [report]);

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-zinc-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render (redirect will happen)
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100">
      {/* Top Navigation Bar */}
      <nav className="border-b border-zinc-200 bg-white shadow-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold shadow-lg">
                A
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-900">Admin Portal - Strategic Monitoring</h1>
                <p className="text-xs text-zinc-500">
                  <span className="relative flex h-2 w-2 inline-flex mr-1.5 align-middle">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  City-Level Analytics • Auto-refresh every 15s
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {session.username.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-zinc-900">{session.username}</p>
                  <p className="text-xs text-zinc-500 capitalize">{session.role}</p>
                </div>
              </div>
              <Link
                href="/dashboard"
                className="rounded-lg border-2 border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 transition-all hover:border-blue-300 hover:bg-blue-50"
              >
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </span>
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem("spims_main_session");
                  router.push("/");
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl p-6 lg:p-8">
        {/* Header */}
        <section className="mb-8">
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-6 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 mb-3">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  Government Authority Access
                </div>
                <h2 className="text-2xl font-bold text-zinc-900 mb-2">Strategic Infrastructure Overview</h2>
                <p className="text-zinc-600  max-w-2xl">
                  High-level city analytics for policy decisions • No login required for government authorities
                </p>
              </div>
              <div className="rounded-lg bg-white border border-blue-200 px-4 py-3 shadow-sm">
                <p className="text-xs text-zinc-500 mb-1">Last Updated</p>
                <p className="text-sm font-semibold text-zinc-900">{formatDate(totalEnergy?.lastUpdated)}</p>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4">
            <svg className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* City Overview Metrics */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            City Overview
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <article className="group rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-zinc-600 mb-1">Total Energy Consumption</p>
              <p className="text-4xl font-bold text-zinc-900 mb-1">
                {loading ? "---" : totalEnergy?.totalConsumption.toFixed(2) ?? "0.00"}
              </p>
              <p className="text-xs text-zinc-500">kWh (Monthly)</p>
            </article>

            <article className="group rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-white p-6 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                {!loading && streetlights && streetlights.total > 0 && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                    {((streetlights.active / streetlights.total) * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-zinc-600 mb-1">Total Streetlights</p>
              <p className="text-4xl font-bold text-zinc-900 mb-1">
                {loading ? "---" : streetlights?.total ?? 0}
              </p>
              <p className="text-xs text-zinc-500">{streetlights?.active ?? 0} active</p>
            </article>

            <article className="group rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white p-6 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                {!loading && report && report?.faultsSummary?.unresolved_faults > 0 && (
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-zinc-600 mb-1">Total Faults</p>
              <p className="text-4xl font-bold text-zinc-900 mb-1">
                {loading ? "---" : report?.faultsSummary?.total_faults ?? 0}
              </p>
              <p className="text-xs text-zinc-500">
                {report?.faultsSummary?.unresolved_faults ?? 0} active
              </p>
            </article>

            <article className="group rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-6 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-zinc-600 mb-1">Public Buildings</p>
              <p className="text-4xl font-bold text-zinc-900 mb-1">
                {loading ? "---" : totalEnergy?.readings ?? 0}
              </p>
              <p className="text-xs text-zinc-500">Monitored</p>
            </article>
          </div>
        </section>

        {/* Analytics Section */}
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-3 mb-8">
          {/* Monthly Energy Trend */}
          <article className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  Monthly Energy Analytics
                </h3>
                <p className="text-sm text-zinc-500">Daily consumption trends for {report?.month ?? "this month"}</p>
              </div>
              <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
                <p className="text-xs text-blue-600 font-semibold">kWh</p>
              </div>
            </div>
            <div className="h-80">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm text-zinc-500">Loading analytics...</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis 
                      dataKey="dayLabel" 
                      stroke="#71717a"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#71717a"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e4e4e7',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalConsumption" 
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#2563eb' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </article>

          {/* Fault Trend Analysis */}
          <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2 mb-1">
                <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Fault Trends
              </h3>
              <p className="text-sm text-zinc-500">Monthly fault summary</p>
            </div>
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={faultTrendData}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#71717a"
                    style={{ fontSize: '11px' }}
                  />
                  <YAxis 
                    stroke="#71717a"
                    style={{ fontSize: '11px' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e4e4e7',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {faultTrendData.map((entry, index) => (
                      <rect key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium text-zinc-700">Total Faults</span>
                </div>
                <span className="text-lg font-bold text-zinc-900">{report?.faultsSummary.total_faults ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-zinc-700">Resolved</span>
                </div>
                <span className="text-lg font-bold text-zinc-900">{report?.faultsSummary.resolved_faults ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm font-medium text-zinc-700">Unresolved</span>
                </div>
                <span className="text-lg font-bold text-zinc-900">{report?.faultsSummary.unresolved_faults ?? 0}</span>
              </div>
            </div>
          </article>
        </section>

        {/* Active Fault Summary (View Only - No Actions) */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Active Infrastructure Faults
              </h3>
              <p className="text-sm text-zinc-500">Read-only view • For detailed control, use Enterprise Portal</p>
            </div>
            {faults && faults?.count > 0 && (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-base font-bold text-orange-600">
                {faults?.count ?? 0}
              </span>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <svg className="animate-spin h-10 w-10 text-zinc-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-zinc-500">Loading faults...</p>
            </div>
          ) : !faults || faults?.items?.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-base font-medium text-zinc-900">All Systems Operational</p>
              <p className="text-sm text-zinc-500 mt-1">No unresolved infrastructure faults</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {faults?.items.map((fault) => (
                <div
                  key={fault.id}
                  className="rounded-xl border-2 border-orange-200 bg-orange-50 p-4 transition-all hover:border-orange-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-600 text-xs font-bold text-white">
                        #{fault.id}
                      </span>
                      <p className="text-sm font-bold text-orange-900">{fault.issue}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-orange-700">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {fault.location}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-orange-700">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDate(fault.timestamp)}
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg bg-white/70 border border-orange-300 p-2 text-center">
                    <p className="text-xs font-medium text-orange-800">
                      <svg className="inline h-3 w-3 mr-1 align-text-bottom" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      View Only - Use Enterprise Portal for actions
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex-shrink-0">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-zinc-900 mb-1">Need to manage faults?</p>
                <p className="text-xs text-zinc-600 mb-3">
                  The Admin Portal provides monitoring only. For operational control, fault resolution, and infrastructure management, access the Enterprise Portal.
                </p>
                <Link
                  href="/enterprise"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Login to Enterprise Portal
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc 200 bg-white px-6 py-8 mt-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold shadow-sm">
                A
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900">SPIMS Admin Portal</p>
                <p className="text-xs text-zinc-500">Strategic Monitoring System</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
              System Online • © 2026 SPIMS
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
