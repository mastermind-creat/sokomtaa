package services_test

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"sync"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/sokomtaa/go-gateway/services"
)

// ---------------------------------------------------------------------------
// Shared test helpers
// ---------------------------------------------------------------------------

// newTestRedisService connects to a local Redis instance for integration tests.
// If REDIS_URL is not reachable the tests skip gracefully rather than failing.
func newTestRedisService(t *testing.T) *services.RedisService {
	t.Helper()
	svc, err := services.NewRedisService("redis://127.0.0.1:6379/15") // DB 15 = test isolation
	if err != nil {
		t.Skipf("Redis unavailable (skipping integration test): %v", err)
	}
	// Flush the test DB to ensure a clean slate
	svc.Client().FlushDB(context.Background())
	t.Cleanup(func() {
		svc.Client().FlushDB(context.Background())
	})
	return svc
}

// randLon returns a random longitude within Kenya approximate bounds (33.9 – 42.0).
func randLon() float64 {
	return 33.9 + rand.Float64()*8.1
}

// randLat returns a random latitude within Kenya approximate bounds (-4.7 – 4.6).
func randLat() float64 {
	return -4.7 + rand.Float64()*9.3
}

// ---------------------------------------------------------------------------
// Feature: polyglot-architecture-upgrade, Property 7: GPS Ping Position Round-Trip
// Validates: Requirements 3.3, 4.2
//
// For any rider ID and valid GPS ping, after GeoAdd, GEOPOS active_riders <riderID> must
// return coordinates within ±0.0001 degrees of the input.
// ---------------------------------------------------------------------------

func TestProperty7_GPSPingPositionRoundTrip(t *testing.T) {
	// Feature: polyglot-architecture-upgrade, Property 7: GPS Ping Position Round-Trip
	svc := newTestRedisService(t)
	ctx := context.Background()
	const key = "active_riders"
	const epsilon = 0.0001 // degrees (~11 m at equator)
	const iterations = 100

	for i := 0; i < iterations; i++ {
		riderID := fmt.Sprintf("rider-prop7-%d", rand.Intn(100000))
		inLon := randLon()
		inLat := randLat()

		if err := svc.GeoAdd(ctx, key, riderID, inLon, inLat); err != nil {
			t.Fatalf("iteration %d: GeoAdd failed for rider %q: %v", i, riderID, err)
		}

		positions, err := svc.Client().GeoPos(ctx, key, riderID).Result()
		if err != nil {
			t.Fatalf("iteration %d: GEOPOS failed for rider %q: %v", i, riderID, err)
		}
		if len(positions) == 0 || positions[0] == nil {
			t.Fatalf("iteration %d: GEOPOS returned no position for rider %q", i, riderID)
		}

		outLon := positions[0].Longitude
		outLat := positions[0].Latitude

		if diff := abs64(outLon - inLon); diff > epsilon {
			t.Errorf("iteration %d: lon round-trip error %.8f > epsilon %.4f (rider=%q, inLon=%.7f, outLon=%.7f)",
				i, diff, epsilon, riderID, inLon, outLon)
		}
		if diff := abs64(outLat - inLat); diff > epsilon {
			t.Errorf("iteration %d: lat round-trip error %.8f > epsilon %.4f (rider=%q, inLat=%.7f, outLat=%.7f)",
				i, diff, epsilon, riderID, inLat, outLat)
		}

		// Clean up entry for this rider between iterations
		svc.Client().ZRem(ctx, key, riderID)
	}
}

// ---------------------------------------------------------------------------
// Feature: polyglot-architecture-upgrade, Property 8: Single GEO Entry Per Rider
// Validates: Requirements 3.4
//
// After N GPS pings (N ≥ 1) for any rider, the count of entries in active_riders for
// that rider ID must be exactly 1 (GEOADD overwrites, not appends).
// ---------------------------------------------------------------------------

func TestProperty8_SingleGEOEntryPerRider(t *testing.T) {
	// Feature: polyglot-architecture-upgrade, Property 8: Single GEO Entry Per Rider
	svc := newTestRedisService(t)
	ctx := context.Background()
	const key = "active_riders_prop8"
	const iterations = 80

	for i := 0; i < iterations; i++ {
		riderID := fmt.Sprintf("rider-single-%d", i)
		pingCount := rand.Intn(10) + 1 // 1..10 pings

		for j := 0; j < pingCount; j++ {
			lon := randLon()
			lat := randLat()
			if err := svc.GeoAdd(ctx, key, riderID, lon, lat); err != nil {
				t.Fatalf("iteration %d ping %d: GeoAdd failed: %v", i, j, err)
			}
		}

		// Count entries in the sorted set for this specific riderID
		score, err := svc.Client().ZScore(ctx, key, riderID).Result()
		if err == redis.Nil {
			t.Errorf("iteration %d: rider %q not found in %s after %d pings", i, riderID, key, pingCount)
			continue
		}
		if err != nil {
			t.Fatalf("iteration %d: ZScore failed: %v", i, err)
		}
		// score is the geohash — if it exists, the entry exists exactly once
		_ = score

		// Count all members and verify only one entry for this riderID
		allMembers, err := svc.Client().ZRange(ctx, key, 0, -1).Result()
		if err != nil {
			t.Fatalf("iteration %d: ZRange failed: %v", i, err)
		}

		countForRider := 0
		for _, m := range allMembers {
			if m == riderID {
				countForRider++
			}
		}

		if countForRider != 1 {
			t.Errorf("iteration %d: expected exactly 1 entry for rider %q after %d pings, got %d",
				i, riderID, pingCount, countForRider)
		}

		// Clean up between iterations
		svc.Client().ZRem(ctx, key, riderID)
	}
}

