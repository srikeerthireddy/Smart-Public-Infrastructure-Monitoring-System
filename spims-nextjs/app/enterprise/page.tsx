"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const API_BASE = "http://localhost:3001/api";

interface AuthSession {
  token: string;
  userId: number;
  username: string;
  role: string;
}

interface Fault {
  id: number;
  location: string;
  severity: string;
  description: string;
  reported_at: string;
  resolved_at: string | null;
}

interface Streetlight {
  id: number;
  location: string;
  status: string;
  energy_consumed: number;
}

interface Building {
  id: number;
  name: string;
  energy_consumed: number;
  last_updated: string;
}

interface MonthlyData {
  date: string;
  consumption: number;
}

export default function EnterprisePage() {
  // Auth State
  const [session, setSession] = useState<AuthSession | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Dashboard Data
  const [faults, setFaults] = useState<Fault[]>([]);
  const [streetlights, setStreetlights] = useState<Streetlight[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [totalEnergy, setTotalEnergy] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [resolving, setResolving] = useState<number | null>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("spims_enterprise_session");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSession(parsed);
      } catch (e) {
        localStorage.removeItem("spims_enterprise_session");
      }
    }
  }, []);

  // Fetch data when authenticated
  useEffect(() => {
    if (session) {
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 20000); // 20s refresh
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchDashboardData = async () => {
    if (!session) return;

    try {
      const headers = { Authorization: `Bearer ${session.token}` };

      const [energyRes, streetlightsRes, faultsRes, reportRes] = await Promise.all([
        axios.get(`${API_BASE}/total-energy`, { headers }),
        axios.get(`${API_BASE}/active-streetlights`, { headers }),
        axios.get(`${API_BASE}/faults`, { headers }),
        axios.get(`${API_BASE}/monthly-report`, { headers }),
      ]);

      setTotalEnergy(energyRes.data.totalEnergyConsumed || 0);
      setActiveCount(energyRes.data.activeStreetlights || 0);
      setTotalCount(streetlightsRes.data.totalStreetlights || 0);
      setFaults(faultsRes.data.faults || []);
      setMonthlyData(reportRes.data.monthlyData || []);

      // Mock streetlights and buildings data
      const mockStreetlights: Streetlight[] = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        location: `Zone ${Math.floor(i / 5) + 1} - SL${i + 1}`,
        status: i % 7 === 0 ? "FAULT" : i % 3 === 0 ? "OFF" : "ON",
        energy_consumed: Math.random() * 150 + 50,
      }));

      const mockBuildings: Building[] = Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        name: `Building ${String.fromCharCode(65 + i)}`,
        energy_consumed: Math.random() * 5000 + 1000,
        last_updated: new Date().toISOString(),
      }));

      setStreetlights(mockStreetlights);
      setBuildings(mockBuildings);
    } catch (error: any) {
      if (error.response?.status === 401) {
        handleLogout();
      }
      console.error("Failed to fetch data:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/auth/login`, { username, password });
      const { token, userId, role } = response.data;

      const newSession: AuthSession = { token, userId, username, role };
      setSession(newSession);
      localStorage.setItem("spims_enterprise_session", JSON.stringify(newSession));
      setUsername("");
      setPassword("");
    } catch (error: any) {
      setLoginError(error.response?.data?.error || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem("spims_enterprise_session");
  };

  const handleResolveFault = async (faultId: number) => {
    if (!session) return;
    setResolving(faultId);

    try {
      await axios.post(
        `${API_BASE}/resolve-fault`,
        { faultId },
        { headers: { Authorization: `Bearer ${session.token}` } }
      );
      await fetchDashboardData();
    } catch (error) {
      console.error("Failed to resolve fault:", error);
    } finally {
      setResolving(null);
    }
  };

  // LOGIN SCREEN
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white mx-auto mb-4 shadow-2xl">
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">S</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">SPIMS Enterprise</h1>
            <p className="text-indigo-200">Operational Control Center</p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">Operator Login</h2>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-white mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg border border-white/30 bg-white/20 px-4 py-3 text-white placeholder-white/60 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  placeholder="Enter username"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/30 bg-white/20 px-4 py-3 text-white placeholder-white/60 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  placeholder="Enter password"
                  required
                  disabled={isLoading}
                />
              </div>

              {loginError && (
                <div className="rounded-lg bg-red-500/20 border border-red-400 px-4 py-3 text-sm text-red-100">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-white px-4 py-3 font-semibold text-indigo-900 shadow-xl transition-all hover:shadow-2xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-white/80 hover:text-white transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD (Authenticated)
  const activeFaults = faults.filter(f => !f.resolved_at);
  const resolvedFaults = faults.filter(f => f.resolved_at);

  const streetlightStats = {
    on: streetlights.filter(s => s.status === "ON").length,
    off: streetlights.filter(s => s.status === "OFF").length,
    fault: streetlights.filter(s => s.status === "FAULT").length,
  };

  const pieData = [
    { name: "ON", value: streetlightStats.on, color: "#10b981" },
    { name: "OFF", value: streetlightStats.off, color: "#6b7280" },
    { name: "FAULT", value: streetlightStats.fault, color: "#ef4444" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100">
      {/* Top Navigation */}
      <nav className="border-b border-zinc-200 bg-white shadow-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold">
                S
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-900">SPIMS Enterprise</h1>
                <p className="text-xs text-zinc-500">Operational Control Center</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                  {session.username.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-zinc-900">{session.username}</p>
                  <p className="text-xs text-zinc-500 capitalize">{session.role}</p>
                </div>
              </div>
              <Link
                href="/admin"
                className="rounded-lg border-2 border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 transition-all hover:border-indigo-300 hover:bg-indigo-50"
              >
                Admin Portal
              </Link>
              <Link
                href="/"
                className="rounded-lg border-2 border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 transition-all hover:border-zinc-300 hover:bg-zinc-50"
              >
                Home
              </Link>
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

      <main className="mx-auto max-w-7xl p-6 lg:p-8">
        {/* Overview Metrics */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">System Overview</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-zinc-600 mb-1">Total Energy</p>
              <p className="text-3xl font-bold text-zinc-900">{totalEnergy.toLocaleString()}</p>
              <p className="text-xs text-zinc-500 mt-2">kWh consumed</p>
            </div>

            <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-zinc-600 mb-1">Active Streetlights</p>
              <p className="text-3xl font-bold text-zinc-900">{activeCount}/{totalCount}</p>
              <p className="text-xs text-zinc-500 mt-2">{totalCount > 0 ? ((activeCount / totalCount) * 100).toFixed(1) : 0}% operational</p>
            </div>

            <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-zinc-600 mb-1">Active Faults</p>
              <p className="text-3xl font-bold text-zinc-900">{activeFaults.length}</p>
              <p className="text-xs text-zinc-500 mt-2">{resolvedFaults.length} resolved</p>
            </div>

            <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-zinc-600 mb-1">Buildings</p>
              <p className="text-3xl font-bold text-zinc-900">{buildings.length}</p>
              <p className="text-xs text-zinc-500 mt-2">Monitored</p>
            </div>
          </div>
        </section>

        {/* Streetlight Grid and Status Chart */}
        <section className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Streetlight Status Pie Chart */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg">
            <h3 className="text-xl font-bold text-zinc-900 mb-4">Streetlight Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${percent !== undefined ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-green-50 p-3">
                <p className="text-2xl font-bold text-green-700">{streetlightStats.on}</p>
                <p className="text-xs text-green-600">ON</p>
              </div>
              <div className="rounded-lg bg-zinc-100 p-3">
                <p className="text-2xl font-bold text-zinc-700">{streetlightStats.off}</p>
                <p className="text-xs text-zinc-600">OFF</p>
              </div>
              <div className="rounded-lg bg-red-50 p-3">
                <p className="text-2xl font-bold text-red-700">{streetlightStats.fault}</p>
                <p className="text-xs text-red-600">FAULT</p>
              </div>
            </div>
          </div>

          {/* Monthly Energy Analytics */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg">
            <h3 className="text-xl font-bold text-zinc-900 mb-4">Monthly Energy Consumption</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                />
                <Legend />
                <Line type="monotone" dataKey="consumption" stroke="#6366f1" strokeWidth={2} name="Energy (kWh)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Building Energy Tracking */}
        <section className="mb-8">
          <h3 className="text-xl font-bold text-zinc-900 mb-4">Building-wise Energy Consumption</h3>
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 uppercase tracking-wider">Building</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 uppercase tracking-wider">Energy Consumed (kWh)</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 uppercase tracking-wider">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {buildings.map((building) => (
                    <tr key={building.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700 font-bold">
                            {building.name.charAt(0)}
                          </div>
                          <span className="font-medium text-zinc-900">{building.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-semibold text-zinc-900">{building.energy_consumed.toFixed(1)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          Normal
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                        {new Date(building.last_updated).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Streetlight Management Grid */}
        <section className="mb-8">
          <h3 className="text-xl font-bold text-zinc-900 mb-4">Streetlight Management</h3>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {streetlights.map((light) => (
                <div
                  key={light.id}
                  className={`rounded-xl border-2 p-4 transition-all hover:shadow-lg ${
                    light.status === "ON"
                      ? "border-green-300 bg-green-50"
                      : light.status === "FAULT"
                      ? "border-red-300 bg-red-50"
                      : "border-zinc-300 bg-zinc-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-zinc-700">{light.location}</span>
                    <div
                      className={`h-3 w-3 rounded-full ${
                        light.status === "ON"
                          ? "bg-green-500 animate-pulse"
                          : light.status === "FAULT"
                          ? "bg-red-500"
                          : "bg-zinc-400"
                      }`}
                    />
                  </div>
                  <p className="text-xs text-zinc-600 mb-1">Status: <span className="font-semibold">{light.status}</span></p>
                  <p className="text-xs text-zinc-600">Energy: <span className="font-semibold">{light.energy_consumed.toFixed(1)} kWh</span></p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Fault Management Panel */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-zinc-900">Active Infrastructure Faults</h3>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-700">
                {activeFaults.length} Active
              </span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
                {resolvedFaults.length} Resolved
              </span>
            </div>
          </div>

          {activeFaults.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-lg">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-zinc-900 mb-2">No Active Faults</h4>
              <p className="text-sm text-zinc-600">All infrastructure is operating normally</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {activeFaults.map((fault) => {
                const severityColors = {
                  high: "border-red-300 bg-red-50",
                  medium: "border-orange-300 bg-orange-50",
                  low: "border-yellow-300 bg-yellow-50",
                };
                const severityBadges = {
                  high: "bg-red-100 text-red-700",
                  medium: "bg-orange-100 text-orange-700",
                  low: "bg-yellow-100 text-yellow-700",
                };

                return (
                  <div
                    key={fault.id}
                    className={`rounded-xl border-2 p-5 shadow-lg ${
                      severityColors[fault.severity.toLowerCase() as keyof typeof severityColors] || "border-zinc-300 bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                          <h4 className="font-bold text-zinc-900">{fault.location}</h4>
                        </div>
                        <p className="text-sm text-zinc-700 mb-3">{fault.description}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                              severityBadges[fault.severity.toLowerCase() as keyof typeof severityBadges] || "bg-zinc-100 text-zinc-700"
                            }`}
                          >
                            {fault.severity}
                          </span>
                          <span className="text-xs text-zinc-600">
                            Reported: {new Date(fault.reported_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleResolveFault(fault.id)}
                      disabled={resolving === fault.id}
                      className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resolving === fault.id ? "Resolving..." : "Mark as Resolved"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-zinc-200 bg-white px-6 py-8">
        <div className="mx-auto max-w-7xl text-center text-sm text-zinc-600">
          <p>© 2026 SPIMS Enterprise Platform. All rights reserved.</p>
          <p className="mt-2">Powered by Next.js • TypeScript • PostgreSQL</p>
        </div>
      </footer>
    </div>
  );
}
