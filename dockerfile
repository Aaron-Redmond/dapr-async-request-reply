# Stage 1: Base image with Node.js
FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Stage 2: Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Stage 3: Build the Next.js app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 4: Runtime image with Dapr
FROM node:18-alpine AS runner
WORKDIR /app

# Install Dapr runtime (using the latest linux_amd64.tar.gz)
RUN apk add --no-cache curl tar gzip \
    && curl -L -o daprd.tar.gz https://github.com/dapr/dapr/releases/download/v1.13.0/daprd_linux_amd64.tar.gz \
    && tar -xzf daprd.tar.gz -C /usr/local/bin \
    && rm daprd.tar.gz \
    && chmod +x /usr/local/bin/daprd

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Copy standalone build and static assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Dapr components (adjust path as needed)
COPY dapr/components/ ./dapr/components/

# Expose ports (Next.js on 3000, Dapr on 3500 by default)
EXPOSE 3000
EXPOSE 3500

# Start Dapr and Next.js
CMD ["sh", "-c", "daprd --app-id dapr-async-reply-app --app-port 3000 --components-path ./dapr/components & node server.js"]