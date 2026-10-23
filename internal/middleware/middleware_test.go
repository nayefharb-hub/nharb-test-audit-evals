package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/nayefharb-hub/throttled/internal/bucket"
)

var ok = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
})

func fixedClock() func() time.Time {
	t := time.Date(2024, 3, 1, 12, 0, 0, 0, time.UTC)
	return func() time.Time { return t }
}

func request(h http.Handler, remote string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = remote
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func TestRateLimitAdmitsWithinBurst(t *testing.T) {
	l := bucket.New(1, 3, bucket.WithClock(fixedClock()))
	h := RateLimit(l, Options{}, ok)
	for i := 0; i < 3; i++ {
		if rec := request(h, "10.0.0.1:5000"); rec.Code != http.StatusOK {
			t.Fatalf("request %d: status %d, want 200", i, rec.Code)
		}
	}
}

func TestRateLimitRejectsOverBurst(t *testing.T) {
	l := bucket.New(0.5, 1, bucket.WithClock(fixedClock()))
	h := RateLimit(l, Options{}, ok)
	request(h, "10.0.0.1:5000")

	rec := request(h, "10.0.0.1:5001")
	if rec.Code != http.StatusTooManyRequests {
		t.Fatalf("status %d, want 429", rec.Code)
	}
	if got := rec.Header().Get("Retry-After"); got != "2" {
		t.Errorf("Retry-After = %q, want %q", got, "2")
	}
	if got := rec.Header().Get("X-RateLimit-Limit"); got != "1" {
		t.Errorf("X-RateLimit-Limit = %q, want %q", got, "1")
	}
}

func TestRateLimitSeparatesClients(t *testing.T) {
	l := bucket.New(1, 1, bucket.WithClock(fixedClock()))
	h := RateLimit(l, Options{}, ok)
	request(h, "10.0.0.1:5000")
	if rec := request(h, "10.0.0.2:5000"); rec.Code != http.StatusOK {
		t.Errorf("second client got %d, want 200", rec.Code)
	}
}

// clientKey is unexported, but the X-Forwarded-For handling is easy to get
// subtly wrong and awkward to reach through the handler, so it is tested
// directly here.
func TestClientKey(t *testing.T) {
	tests := []struct {
		name       string
		remote     string
		xff        string
		trustProxy bool
		want       string
	}{
		{"remote addr with port", "192.0.2.7:4321", "", false, "192.0.2.7"},
		{"ipv6 remote addr", "[2001:db8::1]:443", "", false, "2001:db8::1"},
		{"remote addr without port", "192.0.2.7", "", false, "192.0.2.7"},
		{"forwarded header ignored by default", "192.0.2.7:1", "203.0.113.9", false, "192.0.2.7"},
		{"first forwarded hop when trusted", "192.0.2.7:1", "203.0.113.9, 198.51.100.2", true, "203.0.113.9"},
		{"blank forwarded entry falls back", "192.0.2.7:1", " , 198.51.100.2", true, "192.0.2.7"},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			req.RemoteAddr = tc.remote
			if tc.xff != "" {
				req.Header.Set("X-Forwarded-For", tc.xff)
			}
			if got := clientKey(req, tc.trustProxy); got != tc.want {
				t.Errorf("clientKey = %q, want %q", got, tc.want)
			}
		})
	}
}
