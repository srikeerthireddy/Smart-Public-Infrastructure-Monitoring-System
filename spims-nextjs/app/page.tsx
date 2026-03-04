"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

type PublicStats = {
  totalStreetlights: number;
  activeStreetlights: number;
  energySaved: number;
  efficiencyPercent: number;
};

interface AuthSession {
  token: string;
  userId: number;
  username: string;
  role: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Check for existing session
  useEffect(() => {
    const stored = localStorage.getItem("spims_main_session");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSession(parsed);
        // Redirect to dashboard if already logged in
        router.push("/dashboard");
      } catch (e) {
        localStorage.removeItem("spims_main_session");
      }
    }
  }, [router]);

  useEffect(() => {
    async function fetchPublicStats() {
      try {
        const [streetlightsRes, energyRes] = await Promise.all([
          axios.get(`${API_BASE}/active-streetlights`),
          axios.get(`${API_BASE}/total-energy`),
        ]);

        const streetlights = streetlightsRes.data;
        const energy = energyRes.data;

        setStats({
          totalStreetlights: streetlights.total || 0,
          activeStreetlights: streetlights.active || 0,
          energySaved: energy.totalConsumption ? parseFloat((energy.totalConsumption * 0.15).toFixed(2)) : 0,
          efficiencyPercent: streetlights.total
            ? parseFloat(((streetlights.active / streetlights.total) * 100).toFixed(1))
            : 0,
        });
      } catch (error) {
        console.error("Failed to fetch public stats:", error);
      } finally {
        setLoading(false);
      }
    }

    void fetchPublicStats();
    const interval = setInterval(() => {
      void fetchPublicStats();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    try {
      const response = await axios.post(`${API_BASE}/auth/login`, { username, password });
      const { user, accessToken } = response.data;

      const newSession: AuthSession = { 
        token: accessToken, 
        userId: user.id, 
        username: user.username, 
        role: user.role 
      };
      setSession(newSession);
      localStorage.setItem("spims_main_session", JSON.stringify(newSession));
      
      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error: any) {
      setLoginError(error.response?.data?.error || "Login failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setSignupError("Passwords do not match");
      return;
    }

    setIsSigningUp(true);

    try {
      const response = await axios.post(`${API_BASE}/auth/signup`, { 
        username, 
        password,
        role: "OPERATOR" // Default to operator role for public signups
      });
      const { user, accessToken } = response.data;

      const newSession: AuthSession = { 
        token: accessToken, 
        userId: user.id, 
        username: user.username, 
        role: user.role 
      };
      setSession(newSession);
      localStorage.setItem("spims_main_session", JSON.stringify(newSession));
      
      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error: any) {
      setSignupError(error.response?.data?.error || "Sign up failed");
    } finally {
      setIsSigningUp(false);
    }
  };

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
                <span className="text-xl font-bold text-zinc-900">SPIMS</span>
                <p className="text-xs text-zinc-500">Smart Public Infrastructure Monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a href="#about" className="text-sm font-medium text-zinc-600 hover:text-blue-600 transition-colors">
                About
              </a>
              <a href="#features" className="text-sm font-medium text-zinc-600 hover:text-blue-600 transition-colors">
                Features
              </a>
              <a href="#contact" className="text-sm font-medium text-zinc-600 hover:text-blue-600 transition-colors">
                Contact
              </a>
              <button
                onClick={() => setShowLogin(true)}
                className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:shadow-xl"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-md rounded-2xl border border-white/20 bg-white p-8 shadow-2xl">
            <button
              onClick={() => {
                setShowLogin(false);
                setLoginError("");
              }}
              className="absolute right-4 top-4 rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mx-auto mb-4 shadow-lg">
                <span className="text-2xl font-bold text-white">S</span>
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-2">Welcome to SPIMS</h2>
              <p className="text-sm text-zinc-600">Sign in to access your dashboard</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-zinc-700 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Enter your username"
                  required
                  disabled={isLoggingIn}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Enter your password"
                  required
                  disabled={isLoggingIn}
                />
              </div>

              {loginError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-zinc-600">
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => {
                    setShowLogin(false);
                    setShowSignup(true);
                    setUsername("");
                    setPassword("");
                    setLoginError("");
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sign Up Modal */}
      {showSignup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-md rounded-2xl border border-white/20 bg-white p-8 shadow-2xl">
            <button
              onClick={() => {
                setShowSignup(false);
                setSignupError("");
                setUsername("");
                setPassword("");
                setConfirmPassword("");
              }}
              className="absolute right-4 top-4 rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mx-auto mb-4 shadow-lg">
                <span className="text-2xl font-bold text-white">S</span>
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-2">Create Account</h2>
              <p className="text-sm text-zinc-600">Sign up to access SPIMS dashboard</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label htmlFor="signup-username" className="block text-sm font-medium text-zinc-700 mb-2">
                  Username
                </label>
                <input
                  id="signup-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Choose a username"
                  required
                  disabled={isSigningUp}
                  minLength={3}
                />
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-zinc-700 mb-2">
                  Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Create a password"
                  required
                  disabled={isSigningUp}
                  minLength={6}
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-zinc-700 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Confirm your password"
                  required
                  disabled={isSigningUp}
                  minLength={6}
                />
              </div>

              {signupError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                  {signupError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSigningUp}
                className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigningUp ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-zinc-600">
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setShowSignup(false);
                    setShowLogin(true);
                    setUsername("");
                    setPassword("");
                    setConfirmPassword("");
                    setSignupError("");
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-20 lg:py-28">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMzYjgyZjYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItMnptMC0yaDJ2LTJoLTJ2MnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        <div className="relative mx-auto max-w-7xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700 mb-6 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Live Public Infrastructure Data
            </div>
            <h1 className="text-4xl font-bold text-zinc-900 sm:text-5xl lg:text-6xl mb-6 leading-tight">
              Building a Smarter,
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Energy-Efficient City
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600 mb-8">
              SPIMS monitors electricity usage in public buildings, tracks streetlight status, and manages infrastructure faults in real-time to make our city smarter and more sustainable.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Link
                href="#stats"
                className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-base font-semibold text-white shadow-xl shadow-blue-600/30 transition-all hover:shadow-2xl hover:scale-105"
              >
                View Live Statistics
              </Link>
              <a
                href="#about"
                className="rounded-lg border-2 border-zinc-300 bg-white px-8 py-3 text-base font-semibold text-zinc-900 transition-all hover:border-blue-400 hover:bg-blue-50"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Live Public Statistics */}
      <section id="stats" className="px-6 py-16 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-zinc-900 mb-3">
              Real-Time City Statistics
            </h2>
            <p className="text-zinc-600 max-w-2xl mx-auto">
              Live public data updated every 30 seconds showing our city&apos;s infrastructure health and energy efficiency
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-zinc-500">Loading live statistics...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="group rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-lg transition-all hover:shadow-xl hover:scale-105">
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-medium text-zinc-600 mb-2">Total Streetlights</p>
                <p className="text-4xl font-bold text-zinc-900">{stats?.totalStreetlights || 0}</p>
                <p className="text-xs text-zinc-500 mt-2">City-wide infrastructure</p>
              </div>

              <div className="group rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-white p-6 shadow-lg transition-all hover:shadow-xl hover:scale-105">
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                    {stats?.efficiencyPercent || 0}%
                  </span>
                </div>
                <p className="text-sm font-medium text-zinc-600 mb-2">Active Lights</p>
                <p className="text-4xl font-bold text-zinc-900">{stats?.activeStreetlights || 0}</p>
                <p className="text-xs text-zinc-500 mt-2">Currently operational</p>
              </div>

              <div className="group rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-6 shadow-lg transition-all hover:shadow-xl hover:scale-105">
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-medium text-zinc-600 mb-2">Energy Saved (kWh)</p>
                <p className="text-4xl font-bold text-zinc-900">{stats?.energySaved || 0}</p>
                <p className="text-xs text-zinc-500 mt-2">This month</p>
              </div>

              <div className="group rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white p-6 shadow-lg transition-all hover:shadow-xl hover:scale-105">
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-medium text-zinc-600 mb-2">System Efficiency</p>
                <p className="text-4xl font-bold text-zinc-900">{stats?.efficiencyPercent || 0}%</p>
                <p className="text-xs text-zinc-500 mt-2">Operational performance</p>
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-zinc-500">
              <svg className="inline h-4 w-4 mr-1.5 text-green-600 align-text-bottom" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Live data • Auto-updating every 30 seconds
            </p>
          </div>
        </div>
      </section>

      {/* About SPIMS Section */}
      <section id="about" className="px-6 py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-100 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-4">
                About SPIMS
              </div>
              <h2 className="text-4xl font-bold text-zinc-900 mb-6">
                What is SPIMS?
              </h2>
              <div className="space-y-4 text-zinc-600 text-lg">
                <p>
                  <strong className="text-zinc-900">Smart Public Infrastructure Monitoring System (SPIMS)</strong> is a comprehensive platform designed to monitor and manage city infrastructure in real-time.
                </p>
                <p>
                  SPIMS tracks <strong className="text-zinc-900">electricity usage</strong> in public buildings, monitors <strong className="text-zinc-900">streetlight status</strong> (ON/OFF/FAULT), and manages <strong className="text-zinc-900">infrastructure faults</strong> to help our city become smarter and more energy-efficient.
                </p>
                <p>
                  Through advanced analytics and real-time monitoring, SPIMS empowers city officials, operators, and citizens to work together towards a sustainable future.
                </p>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-white shadow-sm">
                  <p className="text-2xl font-bold text-blue-600">⚡</p>
                  <p className="text-sm text-zinc-600 mt-1">Energy Tracking</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-white shadow-sm">
                  <p className="text-2xl font-bold text-green-600">💡</p>
                  <p className="text-sm text-zinc-600 mt-1">Streetlight Monitor</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-white shadow-sm">
                  <p className="text-2xl font-bold text-orange-600">🚨</p>
                  <p className="text-sm text-zinc-600 mt-1">Fault Detection</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl border-2 border-indigo-200 bg-white p-8 shadow-2xl">
                <h3 className="text-xl font-bold text-zinc-900 mb-4">Core Benefits</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <svg className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-zinc-900">Real-Time Monitoring</p>
                      <p className="text-sm text-zinc-600">Track infrastructure status 24/7 with live updates</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-zinc-900">Energy Efficiency</p>
                      <p className="text-sm text-zinc-600">Reduce energy waste and optimize consumption</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-zinc-900">Automated Fault Detection</p>
                      <p className="text-sm text-zinc-600">Quickly identify and resolve infrastructure issues</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-zinc-900">Public Transparency</p>
                      <p className="text-sm text-zinc-600">Citizens can view live infrastructure statistics</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Energy Conservation Awareness */}
      <section className="px-6 py-20 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="mx-auto max-w-5xl text-center text-white">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm font-medium mb-6 backdrop-blur-sm">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Energy Conservation Awareness
          </div>
          <h2 className="text-4xl font-bold mb-6">Together, We Can Make a Difference</h2>
          <p className="text-xl text-green-50 mb-8 max-w-3xl mx-auto">
            Every kilowatt-hour saved contributes to a cleaner environment and a sustainable future for our city. Here&apos;s how you can help:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-5xl mb-4">💡</div>
              <h3 className="text-xl font-bold mb-2">Use Energy-Efficient Lighting</h3>
              <p className="text-green-50">Switch to LED bulbs and turn off lights when not in use</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-5xl mb-4">🌱</div>
              <h3 className="text-xl font-bold mb-2">Support Green Infrastructure</h3>
              <p className="text-green-50">Advocate for renewable energy and smart infrastructure</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-2">Stay Informed</h3>
              <p className="text-green-50">Monitor public statistics and report infrastructure issues</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-zinc-900 mb-4">Key Features</h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              Advanced tools and capabilities designed to make your city smarter and more sustainable
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">⚡ Electricity Monitoring</h3>
              <p className="text-zinc-600">
                Track real-time electricity usage of public buildings with automated meter readings and consumption analytics
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">💡 Streetlight Status</h3>
              <p className="text-zinc-600">
                Monitor all streetlights across the city with status indicators (ON / OFF / FAULT) and automatic fault alerts
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">🚨 Fault Management</h3>
              <p className="text-zinc-600">
                Automated infrastructure fault detection with resolution tracking and maintenance assignment workflows
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">📊 Energy Analytics</h3>
              <p className="text-zinc-600">
                Comprehensive energy consumption reports, trend analysis, and predictive insights for better decision-making
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">👥 Multi-User Access</h3>
              <p className="text-zinc-600">
                Role-based access for public citizens, enterprise operators, and government administrators
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">📥 Export & Reports</h3>
              <p className="text-zinc-600">
                Download comprehensive reports in CSV format for external analysis and regulatory compliance
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="px-6 py-20 bg-gradient-to-br from-zinc-50 to-zinc-100">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-zinc-900 mb-4">Get In Touch</h2>
            <p className="text-lg text-zinc-600">
              Have questions or want to learn more about SPIMS? Contact our team
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center border-2 border-transparent hover:border-blue-300 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white mx-auto mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-zinc-900 mb-2">Email</h3>
              <p className="text-sm text-zinc-600">contact@spims.city</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg text-center border-2 border-transparent hover:border-green-300 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white mx-auto mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="font-bold text-zinc-900 mb-2">Phone</h3>
              <p className="text-sm text-zinc-600">+1 (555) 123-4567</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg text-center border-2 border-transparent hover:border-purple-300 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white mx-auto mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-zinc-900 mb-2">Address</h3>
              <p className="text-sm text-zinc-600">City Hall, Smart City</p>
            </div>
          </div>

          <div className="mt-12 bg-white rounded-2xl p-8 shadow-lg border border-zinc-200">
            <h3 className="text-xl font-bold text-zinc-900 mb-4">Report Infrastructure Issues</h3>
            <p className="text-zinc-600 mb-6">
              Notice a streetlight malfunction or infrastructure problem? Help us maintain our city by reporting issues directly through our enterprise portal.
            </p>
            <Link
              href="/enterprise"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Report an Issue
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Access SPIMS Dashboards</h2>
          <p className="text-xl text-blue-100 mb-10">
            Choose your portal to access infrastructure monitoring and management tools
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <Link
              href="/admin"
              className="group rounded-2xl bg-white p-8 shadow-2xl transition-all hover:scale-105 hover:shadow-3xl"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Admin Portal</h3>
              <p className="text-sm text-zinc-600 mb-4">Strategic monitoring & city-level analytics</p>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
                Access Dashboard
                <svg className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>

            <Link
              href="/enterprise"
              className="group rounded-2xl bg-white p-8 shadow-2xl transition-all hover:scale-105 hover:shadow-3xl"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Enterprise Login</h3>
              <p className="text-sm text-zinc-600 mb-4">Operational control & infrastructure management</p>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                Operator Login
                <svg className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-lg">
                  S
                </div>
                <div>
                  <span className="text-lg font-bold text-zinc-900">SPIMS</span>
                </div>
              </div>
              <p className="text-sm text-zinc-600 mb-4 max-w-md">
                Smart Public Infrastructure Monitoring System - Making our city smarter and more energy-efficient through real-time monitoring and analytics.
              </p>
              <div className="flex gap-3">
                <div className="text-xs text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-full">⚡ Energy Tracking</div>
                <div className="text-xs text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-full">💡 Streetlight Monitor</div>
                <div className="text-xs text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-full">🚨 Fault Detection</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 mb-3">Dashboards</h3>
              <ul className="space-y-2 text-sm text-zinc-600">
                <li><Link href="/admin" className="hover:text-blue-600 transition-colors">Admin Portal</Link></li>
                <li><Link href="/enterprise" className="hover:text-blue-600 transition-colors">Enterprise Login</Link></li>
                <li><a href="#stats" className="hover:text-blue-600 transition-colors">Live Statistics</a></li>
                <li><a href="#features" className="hover:text-blue-600 transition-colors">Features</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 mb-3">Learn More</h3>
              <ul className="space-y-2 text-sm text-zinc-600">
                <li><a href="#about" className="hover:text-blue-600 transition-colors">About SPIMS</a></li>
                <li><a href="#contact" className="hover:text-blue-600 transition-colors">Contact Us</a></li>
                <li><Link href="/api/health" target="_blank" className="hover:text-blue-600 transition-colors">API Status</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-zinc-200">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-zinc-600">
                © 2026 SPIMS. All rights reserved. • Built with Next.js, TypeScript & PostgreSQL
              </p>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                System Online
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
