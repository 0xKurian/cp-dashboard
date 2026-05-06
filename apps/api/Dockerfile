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

# Copy root node_modules and package.jsons for workspace resolution
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy types package (needed for runtime if not fully bundled)
COPY --from=builder /app/packages/types ./packages/types

# Copy built API
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

# Copy Prisma schema and generated client
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

EXPOSE 3001

# Run migrations then start
CMD ["sh", "-c", "cd apps/api && npx prisma@5 migrate deploy && node dist/apps/api/src/main"]
