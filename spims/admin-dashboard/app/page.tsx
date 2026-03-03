"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TotalEnergyResponse = {
  area: string;
  totalConsumption: number;
  readings: number;
  lastUpdated: string;
};

type AuthUser = {
  id: number;
  username: string;
  role: "ADMIN" | "OPERATOR";
};

type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

type LoginResponse = AuthSession;

type RefreshResponse = {
  accessToken: string;
};

type ActiveStreetlightsResponse = {
  active: number;
  off: number;
  fault: number;
  total: number;
};

type FaultItem = {
  id: number;
  issue: string;
  location: string;
  resolved: boolean;
  timestamp: string;
  resolved_at: string | null;
};

type FaultsResponse = {
  count: number;
  items: FaultItem[];
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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
const AUTH_STORAGE_KEY = "spims.admin.auth";

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function Home() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [authLoading, setAuthLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [totalEnergy, setTotalEnergy] = useState<TotalEnergyResponse | null>(null);
  const [streetlights, setStreetlights] = useState<ActiveStreetlightsResponse | null>(null);
  const [faults, setFaults] = useState<FaultItem[]>([]);
  const [report, setReport] = useState<MonthlyReportResponse | null>(null);

  const saveSession = (nextSession: AuthSession | null) => {
    setSession(nextSession);
    if (typeof window === "undefined") return;

    if (!nextSession) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
  };

  const refreshAccessToken = useCallback(async (currentSession: AuthSession) => {
    const { data } = await axios.post<RefreshResponse>(`${API_BASE}/auth/refresh`, {
      refreshToken: currentSession.refreshToken,
    });

    const nextSession: AuthSession = {
      ...currentSession,
      accessToken: data.accessToken,
    };
    saveSession(nextSession);
    return nextSession;
  }, []);

  const authRequest = useCallback(
    async <T,>(
      request: (token: string) => Promise<{ data: T }>,
      currentSession: AuthSession
    ): Promise<T> => {
      try {
        const response = await request(currentSession.accessToken);
        return response.data;
      } catch (requestError) {
        if (!axios.isAxiosError(requestError) || requestError.response?.status !== 401) {
          throw requestError;
        }

        const renewedSession = await refreshAccessToken(currentSession);
        const retried = await request(renewedSession.accessToken);
        return retried.data;
      }
    },
    [refreshAccessToken]
  );

  const fetchDashboard = useCallback(async (currentSession: AuthSession) => {
    try {
      const [energyRes, streetlightsRes, faultsRes, reportRes] = await Promise.all([
        authRequest(
          (token) => axios.get<TotalEnergyResponse>(`${API_BASE}/total-energy`, { headers: { Authorization: `Bearer ${token}` } }),
          currentSession
        ),
        authRequest(
          (token) => axios.get<ActiveStreetlightsResponse>(`${API_BASE}/active-streetlights`, { headers: { Authorization: `Bearer ${token}` } }),
          currentSession
        ),
        authRequest(
          (token) => axios.get<FaultsResponse>(`${API_BASE}/faults?resolved=false&limit=8`, { headers: { Authorization: `Bearer ${token}` } }),
          currentSession
        ),
        authRequest(
          (token) => axios.get<MonthlyReportResponse>(`${API_BASE}/monthly-report`, { headers: { Authorization: `Bearer ${token}` } }),
          currentSession
        ),
      ]);

      setTotalEnergy(energyRes);
      setStreetlights(streetlightsRes);
      setFaults(faultsRes.items);
      setReport(reportRes);
      setError(null);
    } catch (fetchError) {
      setError("Failed to fetch admin dashboard data. Please login again.");
      console.error(fetchError);
    } finally {
      setLoading(false);
    }
  }, [authRequest]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as AuthSession;
      setSession(parsed);
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    void fetchDashboard(session);
    const interval = setInterval(() => {
      void fetchDashboard(session);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchDashboard, session]);

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

  const handleResolveFault = async (id: number) => {
    if (!session) return;
    try {
      setIsResolving(id);
      await authRequest(
        (token) =>
          axios.post(
            `${API_BASE}/resolve-fault`,
            { id },
            { headers: { Authorization: `Bearer ${token}` } }
          ),
        session
      );
      await fetchDashboard(session);
    } catch (resolveError) {
      console.error(resolveError);
      setError("Failed to resolve fault");
    } finally {
      setIsResolving(null);
    }
  };

  const handleLogin = async () => {
    try {
      setAuthLoading(true);
      setError(null);
      const { data } = await axios.post<LoginResponse>(`${API_BASE}/auth/login`, {
        username,
        password,
      });
      saveSession(data);
      setLoading(true);
    } catch (loginError) {
      console.error(loginError);
      setError("Invalid login credentials");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!session) return;
    try {
      await axios.post(`${API_BASE}/auth/logout`, { refreshToken: session.refreshToken });
    } catch {
    } finally {
      saveSession(null);
      setFaults([]);
      setReport(null);
      setStreetlights(null);
      setTotalEnergy(null);
      setError(null);
    }
  };

  const handleExportCsv = async () => {
    if (!session) return;

    try {
      setIsExporting(true);
      const blob = await authRequest<Blob>(
        (token) =>
          axios.get<Blob>(`${API_BASE}/export/energy-usage.csv`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: "blob",
          }),
        session
      );

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `energy-usage-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (exportError) {
      console.error(exportError);
      setError("Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  };

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-6 text-zinc-900">
        <main className="w-full max-w-md rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">SPIMS Admin Login</h1>
          <p className="mt-1 text-sm text-zinc-500">Use seeded users: admin/admin123 or operator/operator123</p>

          {error && <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}

          <div className="mt-4 space-y-3">
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
              placeholder="Username"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
              placeholder="Password"
            />
            <button
              onClick={() => void handleLogin()}
              disabled={authLoading}
              className="w-full rounded-md bg-zinc-900 px-3 py-2 text-white disabled:opacity-50"
            >
              {authLoading ? "Signing in..." : "Login"}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <main className="mx-auto max-w-7xl p-6 lg:p-10">
        <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">SPIMS Admin Dashboard</h1>
            <p className="text-sm text-zinc-600">Auto refresh: every 10 seconds</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-700">{session.user.role}</span>
            <span className="text-sm text-zinc-600">{session.user.username}</span>
            <button
              onClick={() => void handleExportCsv()}
              disabled={isExporting}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              {isExporting ? "Exporting..." : "Export CSV"}
            </button>
            <button onClick={() => void handleLogout()} className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white">
              Logout
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-zinc-500">Total Energy Consumption</p>
            <p className="mt-2 text-2xl font-semibold">{totalEnergy?.totalConsumption.toFixed(2) ?? "0.00"} kWh</p>
          </article>

          <article className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-zinc-500">Active Streetlights</p>
            <p className="mt-2 text-2xl font-semibold">{streetlights?.active ?? 0}</p>
          </article>

          <article className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-zinc-500">Unresolved Faults</p>
            <p className="mt-2 text-2xl font-semibold">{report?.faultsSummary.unresolved_faults ?? 0}</p>
          </article>

          <article className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-zinc-500">Last Update</p>
            <p className="mt-2 text-sm font-medium">{formatDate(totalEnergy?.lastUpdated)}</p>
          </article>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <article className="xl:col-span-2 rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Monthly Energy Trend</h2>
            <div className="h-72">
              {loading ? (
                <p className="text-sm text-zinc-500">Loading chart...</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="dayLabel" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="totalConsumption" stroke="#2563eb" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </article>

          <article className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Fault Alerts</h2>
            <div className="space-y-3">
              {faults.length === 0 && <p className="text-sm text-zinc-500">No unresolved faults</p>}
              {faults.map((fault) => (
                <div key={fault.id} className="rounded-lg border border-zinc-200 p-3">
                  <p className="text-sm font-semibold">#{fault.id} • {fault.issue}</p>
                  <p className="text-xs text-zinc-500">{fault.location} • {formatDate(fault.timestamp)}</p>
                  {session.user.role === "ADMIN" ? (
                    <button
                      type="button"
                      onClick={() => void handleResolveFault(fault.id)}
                      disabled={isResolving === fault.id}
                      className="mt-2 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                    >
                      {isResolving === fault.id ? "Resolving..." : "Resolve"}
                    </button>
                  ) : (
                    <p className="mt-2 text-xs text-zinc-500">Resolve action requires ADMIN role</p>
                  )}
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
