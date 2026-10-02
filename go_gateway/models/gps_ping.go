package models

// GpsPing represents a GPS location update sent by a Boda Rider over WebSocket.
type GpsPing struct {
	Lat float64 `json:"lat"`
	Lon float64 `json:"lon"`
}
