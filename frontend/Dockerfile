FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
ENV NODE_ENV=development
RUN npm install --include=dev

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Ensure server.js and assets are placed at root of runner
RUN if [ ! -f "server.js" ] && [ -f "frontend/server.js" ]; then \
      cp -r frontend/* . && rm -rf frontend; \
    fi && \
    mkdir -p .next && \
    cp -r .next/static .next/ 2>/dev/null || true

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=15s \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/manifest.json || exit 1

CMD ["sh", "-c", "if [ -f server.js ]; then node server.js; elif [ -f frontend/server.js ]; then cd frontend && node server.js; else find . -name server.js -exec node {} \\;; fi"]
