package handlers

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// stubPinger is a test double for RedisPinger.
type stubPinger struct {
	err error
}

func (s *stubPinger) Ping(_ context.Context) error {
	return s.err
}

func TestHandleHealth_HealthyRedis_Returns200(t *testing.T) {
	handler := newHealthHandlerWithPinger(&stubPinger{err: nil})

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()

	handler.HandleHealth(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected HTTP 200, got %d", rec.Code)
	}

	body := rec.Body.String()
	if !strings.Contains(body, `"status":"ok"`) {
		t.Errorf("expected body to contain %q, got: %s", `"status":"ok"`, body)
	}
}

func TestHandleHealth_UnhealthyRedis_Returns503(t *testing.T) {
	handler := newHealthHandlerWithPinger(&stubPinger{err: errors.New("connection refused")})

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()

	handler.HandleHealth(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Errorf("expected HTTP 503, got %d", rec.Code)
	}

	body := rec.Body.String()
	if !strings.Contains(body, `"status":"unavailable"`) {
		t.Errorf("expected body to contain %q, got: %s", `"status":"unavailable"`, body)
	}
}
