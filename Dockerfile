# Multi-stage Dockerfile for Blood Pressure Monitor
# Supports: linux/amd64, linux/arm64, linux/arm/v7 (Raspberry Pi)

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

# Copy package files first for better caching
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build production frontend
RUN npm run build

# Stage 2: Build Backend
FROM golang:1.21-alpine AS backend-builder

WORKDIR /app

# Install build dependencies for SQLite
RUN apk add --no-cache gcc musl-dev

# Copy go mod files
COPY backend/go.mod backend/go.sum ./

# Download dependencies
RUN go mod download

# Copy backend source
COPY backend/ ./

# Build with CGO for SQLite support
# The TARGETARCH is automatically set by Docker buildx
ARG TARGETARCH
ARG TARGETOS=linux
RUN CGO_ENABLED=1 GOOS=${TARGETOS} GOARCH=${TARGETARCH} \
    go build -a -ldflags='-w -s -extldflags "-static"' \
    -o blood_pressure_monitor ./cmd/main.go

# Stage 3: Final minimal image
FROM alpine:3.19

# Install runtime dependencies
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copy the compiled backend binary
COPY --from=backend-builder /app/blood_pressure_monitor /app/blood_pressure_monitor

# Copy the built frontend (production assets from dist/)
COPY --from=frontend-builder /frontend/dist /app/frontend

# Copy config file
COPY config/config.yaml /app/config/config.yaml

# Create database directory (will be mounted as volume in production)
RUN mkdir -p /app/database

# Set environment variables
ENV CONFIG_PATH=/app/config/config.yaml
ENV DB_PATH=/app/database/blood_pressure.db
ENV DB_DIR=/app/database
ENV FRONTEND_PATH=/app/frontend
ENV TZ=Asia/Kolkata

# Expose port 8082
EXPOSE 8082

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8082/api/health || exit 1

# Run the binary
CMD ["/app/blood_pressure_monitor"]