# syntax=docker/dockerfile:1.7
#
# Production image for the Ceylon Ride Co. bike-rental app (Next.js 16 + MySQL).
#
# Debian "bookworm-slim" (glibc) is used deliberately instead of Alpine/musl:
# Next.js SWC and sharp ship prebuilt glibc binaries, which avoids the
# "@next/swc-linux-x64-musl not installed" and sharp runtime failures that
# musl images commonly hit.
#
# Build:  docker build -t bike-rental .
# Run:    docker compose up -d
ARG NODE_VERSION=22-bookworm-slim

##########  base  ##########
FROM node:${NODE_VERSION} AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

##########  deps (all dependencies, used for building + migrations)  ##########
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

##########  builder  ##########
FROM base AS builder
# Optional: pass --build-arg NEXT_BUILD_BUNDLER=webpack for low-memory builders.
ARG NEXT_BUILD_BUNDLER=""
ENV NEXT_BUILD_BUNDLER=${NEXT_BUILD_BUNDLER}
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# scripts/build.js verifies the public/img default bundle before compiling,
# so an incomplete build context fails here with a clear message.
RUN npm run build

##########  production dependencies only  ##########
FROM base AS prod-deps
ENV NODE_ENV=production
COPY package.json package-lock.json ./
# sharp needs its install scripts to fetch the correct native binary.
RUN npm ci --omit=dev && npm cache clean --force

##########  migrator (drizzle-kit lives in devDependencies)  ##########
FROM base AS migrator
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json drizzle.config.ts ./
COPY drizzle ./drizzle
COPY src ./src
COPY scripts ./scripts
CMD ["npx", "drizzle-kit", "migrate"]

##########  runner  ##########
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
# Default images (public/img) ship inside the image; public/uploads is a volume.
COPY --from=builder /app/public ./public
COPY package.json package-lock.json next.config.js server.js tsconfig.json drizzle.config.ts ./
COPY scripts ./scripts
COPY src ./src
COPY drizzle ./drizzle
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh \
 && mkdir -p /app/public/uploads \
 && chown -R node:node /app

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "server.js"]
