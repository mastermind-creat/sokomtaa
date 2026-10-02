package main

import (
	"fmt"
	"net/http"
	"time"

	"github.com/sokomtaa/go-gateway/config"
	"github.com/sokomtaa/go-gateway/handlers"
	"github.com/sokomtaa/go-gateway/services"
)

func main() {
	cfg := config.Load()

	logEvent("info", "startup", map[string]interface{}{
		"service": "go-gateway",
		"port":    cfg.Port,
	})

	redisService, err := services.NewRedisService(cfg.RedisURL)
	if err != nil {
		logFatal("redis_init_failed", err.Error())
	}

	authService := services.NewAuthService(cfg.JWTSecret)

	riderHandler := handlers.NewRiderWSHandler(authService, redisService)
	healthHandler := handlers.NewHealthHandler(redisService)

	mux := http.NewServeMux()
	mux.HandleFunc("/ws/rider", riderHandler.HandleRiderSocket)
	mux.HandleFunc("/health", healthHandler.HandleHealth)

	addr := ":" + cfg.Port
	logEvent("info", "listening", map[string]interface{}{
		"service": "go-gateway",
		"addr":    addr,
	})

	server := &http.Server{
		Addr:         addr,
		Handler:      mux,
		ReadTimeout:  60 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	if err := server.ListenAndServe(); err != nil {
		logFatal("server_error", err.Error())
	}
}

func logEvent(level, event string, fields map[string]interface{}) {
	line := fmt.Sprintf(`{"timestamp":%q,"service":"go-gateway","level":%q,"event":%q`,
		time.Now().UTC().Format(time.RFC3339), level, event)
	for k, v := range fields {
		line += fmt.Sprintf(`,%q:%q`, k, fmt.Sprint(v))
	}
	line += "}"
	println(line)
}

func logFatal(event, reason string) {
	logEvent("fatal", event, map[string]interface{}{"error": reason})
	panic(reason)
}
