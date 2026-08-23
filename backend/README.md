# SIMTA API SERVICE

## Setup

```sh
# Install dependencies
npm install

# Create .env
cp .env.example .env

# Generate prisma client
npm run prisma:generate
```

## Run

```sh
# Setup DB
npm run prisma:db-push
npm run prisma:generate

# Run service (development-only)
npm run dev
```

## Jalankan Setiap Setelah Merubah Schema

```sh
npm run prisma:db-push
npm run prisma:generate
```

## Help

- [Prisma Documentation](https://www.prisma.io/docs/prisma-orm/quickstart/prisma-postgres)
