package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	"github.com/sokomtaa/go-gateway/models"
	"github.com/sokomtaa/go-gateway/services"
)

const (
	// idleReadDeadline is how long a connection may be idle before a ping is sent.
	idleReadDeadline = 30 * time.Second
	// pongWait is how long to wait for a pong after sending a ping.
	pongWait = 10 * time.Second
	// geoKeyRiders is the Redis GEO key for active rider positions.
	geoKeyRiders = "active_riders"
	// pubSubChannel is the Redis channel for rider events.
	pubSubChannel = "rider_events"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Allow all origins — authentication is handled via JWT token.
	CheckOrigin: func(r *http.Request) bool { return true },
}

// RiderWSHandler handles WebSocket connections from Boda Riders.
type RiderWSHandler struct {
	auth  *services.AuthService
	redis *services.RedisService
}

// NewRiderWSHandler creates a handler with the required service dependencies.
func NewRiderWSHandler(auth *services.AuthService, redis *services.RedisService) *RiderWSHandler {
	return &RiderWSHandler{auth: auth, redis: redis}
}

// HandleRiderSocket upgrades the HTTP request to a WebSocket connection, validates
// the JWT token, then loops reading GPS pings and writing them to Redis GEO.
func (h *RiderWSHandler) HandleRiderSocket(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")

	riderID, err := h.auth.ValidateToken(token)
	if err != nil {
		logEvent("warn", "ws_auth_rejected", map[string]interface{}{
			"error": err.Error(),
		})
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		logEvent("error", "ws_upgrade_failed", map[string]interface{}{
			"rider_id": riderID,
			"error":    err.Error(),
		})
		return
	}
	defer func() {
		conn.Close()
		h.handleDisconnect(riderID)
	}()

	logEvent("info", "ws_connected", map[string]interface{}{"rider_id": riderID})

	// Handle pong frames to keep the idle-timeout mechanism working.
	conn.SetPongHandler(func(string) error {
		return conn.SetReadDeadline(time.Now().Add(idleReadDeadline))
	})

	for {
		// Extend read deadline on every iteration.
		if err := conn.SetReadDeadline(time.Now().Add(idleReadDeadline)); err != nil {
			logEvent("warn", "ws_set_deadline_failed", map[string]interface{}{
				"rider_id": riderID, "error": err.Error(),
			})
			return
		}

		var ping models.GpsPing
		err := conn.ReadJSON(&ping)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err,
				websocket.CloseGoingAway,
				websocket.CloseNormalClosure,
				websocket.CloseNoStatusReceived,
			) {
				logEvent("warn", "ws_read_error", map[string]interface{}{
					"rider_id": riderID, "error": err.Error(),
				})
			}

			// Check if the deadline elapsed — send a ping and wait for pong.
			if isTimeoutError(err) {
				if pingErr := conn.WriteMessage(websocket.PingMessage, nil); pingErr != nil {
					logEvent("warn", "ws_ping_failed", map[string]interface{}{
						"rider_id": riderID, "error": pingErr.Error(),
					})
					return
				}
				// Give pongWait for the client to respond.
				if err := conn.SetReadDeadline(time.Now().Add(pongWait)); err != nil {
					return
				}
				// Try to read again — if no pong arrives, ReadJSON will error and we'll close.
				continue
			}

			return
		}

		// Validate WGS-84 coordinate ranges.
		if ping.Lat < -90 || ping.Lat > 90 || ping.Lon < -180 || ping.Lon > 180 {
			logEvent("warn", "ws_invalid_coords", map[string]interface{}{
				"rider_id": riderID, "lat": ping.Lat, "lon": ping.Lon,
			})
			conn.WriteMessage(websocket.CloseMessage,
				websocket.FormatCloseMessage(websocket.ClosePolicyViolation, "Invalid GPS coordinates"))
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)

		// Write position to Redis GEO (buffered internally on failure).
		if err := h.redis.GeoAdd(ctx, geoKeyRiders, riderID, ping.Lon, ping.Lat); err == nil {
			// Only publish the event when the write succeeded.
			event := map[string]interface{}{
				"event":     "rider.position_updated",
				"rider_id":  riderID,
				"lat":       ping.Lat,
				"lon":       ping.Lon,
				"timestamp": time.Now().Unix(),
			}
			if pubErr := h.redis.Publish(ctx, pubSubChannel, event); pubErr != nil {
				logEvent("warn", "ws_publish_failed", map[string]interface{}{
					"rider_id": riderID, "error": pubErr.Error(),
				})
			}
		}

		cancel()
	}
}

// handleDisconnect publishes a rider.disconnected event and removes the rider from GEO.
func (h *RiderWSHandler) handleDisconnect(riderID string) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	event := map[string]interface{}{
		"event":     "rider.disconnected",
		"rider_id":  riderID,
		"timestamp": time.Now().Unix(),
	}

	if err := h.redis.Publish(ctx, pubSubChannel, event); err != nil {
		logEvent("warn", "ws_disconnect_publish_failed", map[string]interface{}{
			"rider_id": riderID, "error": err.Error(),
		})
	}

	logEvent("info", "ws_disconnected", map[string]interface{}{"rider_id": riderID})
}

// logEvent writes a structured JSON log line to stdout.
func logEvent(level, event string, fields map[string]interface{}) {
	line := fmt.Sprintf(`{"timestamp":%q,"service":"go-gateway","level":%q,"event":%q`,
		time.Now().UTC().Format(time.RFC3339), level, event)
	for k, v := range fields {
		line += fmt.Sprintf(`,%q:%q`, k, fmt.Sprint(v))
	}
	line += "}"
	log.Println(line)
}

// isTimeoutError checks if an error is a network timeout.
func isTimeoutError(err error) bool {
	type netErr interface {
		Timeout() bool
	}
	if ne, ok := err.(netErr); ok {
		return ne.Timeout()
	}
	return false
}
