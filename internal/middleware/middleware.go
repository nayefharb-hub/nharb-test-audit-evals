// Package middleware applies a bucket.Limiter to HTTP handlers.
package middleware

import (
	"math"
	"net"
	"net/http"
	"strconv"
	"strings"

	"github.com/nayefharb-hub/throttled/internal/bucket"
)

// Options controls how clients are identified.
type Options struct {
	// TrustProxy keys clients by the first X-Forwarded-For entry when the
	// header is present. Only enable it behind a proxy that sets the header.
	TrustProxy bool
}

// RateLimit wraps next so that each client is limited by l. Rejected
// requests get 429 with a Retry-After header in whole seconds.
func RateLimit(l *bucket.Limiter, opts Options, next http.Handler) http.Handler {
	limit := strconv.Itoa(l.Burst())
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		key := clientKey(r, opts.TrustProxy)
		w.Header().Set("X-RateLimit-Limit", limit)
		if !l.Allow(key) {
			wait := l.RetryAfter(key).Seconds()
			w.Header().Set("Retry-After", strconv.Itoa(int(math.Ceil(wait))))
			http.Error(w, "rate limit exceeded", http.StatusTooManyRequests)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// clientKey returns the identity used to pick a bucket for r.
func clientKey(r *http.Request, trustProxy bool) string {
	if trustProxy {
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			first, _, _ := strings.Cut(xff, ",")
			if ip := strings.TrimSpace(first); ip != "" {
				return ip
			}
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
