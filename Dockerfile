FROM node:20-slim AS base

# Phase 1: Dependencies
FROM base AS deps
RUN apt-get update && apt-get install -y python3 make g++ sqlite3 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Phase 2: Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Phase 3: Production Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Standalone output bundle
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# SQLite Database initial copy
COPY --from=builder --chown=nextjs:nodejs /app/sqlite.db ./sqlite.db

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
