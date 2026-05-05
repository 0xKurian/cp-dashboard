# ─── Stage 1: Builder ────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace manifest
COPY package.json package-lock.json ./

# Copy source code and workspace package.jsons
COPY packages/types ./packages/types
COPY apps/api ./apps/api
COPY apps/web/package.json ./apps/web/package.json

# Install all workspace dependencies at the root
RUN npm install

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build TypeScript
RUN cd apps/api && npx nest build

# ─── Stage 2: Production runner ───────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Only copy production deps
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/package-lock.json ./package-lock.json 2>/dev/null || true

RUN npm install --omit=dev --ignore-scripts || true

# Copy built output
COPY --from=builder /app/apps/api/dist ./dist

# Copy Prisma client (generated at build time)
COPY --from=builder /app/apps/api/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/apps/api/node_modules/@prisma ./node_modules/@prisma

# Copy prisma schema for migrations
COPY --from=builder /app/apps/api/prisma ./prisma

EXPOSE 3001

# Run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/apps/api/src/main"]
