# Mediouna Action - Setup & Testing Guide

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Project Overview](#project-overview)
- [Database Configuration](#database-configuration)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Testing Database Connection](#testing-database-connection)
- [Prisma 7 Migration Notes](#prisma-7-migration-notes)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before running this application, ensure you have the following installed:

- **Node.js** v20 or higher
- **npm** package manager
- **Docker** and Docker Compose
- **Git** (optional, for version control)

---

## Project Overview

**Mediouna Action** is a Next.js application built with:
- **Framework**: Next.js 14.2.33
- **Database**: PostgreSQL 15
- **ORM**: Prisma 7.1.0
- **Styling**: Tailwind CSS
- **Language**: TypeScript

---

## Database Configuration

### Docker PostgreSQL Setup

The project uses Docker Compose to run a PostgreSQL database. Configuration is in `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: mediouna_db
    restart: always
    environment:
      POSTGRES_USER: dofy
      POSTGRES_PASSWORD: dofy
      POSTGRES_DB: mediouna_db
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

### Environment Variables

Create a `.env` file in the project root with the following:

```env
DATABASE_URL="postgresql://dofy:dofy@localhost:5433/mediouna_db?schema=public"
```

**Note**: The database runs on port **5433** (not the default 5432) to avoid conflicts.

---

## Installation & Setup

### 1. Install Dependencies

```bash
cd c:\Users\selma\OneDrive\Bureau\mediounaaction\medactioncode
npm install
```

### 2. Start PostgreSQL Database

```bash
docker-compose up -d
```

Verify the database is running:
```bash
docker ps
```

You should see `mediouna_db` container running.

### 3. Set Up Environment Variables

Copy the example environment file:
```bash
copy .env.example .env
```

Ensure your `.env` file contains:
```env
DATABASE_URL="postgresql://dofy:dofy@localhost:5433/mediouna_db?schema=public"
```

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Run Database Migrations

```bash
npx prisma migrate dev
```

Or push the schema directly:
```bash
npx prisma db push
```

---

## Running the Application

### Development Mode

Start the development server:
```bash
npm run dev
```

The application will be available at:
- **Primary**: http://localhost:3000
- **Fallback**: http://localhost:3001 (if port 3000 is in use)

### Production Mode

Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

### Other Commands

- **Lint**: `npm run lint`
- **Format**: `npm run format`
- **Prisma Studio**: `npx prisma studio`

---

## Testing Database Connection

The project includes two methods to test the database connection:

### Method 1: API Route Test

**File Path**: `app/api/test-db/route.ts`

**How to Test**:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Visit the test endpoint:
   ```
   http://localhost:3000/api/test-db
   ```

3. Or use curl:
   ```bash
   curl http://localhost:3000/api/test-db
   ```

**Expected Response** (Success):
```json
{
  "status": "success",
  "message": "Database connection established"
}
```

**Expected Response** (Error):
```json
{
  "status": "error",
  "message": "Database connection failed",
  "error": "Error details..."
}
```

### Method 2: Standalone Test Script

**File Path**: `scripts/test-connection.ts`

**How to Run**:
```bash
npx tsx scripts/test-connection.ts
```

**Expected Output** (Success):
```
Connecting to database...
Database connection established successfully.
```

**Expected Output** (Error):
```
Connecting to database...
Database connection failed:
[Error message]
[Stack trace]
```

---

## Prisma 7 Migration Notes

This project uses **Prisma 7**, which introduced breaking changes from previous versions.

### Key Changes

1. **Driver Adapters Required**
   - Prisma 7 requires explicit driver adapters for database connections
   - This project uses `@prisma/adapter-pg` for PostgreSQL

2. **No URL in Schema**
   - The `url` property is no longer supported in `datasource` block
   - Database URL is now configured in the PrismaClient constructor

3. **Updated Dependencies**
   ```json
   {
     "@prisma/client": "^7.1.0",
     "@prisma/adapter-pg": "^7.1.0",
     "pg": "^8.x.x",
     "prisma": "^7.1.0"
   }
   ```

### Database Client Configuration

**File**: `lib/db.ts`

```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const db = globalThis.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
```

### Schema Configuration

**File**: `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}
```

---

## Troubleshooting

### Issue: "PrismaClientConstructorValidationError: Using engine type 'client' requires either 'adapter' or 'accelerateUrl'"

**Solution**: 
- Ensure you have installed `@prisma/adapter-pg` and `pg`
- Update `lib/db.ts` to use the adapter pattern (see above)
- Run `npx prisma generate` after changes

### Issue: Database Connection Failed

**Check**:
1. Is Docker running?
   ```bash
   docker ps
   ```

2. Is the PostgreSQL container running?
   ```bash
   docker-compose ps
   ```

3. Is the DATABASE_URL correct in `.env`?
   ```env
   DATABASE_URL="postgresql://dofy:dofy@localhost:5433/mediouna_db?schema=public"
   ```

4. Restart the database:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Issue: Port Already in Use

If port 3000 is already in use, Next.js will automatically try port 3001.

To stop a process on a specific port (Windows):
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Issue: Prisma Client Not Generated

**Solution**:
```bash
npx prisma generate
```

### Issue: Migration Errors

**Reset database** (⚠️ This will delete all data):
```bash
npx prisma migrate reset
```

**Push schema without migrations**:
```bash
npx prisma db push
```

---

## Quick Reference

### Essential Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `docker-compose up -d` | Start database |
| `docker-compose down` | Stop database |
| `npx prisma generate` | Generate Prisma Client |
| `npx prisma migrate dev` | Run migrations |
| `npx prisma db push` | Push schema to database |
| `npx prisma studio` | Open Prisma Studio |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |

### Important Paths

| Item | Path |
|------|------|
| **Project Root** | `c:\Users\selma\OneDrive\Bureau\mediounaaction\medactioncode` |
| **API Test Route** | `app\api\test-db\route.ts` |
| **Test Script** | `scripts\test-connection.ts` |
| **Database Client** | `lib\db.ts` |
| **Prisma Schema** | `prisma\schema.prisma` |
| **Docker Config** | `docker-compose.yml` |
| **Environment** | `.env` |

### Database Credentials

- **Host**: localhost
- **Port**: 5433
- **Database**: mediouna_db
- **User**: dofy
- **Password**: dofy

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma 7 Upgrade Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Last Updated**: December 4, 2025  
**Prisma Version**: 7.1.0  
**Next.js Version**: 14.2.33
