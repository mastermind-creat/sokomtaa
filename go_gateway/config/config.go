package config

import (
	"log"
	"os"
)

// Config holds all environment-based configuration for the gateway.
type Config struct {
	RedisURL   string
	JWTSecret  string
	LaravelURL string
	Port       string
}

// Load reads required environment variables and fails fast if any are missing.
func Load() *Config {
	cfg := &Config{
		RedisURL:   os.Getenv("REDIS_URL"),
		JWTSecret:  os.Getenv("JWT_SECRET"),
		LaravelURL: os.Getenv("LARAVEL_URL"),
		Port:       os.Getenv("PORT"),
	}

	if cfg.RedisURL == "" {
		log.Fatal("fatal: REDIS_URL environment variable is required")
	}
	if cfg.JWTSecret == "" {
		log.Fatal("fatal: JWT_SECRET environment variable is required")
	}
	if cfg.LaravelURL == "" {
		log.Fatal("fatal: LARAVEL_URL environment variable is required")
	}
	if cfg.Port == "" {
		cfg.Port = "8002"
	}

	return cfg
}
