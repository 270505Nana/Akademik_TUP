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
# Run seeder
npx prisma db seed

# Run service (development-only)
npm start
```

## Help

- [Prisma Documentation](https://www.prisma.io/docs/prisma-orm/quickstart/prisma-postgres)
