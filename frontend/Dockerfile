# =============================================================================
# Frontend Dockerfile - Multi-stage build with Nginx
# =============================================================================

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci --workspace=frontend

# Copy source code
COPY frontend/ ./frontend/

# Build arguments for environment variables (needed at build time for Vite)
ARG VITE_WS_URL=ws://localhost:3002
ARG VITE_API_URL=http://localhost:3001

# Set environment variables for build
ENV VITE_WS_URL=$VITE_WS_URL \
    VITE_API_URL=$VITE_API_URL

# Build the frontend
RUN npm run build --workspace=frontend

# =============================================================================
# Production stage with Nginx
# =============================================================================
FROM nginx:alpine AS production

# Copy custom nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
