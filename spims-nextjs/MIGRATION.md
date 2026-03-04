# Migration from Microservices to Unified Next.js

## Old Architecture (Microservices)

```
spims/
├── backend-service/          (Express.js - Port 5000)
│   ├── server.js
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   └── services/
│
├── public-website/           (Next.js - Port 3001)
│   └── app/
│
├── admin-dashboard/          (Next.js - Port 3000)
│   └── app/
│
└── enterprise-dashboard/     (Angular - Port 4200)
    └── src/
```

**Issues:**
- ❌ 4 separate services to maintain
- ❌ 4 different package.json files
- ❌ Complex CORS configuration
- ❌ Multiple deployment processes
- ❌ Hard to share code between services
- ❌ API calls across different ports

## New Architecture (Unified Next.js)

```
spims-nextjs/
├── app/
│   ├── page.tsx                 # Public website
│   ├── admin/page.tsx           # Admin dashboard
│   ├── enterprise/page.tsx      # Enterprise dashboard
│   └── api/                     # Backend API routes
│       ├── health/route.ts
│       ├── auth/
│       └── ...
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   └── simulator.ts
└── scripts/
    └── db-*.js
```

**Benefits:**
- ✅ Single codebase
- ✅ One package.json
- ✅ No CORS issues (same origin)
- ✅ Single deployment
- ✅ Shared utilities and types
- ✅ API routes in `/api/*`

## Feature Mapping

| Feature | Old | New |
|---------|-----|-----|
| **Public Website** | `public-website/` (Port 3001) | `/` |
| **Admin Dashboard** | `admin-dashboard/` (Port 3000) | `/admin` |
| **Enterprise Dashboard** | `enterprise-dashboard/` (Port 4200) | `/enterprise` |
| **Auth APIs** | `backend-service/routes/authRoutes.js` | `/app/api/auth/*` |
| **Metrics APIs** | `backend-service/routes/metricsRoutes.js` | `/app/api/*` |
| **Database** | `backend-service/db/pool.js` | `/lib/db.ts` |
| **Auth Middleware** | `backend-service/middleware/auth.js` | `/lib/auth.ts` |
| **Simulator** | `backend-service/services/simulator.js` | `/lib/simulator.ts` |

## API Endpoints Comparison

### Old URLs (Microservices)
```
http://localhost:5000/api/auth/login
http://localhost:5000/api/total-energy
http://localhost:5000/health
```

### New URLs (Unified Next.js)
```
http://localhost:3000/api/auth/login
http://localhost:3000/api/total-energy
http://localhost:3000/api/health
```

## Code Migration Examples

### Authentication Middleware

**Old (Express.js):**
```javascript
// backend-service/middleware/auth.js
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.slice(7);
  const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  req.user = { id: payload.sub, role: payload.role };
  next();
}
```

**New (Next.js API Route):**
```typescript
// lib/auth.ts
export function authenticateRequest(request: NextRequest): AuthUser {
  const token = extractBearerToken(request);
  const payload = verifyAccessToken(token);
  return { id: payload.sub, role: payload.role };
}
```

### API Route

**Old (Express.js):**
```javascript
// backend-service/routes/metricsRoutes.js
router.get('/total-energy', authenticateToken, getTotalEnergy);
```

**New (Next.js):**
```typescript
// app/api/total-energy/route.ts
export async function GET(request: NextRequest) {
  const user = authenticateRequest(request);
  requireRole(user, 'ADMIN', 'OPERATOR');
  // ... rest of logic
}
```

## Migration Checklist

- [x] Database utilities migrated to `lib/db.ts`
- [x] Auth utilities migrated to `lib/auth.ts`
- [x] All API routes converted to Next.js API routes
- [x] Admin dashboard migrated to `/admin`
- [x] Public website migrated to `/`
- [x] Enterprise dashboard created (simplified)
- [x] Simulator integrated
- [x] Database scripts updated
- [x] Docker configuration created
- [x] Single package.json with all dependencies

## Running the New Application

### Development
```bash
cd spims-nextjs
npm install
npm run db:init
npm run db:seed
npm run dev
```

### Production (Docker)
```bash
cd spims-nextjs
docker-compose up -d
```

## What's Different?

1. **No Express.js** - All backend logic in Next.js API routes
2. **No Angular** - Enterprise dashboard rebuilt in React/Next.js
3. **TypeScript Everywhere** - Full type safety across frontend and backend
4. **Shared Code** - Database, auth, and utilities accessible everywhere
5. **Simpler Deployment** - One container instead of four

## Performance Improvements

- **Reduced Network Calls**: Frontend and backend on same origin
- **Code Splitting**: Next.js automatic code splitting
- **SSR/SSG**: Server-side rendering for faster initial loads
- **API Routes**: Fast, optimized serverless-style functions

---

**Result**: From 4 scattered services → 1 unified, maintainable Next.js application! 🎉
