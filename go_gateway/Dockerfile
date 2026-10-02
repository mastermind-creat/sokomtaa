# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for layer caching.
COPY go.mod go.sum ./
RUN go mod download

# Copy source and compile a statically-linked binary.
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -o /go-gateway ./main.go

# ── Stage 2: Runtime ───────────────────────────────────────────────────────────
FROM alpine:3.19

# Non-root user for security.
RUN addgroup -S gateway && adduser -S gateway -G gateway

WORKDIR /app

COPY --from=builder /go-gateway /app/go-gateway

# Ensure the binary is executable.
RUN chmod +x /app/go-gateway

USER gateway

EXPOSE 8002

ENTRYPOINT ["/app/go-gateway"]
