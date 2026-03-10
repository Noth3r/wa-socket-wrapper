# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for TypeScript compilation)
RUN npm ci

# Copy source code
COPY . .

# Compile TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy compiled JavaScript from builder
COPY --from=builder /app/dist ./dist

# Create non-root user (node user already exists in Alpine)
RUN mkdir -p /app/data/auth && chown -R node:node /app

USER node

# Expose port (configurable via ENV)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health/ping || exit 1

# Start server
CMD ["node", "dist/index.js"]
