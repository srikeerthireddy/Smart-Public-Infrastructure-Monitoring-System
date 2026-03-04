# SPIMS - Unified Next.js Application

**Smart Public Infrastructure Monitoring System** - Everything in one Next.js project!

## 🎉 What Changed?

No more scattered microservices! Everything is now unified in a single Next.js application:

- ✅ **Frontend Pages**: Public, Admin, Enterprise dashboards
- ✅ **Backend APIs**: All API endpoints in `/app/api/*`
- ✅ **Database**: PostgreSQL with connection pooling
- ✅ **Auth**: JWT authentication with refresh tokens
- ✅ **Simulator**: Real-time data generation
- ✅ **TypeScript**: Full type safety

## 📁 Project Structure

```
spims-nextjs/
├── app/
│   ├── page.tsx                    # Public website
│   ├── admin/page.tsx              # Admin dashboard
│   ├── enterprise/page.tsx         # Enterprise dashboard
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Global styles
│   └── api/                        # Backend API routes
│       ├── health/route.ts
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── refresh/route.ts
│       │   └── logout/route.ts
│       ├── total-energy/route.ts
│       ├── active-streetlights/route.ts
│       ├── faults/route.ts
│       ├── energy-usage/route.ts
│       ├── energy-areas/route.ts
│       ├── monthly-report/route.ts
│       ├── resolve-fault/route.ts
│       └── export/
│           └── energy-usage.csv/route.ts
├── lib/
│   ├── db.ts                       # Database connection
│   ├── auth.ts                     # Auth utilities
│   ├── simulator.ts                # Data simulator
│   └── error-handler.ts            # Error handling
├── scripts/
│   ├── db-init.js                  # Database init
│   ├── db-seed.js                  # Database seeding
│   ├── schema.sql                  # DB schema
│   └── seed.sql                    # Seed data
├── package.json
├── tsconfig.json
├── next.config.ts
├── Dockerfile
└── .env.example
```

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and configure:
# - DATABASE_URL (PostgreSQL connection)
# - JWT_ACCESS_SECRET & JWT_REFRESH_SECRET
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Initialize Database

```bash
npm run db:init
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Visit:
- **Public Website**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin
- **Enterprise Dashboard**: http://localhost:3000/enterprise
- **API Health**: http://localhost:3000/api/health

### 5. Login Credentials

**Admin**:
- Username: `admin`
- Password: `admin123`

**Operator**:
- Username: `operator`
- Password: `operator123`

## 📡 API Endpoints

### Public
- `GET /api/health` - Health check

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout

### Metrics (Requires Auth)
- `GET /api/total-energy?area=Downtown` - Total energy consumption
- `GET /api/active-streetlights` - Streetlight status counts
- `GET /api/faults?resolved=false&limit=50` - Fault list
- `GET /api/energy-usage?area=Downtown&limit=200` - Energy usage data
- `GET /api/energy-areas` - List of areas
- `GET /api/monthly-report?month=2026-03` - Monthly report
- `GET /api/export/energy-usage.csv` - Export CSV
- `POST /api/resolve-fault` - Resolve fault (Admin only)

## 🐳 Docker Deployment

```bash
# Build image
docker build -t spims-nextjs .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/spims \
  -e JWT_ACCESS_SECRET=your-secret \
  -e JWT_REFRESH_SECRET=your-refresh-secret \
  spims-nextjs
```

## 🛠️ Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:init` - Initialize database schema
- `npm run db:seed` - Seed database with test data

## 🔐 Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/spims

# JWT Secrets
JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Features
AUTO_SEED=true
SIMULATOR_INTERVAL=10000

# Client-side API URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

## ✨ Features

- **Unified Codebase**: One Next.js app for everything
- **API Routes**: Backend logic in `/app/api/*`
- **SSR & CSR**: Server-side and client-side rendering
- **TypeScript**: Full type safety
- **Real-time Simulator**: Automatic data generation
- **JWT Auth**: Secure authentication with refresh tokens
- **PostgreSQL**: Robust database with connection pooling
- **Tailwind CSS**: Modern, responsive UI
- **Recharts**: Beautiful data visualizations

## 📊 Database Schema

- **energy_usage**: Energy consumption records
- **streetlights**: Streetlight status logs
- **faults**: Infrastructure fault reports
- **users**: User accounts (ADMIN, OPERATOR)
- **refresh_sessions**: JWT refresh token sessions

## 🎯 Benefits Over Old Architecture

| Old (Microservices) | New (Unified Next.js) |
|---------------------|----------------------|
| 4 separate services | 1 unified app |
| Express + 3 frontends | All in Next.js |
| Multiple package.json | Single package.json |
| Complex CORS setup | No CORS needed |
| Hard to maintain | Easy to maintain |
| 4 Docker containers | 1 Docker container |

---

Built with ❤️ by consolidating everything into Next.js!
