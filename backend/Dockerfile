# =============================================================================
# Backend Dockerfile - Multi-stage build for Node.js
# =============================================================================

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm ci --workspace=backend

# Copy source code
COPY backend/ ./backend/

# Build TypeScript
RUN npm run build --workspace=backend

# =============================================================================
# Production stage
# =============================================================================
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install production dependencies only
RUN npm ci --workspace=backend --omit=dev && \
    npm cache clean --force

# Copy built files from builder
COPY --from=builder /app/backend/dist ./backend/dist

# Set ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Environment variables with defaults
# WebSocket is served on the same port as HTTP (at /ws path)
ENV NODE_ENV=production \
    PORT=3001 \
    MQTT_BROKER_URL=mqtt://mqtt:1883 \
    SERVICE_TIMEOUT_MS=60000 \
    HEALTH_CHECK_INTERVAL_MS=5000

# Expose HTTP port (WebSocket is on same port at /ws path)
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the server
CMD ["node", "backend/dist/index.js"]
