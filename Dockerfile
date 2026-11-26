# Final Working Dockerfile for Blood Pressure Monitor
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY backend/go.mod backend/go.sum ./

# Copy backend source
COPY backend ./

# Get dependencies and build the backend
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o blood_pressure_monitor ./cmd/main.go

# Final stage
FROM alpine:latest
RUN apk --no-cache add ca-certificates

WORKDIR /app

# Copy the binary
COPY --from=builder /app/blood_pressure_monitor /app/blood_pressure_monitor

# Copy config file
COPY config/config.yaml /app/config/config.yaml

# Create database directory (will be mounted as volume in production)
RUN mkdir -p /app/database

# Copy frontend
COPY frontend /app/frontend

# Set environment variables for paths
ENV CONFIG_PATH=/app/config/config.yaml
ENV DB_PATH=/app/database/blood_pressure.db
ENV DB_DIR=/app/database
ENV FRONTEND_PATH=/app/frontend

# Expose port 8082
EXPOSE 8082

# Run the binary
CMD ["/app/blood_pressure_monitor"]