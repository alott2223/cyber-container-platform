# Multi-stage build for Go backend and Node.js frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Go backend stage
FROM golang:1.24-alpine AS backend-builder

RUN apk --no-cache add gcc musl-dev

WORKDIR /app/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ ./
RUN CGO_ENABLED=1 GOOS=linux go build -o main .

# Final stage
FROM node:18-alpine

RUN apk --no-cache add ca-certificates docker-cli
WORKDIR /app

# Copy built frontend
COPY --from=frontend-builder /app/frontend/.next/standalone ./
COPY --from=frontend-builder /app/frontend/.next/static ./.next/static
COPY --from=frontend-builder /app/frontend/public ./public

# Copy built backend
COPY --from=backend-builder /app/backend/main ./

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3000 8080 8081

CMD ["sh", "-c", "./main & exec env PORT=3000 node server.js"]
