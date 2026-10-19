package handlers

import (
	"fmt"
	"math/rand"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/sokomtaa/go-gateway/services"
)

const wsTestSecret = "test-secret-key-12345"

func makeWsTestToken(claims jwt.MapClaims, secret string) string {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		panic("makeWsTestToken: " + err.Error())
	}
	return signed
}

func TestProperty27_GoGatewayRejectsWebSocketWithoutValidJWT(t *testing.T) {
	// Feature: polyglot-architecture-upgrade, Property 27: Go_Gateway Rejects WebSocket Without Valid JWT
	// Validates: Requirements 14.1

	auth := services.NewAuthService(wsTestSecret)
	handler := NewRiderWSHandler(auth, nil)

	// 1. Missing token
	req := httptest.NewRequest(http.MethodGet, "/ws/rider", nil)
	rec := httptest.NewRecorder()
	handler.HandleRiderSocket(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("missing token: expected HTTP 401, got %d", rec.Code)
	}

	// 2. Expired token
	expiredTok := makeWsTestToken(jwt.MapClaims{
		"sub": "rider-1",
		"exp": time.Now().Add(-1 * time.Hour).Unix(),
	}, wsTestSecret)
	req = httptest.NewRequest(http.MethodGet, "/ws/rider?token="+expiredTok, nil)
	rec = httptest.NewRecorder()
	handler.HandleRiderSocket(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expired token: expected HTTP 401, got %d", rec.Code)
	}

	// 3. Invalid signature
	wrongSigTok := makeWsTestToken(jwt.MapClaims{
		"sub": "rider-1",
		"exp": time.Now().Add(1 * time.Hour).Unix(),
	}, "wrong-secret-key")
	req = httptest.NewRequest(http.MethodGet, "/ws/rider?token="+wrongSigTok, nil)
	rec = httptest.NewRecorder()
	handler.HandleRiderSocket(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("invalid signature token: expected HTTP 401, got %d", rec.Code)
	}

	// 4. Property test across 50 randomized invalid tokens
	for i := 0; i < 50; i++ {
		randomLength := rand.Intn(40) + 1
		randomBytes := make([]byte, randomLength)
		for b := range randomBytes {
			randomBytes[b] = byte(rand.Intn(26) + 97)
		}
		randomToken := string(randomBytes)

		req = httptest.NewRequest(http.MethodGet, fmt.Sprintf("/ws/rider?token=%s", randomToken), nil)
		rec = httptest.NewRecorder()
		handler.HandleRiderSocket(rec, req)

		if rec.Code != http.StatusUnauthorized {
			t.Errorf("random invalid token %q: expected HTTP 401, got %d", randomToken, rec.Code)
		}
	}
}
