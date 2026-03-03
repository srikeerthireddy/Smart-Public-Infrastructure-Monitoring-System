import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  CategoryScale,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartConfiguration,
} from 'chart.js';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

type EnergyUsageItem = {
  id: number;
  area: string;
  consumption: number;
  timestamp: string;
};

type EnergyUsageResponse = {
  count: number;
  items: EnergyUsageItem[];
};

type EnergyAreasResponse = {
  items: string[];
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

type AuthUser = {
  id: number;
  username: string;
  role: 'ADMIN' | 'OPERATOR';
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

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private readonly apiBaseUrl = 'http://localhost:5000/api';
  private readonly authStorageKey = 'spims.enterprise.auth';
  private readonly platformId = inject(PLATFORM_ID);
  private refreshTimerId: ReturnType<typeof setInterval> | null = null;

  session: AuthSession | null = null;
  username = 'operator';
  password = 'operator123';
  authLoading = false;

  loading = false;
  error: string | null = null;
  lastUpdated: string | null = null;
  exporting = false;

  areaFilter = '';
  startDateFilter = '';
  endDateFilter = '';
  monthFilter = new Date().toISOString().slice(0, 7);

  areaOptions: string[] = [];
  energyRows: EnergyUsageItem[] = [];

  monthlyReport: MonthlyReportResponse | null = null;

  energyChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Total Consumption (kWh)',
        data: [],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.15)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  energyChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
      },
    },
  };

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.restoreSession();
    if (!this.session) {
      return;
    }

    void this.loadData();
    this.refreshTimerId = setInterval(() => {
      void this.loadData();
    }, 10000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimerId) {
      clearInterval(this.refreshTimerId);
    }
  }

  async onApplyFilters(): Promise<void> {
    await this.loadData();
  }

  async onClearFilters(): Promise<void> {
    this.areaFilter = '';
    this.startDateFilter = '';
    this.endDateFilter = '';
    await this.loadData();
  }

  async onLogin(): Promise<void> {
    try {
      this.authLoading = true;
      this.error = null;
      const payload = await this.fetchJson<LoginResponse>(`${this.apiBaseUrl}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({
          username: this.username,
          password: this.password,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }, false);

      this.persistSession(payload);
      await this.loadData();
      if (this.refreshTimerId) {
        clearInterval(this.refreshTimerId);
      }
      this.refreshTimerId = setInterval(() => {
        void this.loadData();
      }, 10000);
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Login failed';
    } finally {
      this.authLoading = false;
    }
  }

  async onLogout(): Promise<void> {
    if (this.session) {
      try {
        await this.fetchJson(`${this.apiBaseUrl}/auth/logout`, {
          method: 'POST',
          body: JSON.stringify({ refreshToken: this.session.refreshToken }),
          headers: {
            'Content-Type': 'application/json',
          },
        }, false);
      } catch {
      }
    }

    this.clearSession();
    this.energyRows = [];
    this.monthlyReport = null;
    this.areaOptions = [];
    this.error = null;
  }

  async onExportCsv(): Promise<void> {
    if (!this.session) {
      return;
    }

    try {
      this.exporting = true;
      const url = `${this.apiBaseUrl}/export/energy-usage.csv`;
      const response = await this.fetchWithAuth(url);
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(payload.message || `Request failed (${response.status})`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `energy-usage-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'CSV export failed';
    } finally {
      this.exporting = false;
    }
  }

  private restoreSession(): void {
    const raw = localStorage.getItem(this.authStorageKey);
    if (!raw) return;

    try {
      this.session = JSON.parse(raw) as AuthSession;
    } catch {
      localStorage.removeItem(this.authStorageKey);
      this.session = null;
    }
  }

  private persistSession(session: AuthSession | null): void {
    this.session = session;
    if (!session) {
      localStorage.removeItem(this.authStorageKey);
      return;
    }

    localStorage.setItem(this.authStorageKey, JSON.stringify(session));
  }

  private clearSession(): void {
    this.persistSession(null);
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.session) {
      throw new Error('No active session');
    }

    const payload = await this.fetchJson<RefreshResponse>(`${this.apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      body: JSON.stringify({ refreshToken: this.session.refreshToken }),
      headers: {
        'Content-Type': 'application/json',
      },
    }, false);

    this.persistSession({
      ...this.session,
      accessToken: payload.accessToken,
    });
  }

  private async fetchWithAuth(url: string, init: RequestInit = {}): Promise<Response> {
    if (!this.session) {
      throw new Error('Please login first');
    }

    const attempt = async (token: string) =>
      fetch(url, {
        ...init,
        headers: {
          ...(init.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      });

    let response = await attempt(this.session.accessToken);
    if (response.status === 401) {
      await this.refreshAccessToken();
      if (!this.session) {
        throw new Error('Session expired');
      }
      response = await attempt(this.session.accessToken);
    }

    return response;
  }

  private async fetchJson<T>(url: string, init: RequestInit = {}, useAuth = true): Promise<T> {
    const response = useAuth ? await this.fetchWithAuth(url, init) : await fetch(url, init);
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      throw new Error(payload.message || `Request failed (${response.status})`);
    }
    return (await response.json()) as T;
  }

  private toEnergyUsageUrl(): string {
    const params = new URLSearchParams();
    params.set('limit', '300');

    if (this.areaFilter.trim()) {
      params.set('area', this.areaFilter.trim());
    }

    if (this.startDateFilter) {
      params.set('startDate', `${this.startDateFilter}T00:00:00.000Z`);
    }

    if (this.endDateFilter) {
      params.set('endDate', `${this.endDateFilter}T23:59:59.999Z`);
    }

    return `${this.apiBaseUrl}/energy-usage?${params.toString()}`;
  }

  private async loadData(): Promise<void> {
    if (!this.session) {
      return;
    }

    this.loading = true;
    try {
      const [areas, usage, report] = await Promise.all([
        this.fetchJson<EnergyAreasResponse>(`${this.apiBaseUrl}/energy-areas`, {}, true),
        this.fetchJson<EnergyUsageResponse>(this.toEnergyUsageUrl(), {}, true),
        this.fetchJson<MonthlyReportResponse>(`${this.apiBaseUrl}/monthly-report?month=${this.monthFilter}`, {}, true),
      ]);

      this.areaOptions = areas.items;
      this.energyRows = usage.items;
      this.monthlyReport = report;

      this.energyChartData = {
        labels: report.energyByDay.map((row) =>
          new Date(row.day).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
        ),
        datasets: [
          {
            label: 'Total Consumption (kWh)',
            data: report.energyByDay.map((row) => row.totalConsumption),
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37,99,235,0.15)',
            fill: true,
            tension: 0.3,
          },
        ],
      };

      this.lastUpdated = new Date().toISOString();
      this.error = null;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to load enterprise dashboard data';
      if (this.error.toLowerCase().includes('session') || this.error.toLowerCase().includes('token')) {
        this.clearSession();
      }
    } finally {
      this.loading = false;
    }
  }
}
