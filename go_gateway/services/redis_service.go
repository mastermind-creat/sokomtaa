package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

// bufferedPing holds a GPS ping that could not be written to Redis, with its expiry time.
type bufferedPing struct {
	riderID   string
	lon       float64
	lat       float64
	expiresAt time.Time
}

// RedisService wraps Redis GEO, ZSET, and Pub/Sub operations.
type RedisService struct {
	client *redis.Client
	mu     sync.Mutex
	buffer []bufferedPing
}

// NewRedisService creates a RedisService from a redis URL string.
func NewRedisService(redisURL string) (*RedisService, error) {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("redis: invalid URL: %w", err)
	}

	client := redis.NewClient(opts)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("redis: could not connect: %w", err)
	}

	svc := &RedisService{client: client}

	// Background goroutine: retry buffered pings every 5 seconds.
	go svc.retryBuffer()

	return svc, nil
}

// Client exposes the underlying redis.Client for health checks.
func (s *RedisService) Client() *redis.Client {
	return s.client
}

// GeoAdd writes a rider's GPS position to a Redis GEO set.
// On failure the ping is buffered in memory for up to 30 seconds.
func (s *RedisService) GeoAdd(ctx context.Context, key, riderID string, lon, lat float64) error {
	err := s.client.GeoAdd(ctx, key, &redis.GeoLocation{
		Name:      riderID,
		Longitude: lon,
		Latitude:  lat,
	}).Err()

	if err != nil {
		log.Printf(`{"level":"error","service":"go-gateway","event":"geo_add_failed","rider_id":%q,"lon":%f,"lat":%f,"error":%q}`,
			riderID, lon, lat, err.Error())

		// Buffer with 30-second expiry so we can retry when Redis recovers.
		s.mu.Lock()
		s.buffer = append(s.buffer, bufferedPing{
			riderID:   riderID,
			lon:       lon,
			lat:       lat,
			expiresAt: time.Now().Add(30 * time.Second),
		})
		s.mu.Unlock()

		return err
	}
	return nil
}

// GeoRemove removes a rider entry from a Redis GEO set (ZREM under the hood).
func (s *RedisService) GeoRemove(ctx context.Context, key, riderID string) error {
	err := s.client.ZRem(ctx, key, riderID).Err()
	if err != nil {
		log.Printf(`{"level":"error","service":"go-gateway","event":"geo_remove_failed","rider_id":%q,"error":%q}`,
			riderID, err.Error())
	}
	return err
}

// Publish emits a JSON-serialisable payload on a Redis Pub/Sub channel.
func (s *RedisService) Publish(ctx context.Context, channel string, payload interface{}) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("redis: marshal payload: %w", err)
	}

	return s.client.Publish(ctx, channel, data).Err()
}

// retryBuffer periodically attempts to flush in-memory buffered pings to Redis.
func (s *RedisService) retryBuffer() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		s.mu.Lock()
		remaining := s.buffer[:0]
		toRetry := make([]bufferedPing, len(s.buffer))
		copy(toRetry, s.buffer)
		s.mu.Unlock()

		now := time.Now()
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)

		for _, p := range toRetry {
			if now.After(p.expiresAt) {
				// Expired — drop silently.
				continue
			}

			err := s.client.GeoAdd(ctx, "active_riders", &redis.GeoLocation{
				Name:      p.riderID,
				Longitude: p.lon,
				Latitude:  p.lat,
			}).Err()

			if err != nil {
				// Keep in buffer for next retry.
				remaining = append(remaining, p)
				log.Printf(`{"level":"warn","service":"go-gateway","event":"buffer_retry_failed","rider_id":%q,"error":%q}`,
					p.riderID, err.Error())
			}
		}

		cancel()

		s.mu.Lock()
		s.buffer = remaining
		s.mu.Unlock()
	}
}
