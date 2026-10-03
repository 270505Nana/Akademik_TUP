FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Dummy DATABASE_URL untuk syarat `prisma generate`
RUN DATABASE_URL="postgresql://generate:generate@localhost:5432/generate" npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]