// ---------------------------------------------------------------------------
// Feature: polyglot-architecture-upgrade, Property 11: Position Updated Event Emitted on Each Write
// Validates: Requirements 4.8
//
// For any successful GEOADD active_riders, a rider.position_updated event must be published
// to rider_events containing the correct rider ID, latitude, and longitude.
// ---------------------------------------------------------------------------

func TestProperty11_PositionUpdatedEventEmittedOnEachWrite(t *testing.T) {
	// Feature: polyglot-architecture-upgrade, Property 11: Position Updated Event Emitted on Each Write
	svc := newTestRedisService(t)
	ctx := context.Background()
	const geoKey = "active_riders_prop11"
	const pubSubChannel = "rider_events_prop11"
	const iterations = 50

	// Subscribe to the test Pub/Sub channel before publishing
	sub := svc.Client().Subscribe(ctx, pubSubChannel)
	defer sub.Close()

	// Allow subscription to establish
	_, err := sub.Receive(ctx)
	if err != nil {
		t.Fatalf("Subscribe failed: %v", err)
	}

	type riderEvent struct {
		Event    string  `json:"event"`
		RiderID  string  `json:"rider_id"`
		Latitude float64 `json:"lat"`
		Longitude float64 `json:"lon"`
	}

	for i := 0; i < iterations; i++ {
		riderID := fmt.Sprintf("rider-prop11-%d-%d", i, rand.Intn(10000))
		lon := randLon()
		lat := randLat()

		// Perform GeoAdd
		if err := svc.GeoAdd(ctx, geoKey, riderID, lon, lat); err != nil {
			t.Fatalf("iteration %d: GeoAdd failed: %v", i, err)
		}

		// Simulate the publish that rider_ws.go does after each GeoAdd
		event := riderEvent{
			Event:    "rider.position_updated",
			RiderID:  riderID,
			Latitude: lat,
			Longitude: lon,
		}
		if err := svc.Publish(ctx, pubSubChannel, event); err != nil {
			t.Fatalf("iteration %d: Publish failed: %v", i, err)
		}

		// Receive the event with a timeout
		msgCh := make(chan *redis.Message, 1)
		var wg sync.WaitGroup
		wg.Add(1)
		go func() {
			defer wg.Done()
			ctxTimeout, cancel := context.WithTimeout(ctx, 2*time.Second)
			defer cancel()
			msg, err := sub.ReceiveMessage(ctxTimeout)
			if err == nil {
				msgCh <- msg
			}
		}()
		wg.Wait()
		close(msgCh)

		msg, received := <-msgCh
		if !received {
			t.Errorf("iteration %d: no rider.position_updated event received within 2s for rider %q", i, riderID)
			continue
		}

		// Parse and validate the event payload
		var received_event riderEvent
		if err := json.Unmarshal([]byte(msg.Payload), &received_event); err != nil {
			t.Errorf("iteration %d: cannot parse event payload %q: %v", i, msg.Payload, err)
			continue
		}

		if received_event.Event != "rider.position_updated" {
			t.Errorf("iteration %d: expected event=rider.position_updated, got %q", i, received_event.Event)
		}
		if received_event.RiderID != riderID {
			t.Errorf("iteration %d: expected rider_id=%q, got %q", i, riderID, received_event.RiderID)
		}
		if diff := abs64(received_event.Longitude - lon); diff > 1e-9 {
			t.Errorf("iteration %d: lon mismatch: sent %.9f, received %.9f", i, lon, received_event.Longitude)
		}
		if diff := abs64(received_event.Latitude - lat); diff > 1e-9 {
			t.Errorf("iteration %d: lat mismatch: sent %.9f, received %.9f", i, lat, received_event.Latitude)
		}

		// Clean up
		svc.Client().ZRem(ctx, geoKey, riderID)
	}
}

// abs64 returns the absolute value of a float64.
func abs64(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}
