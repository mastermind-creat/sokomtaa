package services

import (
	"errors"
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

// AuthService validates JWT tokens issued by the Laravel API.
type AuthService struct {
	secret []byte
}

// NewAuthService creates an AuthService using the provided HMAC secret.
func NewAuthService(jwtSecret string) *AuthService {
	return &AuthService{secret: []byte(jwtSecret)}
}

// ValidateToken parses and validates a signed JWT token string.
// Returns the rider ID (subject claim) on success, or an error on failure.
// Rejects tokens that are missing, expired, or carry an invalid signature.
func (a *AuthService) ValidateToken(tokenStr string) (riderID string, err error) {
	if tokenStr == "" {
		return "", errors.New("auth: token is missing")
	}

	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		// Enforce HMAC signing — reject RSA/EC tokens to prevent algorithm confusion.
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("auth: unexpected signing method: %v", t.Header["alg"])
		}
		return a.secret, nil
	},
		jwt.WithValidMethods([]string{"HS256", "HS384", "HS512"}),
		jwt.WithExpirationRequired(),
	)

	if err != nil {
		return "", fmt.Errorf("auth: invalid token: %w", err)
	}

	if !token.Valid {
		return "", errors.New("auth: token is not valid")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", errors.New("auth: could not read token claims")
	}

	sub, err := claims.GetSubject()
	if err != nil || sub == "" {
		return "", errors.New("auth: token is missing subject (rider ID)")
	}

	return sub, nil
}
