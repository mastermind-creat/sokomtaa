package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/sokomtaa/go-gateway/services"
)

// RedisPinger is satisfied by any type that can report Redis reachability.
// *services.RedisService implements this interface via its Ping method.
type RedisPinger interface {
	Ping(ctx context.Context) error
}

// redisPingerAdapter wraps *services.RedisService to satisfy RedisPinger.
type redisPingerAdapter struct {
	svc *services.RedisService
}

func (a *redisPingerAdapter) Ping(ctx context.Context) error {
	return a.svc.Client().Ping(ctx).Err()
}

// HealthHandler handles the GET /health endpoint.
type HealthHandler struct {
	pinger RedisPinger
}

// NewHealthHandler creates a HealthHandler with the given RedisService.
func NewHealthHandler(redis *services.RedisService) *HealthHandler {
	return &HealthHandler{pinger: &redisPingerAdapter{svc: redis}}
}

// newHealthHandlerWithPinger creates a HealthHandler for testing with any RedisPinger.
func newHealthHandlerWithPinger(p RedisPinger) *HealthHandler {
	return &HealthHandler{pinger: p}
}

// HandleHealth returns HTTP 200 when Redis is reachable, HTTP 503 otherwise.
func (h *HealthHandler) HandleHealth(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	if err := h.pinger.Ping(ctx); err != nil {
		logEvent("warn", "health_check_failed", map[string]interface{}{
			"error": err.Error(),
		})
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		w.Write([]byte(`{"status":"unavailable"}`))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok"}`))
}
