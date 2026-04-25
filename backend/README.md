# SIMTA API SERVICE

## Setup

```sh
# Install dependencies
npm install

# Create .env
cp .env.example .env

# Generate prisma client
npx prisma generate
```

## Run

```sh
# Setup DB
npx prisma db push
npx prisma db seed
npx prisma generate

# Run service (development-only)
npm start
```

## Jalankan Setiap Setelah Merubah Schema

```sh
npx prisma db push
npx prisma generate
```

## Help

- [Prisma Documentation](https://www.prisma.io/docs/prisma-orm/quickstart/prisma-postgres)
