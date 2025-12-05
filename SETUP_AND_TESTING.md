# Setup and Testing Guide

## 1. Installation

Install dependencies using pnpm:

```bash
pnpm install
```

## 2. Database Setup

### Start PostgreSQL

Run the database container:

```bash
docker-compose up -d
# OR for newer Docker versions:
docker compose up -d
```

### Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Ensure `.env` has the correct connection string (matching `docker-compose.yml`):

```env
DATABASE_URL="postgresql://<postgres>:<postgres>@localhost:5433/mediouna_db?schema=public"
```

### Initialize Prisma

Initialize Prisma (if not already done):

```bash
pnpm prisma init
```

### Run Migrations

Apply migrations to the database:

```bash
pnpm prisma migrate dev --name init
```

### Seed Database

Seed the database using the provided SQL file:

```bash
cat seed.sql | docker exec -i <container_name> psql -U <postgres_user> -d <postgres_db>
```

## 3. Running the Application

Start the development server:

```bash
pnpm dev
```

## 4. API Testing (Curl Commands)

### Test Database Connection
```bash
curl http://localhost:3000/api/test-db
```

### Etablissements

#### Get All Etablissements
```bash
curl "http://localhost:3000/api/etablissements?page=1&limit=10"
```

#### Search Etablissements
```bash
curl "http://localhost:3000/api/etablissements/search?q=hopital"
```

#### Get Etablissement by ID
```bash
curl http://localhost:3000/api/etablissements/1
```

#### Update Etablissement
```bash
curl -X PATCH http://localhost:3000/api/etablissements/1 \
  -H "Content-Type: application/json" \
  -d '{"nom": "Updated Name"}'
```

#### Delete Etablissement
```bash
curl -X DELETE http://localhost:3000/api/etablissements/1
```
