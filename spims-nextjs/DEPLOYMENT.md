# Deployment Guide - Unified SPIMS Next.js

## Development

```bash
# Install dependencies
npm install

# Setup database
npm run db:init
npm run db:seed

# Start development server
npm run dev
```

Visit http://localhost:3000

## Production

### Option 1: Docker

```bash
# Build image
docker build -t spims-nextjs .

# Run with PostgreSQL
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/spims" \
  -e JWT_ACCESS_SECRET="your-secret-key" \
  -e JWT_REFRESH_SECRET="your-refresh-key" \
  spims-nextjs
```

### Option 2: Node.js

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Option 3: Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: spims
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/spims
      JWT_ACCESS_SECRET: change-this-secret
      JWT_REFRESH_SECRET: change-this-refresh-secret
      AUTO_SEED: "true"
      SIMULATOR_INTERVAL: "10000"
    depends_on:
      - postgres

volumes:
  postgres-data:
```

Then run:

```bash
docker-compose up -d
```

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens

Optional:
- `AUTO_SEED` - Auto-seed database on startup (default: true)
- `SIMULATOR_INTERVAL` - Data simulation interval in ms (default: 10000)
- `NEXT_PUBLIC_API_BASE_URL` - API base URL for client-side (default: http://localhost:3000/api)

## Database Setup

The app will automatically initialize and seed the database if `AUTO_SEED=true`.

Manual database setup:

```bash
npm run db:init
npm run db:seed
```

## Health Check

Check if the application is running:

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "db": "connected",
  "uptimeSeconds": 123,
  "responseTimeMs": 5,
  "timestamp": "2026-03-04T..."
}
```
