package services_test

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/sokomtaa/go-gateway/services"
)

const testSecret = "test-jwt-secret-for-unit-tests"

// makeToken generates a signed JWT with the given claims using the test secret.
func makeToken(claims jwt.MapClaims, secret string) string {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		panic("makeToken: " + err.Error())
	}
	return signed
}

func TestValidateToken_ValidToken_ReturnsRiderID(t *testing.T) {
	svc := services.NewAuthService(testSecret)

	riderID := "rider-42"
	tok := makeToken(jwt.MapClaims{
		"sub": riderID,
		"exp": time.Now().Add(1 * time.Hour).Unix(),
	}, testSecret)

	gotID, err := svc.ValidateToken(tok)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if gotID != riderID {
		t.Errorf("expected rider ID %q, got %q", riderID, gotID)
	}
}

func TestValidateToken_MissingToken_ReturnsError(t *testing.T) {
	svc := services.NewAuthService(testSecret)

	_, err := svc.ValidateToken("")
	if err == nil {
		t.Fatal("expected error for empty token, got nil")
	}
}

func TestValidateToken_ExpiredToken_ReturnsError(t *testing.T) {
	svc := services.NewAuthService(testSecret)

	tok := makeToken(jwt.MapClaims{
		"sub": "rider-99",
		"exp": time.Now().Add(-1 * time.Hour).Unix(), // already expired
	}, testSecret)

	_, err := svc.ValidateToken(tok)
	if err == nil {
		t.Fatal("expected error for expired token, got nil")
	}
}

func TestValidateToken_InvalidSignature_ReturnsError(t *testing.T) {
	svc := services.NewAuthService(testSecret)

	// Sign with a different secret
	tok := makeToken(jwt.MapClaims{
		"sub": "rider-77",
		"exp": time.Now().Add(1 * time.Hour).Unix(),
	}, "wrong-secret")

	_, err := svc.ValidateToken(tok)
	if err == nil {
		t.Fatal("expected error for invalid signature, got nil")
	}
}

func TestValidateToken_MissingSubject_ReturnsError(t *testing.T) {
	svc := services.NewAuthService(testSecret)

	// Token without a sub claim
	tok := makeToken(jwt.MapClaims{
		"exp": time.Now().Add(1 * time.Hour).Unix(),
		// no "sub"
	}, testSecret)

	_, err := svc.ValidateToken(tok)
	if err == nil {
		t.Fatal("expected error for token missing subject claim, got nil")
	}
}
