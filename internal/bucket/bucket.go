// Package bucket implements a keyed token-bucket rate limiter.
//
// Each key (usually a client address) gets its own bucket holding up to
// burst tokens. Tokens are replenished continuously at rate tokens per
// second. A request is admitted when a whole token is available.
package bucket

import (
	"math"
	"sync"
	"time"
)

// State is the persisted form of a single bucket.
type State struct {
	Tokens float64   `json:"tokens"`
	Last   time.Time `json:"last"`
}

// Option configures a Limiter.
type Option func(*Limiter)

// WithClock overrides the time source. It is mainly useful in tests.
func WithClock(now func() time.Time) Option {
	return func(l *Limiter) { l.now = now }
}

// Limiter tracks one token bucket per key. It is safe for concurrent use.
type Limiter struct {
	mu      sync.Mutex
	rate    float64
	burst   float64
	now     func() time.Time
	buckets map[string]*State
}

// New returns a limiter that refills at rate tokens per second and holds at
// most burst tokens per key.
func New(rate float64, burst int, opts ...Option) *Limiter {
	l := &Limiter{
		rate:    rate,
		burst:   float64(burst),
		now:     time.Now,
		buckets: make(map[string]*State),
	}
	for _, o := range opts {
		o(l)
	}
	return l
}

// Burst reports the bucket capacity.
func (l *Limiter) Burst() int { return int(l.burst) }

// Allow reports whether one request for key may proceed now, consuming a
// token if so.
func (l *Limiter) Allow(key string) bool { return l.AllowN(key, 1) }

// AllowN reports whether n tokens are available for key and consumes them if
// so. Requests for more than the burst size are always rejected.
func (l *Limiter) AllowN(key string, n int) bool {
	if n <= 0 {
		return true
	}
	l.mu.Lock()
	defer l.mu.Unlock()

	b := l.refill(key)
	if b.Tokens < float64(n) {
		return false
	}
	b.Tokens -= float64(n)
	return true
}

// Tokens returns the number of tokens currently available for key.
func (l *Limiter) Tokens(key string) float64 {
	l.mu.Lock()
	defer l.mu.Unlock()
	return l.refill(key).Tokens
}

// RetryAfter returns how long a caller must wait before a single token is
// available for key. It returns zero if a token is available now.
func (l *Limiter) RetryAfter(key string) time.Duration {
	l.mu.Lock()
	defer l.mu.Unlock()

	b := l.refill(key)
	if b.Tokens >= 1 {
		return 0
	}
	if l.rate <= 0 {
		return time.Duration(math.MaxInt64)
	}
	missing := 1 - b.Tokens
	return time.Duration(missing / l.rate * float64(time.Second))
}

// Reset forgets all state for key, so its next request sees a full bucket.
func (l *Limiter) Reset(key string) {
	l.mu.Lock()
	defer l.mu.Unlock()
	delete(l.buckets, key)
}

// refill brings key's bucket up to date and returns it. Callers must hold mu.
func (l *Limiter) refill(key string) *State {
	now := l.now()
	b, ok := l.buckets[key]
	if !ok {
		b = &State{Tokens: l.burst, Last: now}
		l.buckets[key] = b
		return b
	}
	if elapsed := now.Sub(b.Last); elapsed > 0 {
		b.Tokens = math.Min(l.burst, b.Tokens+elapsed.Seconds()*l.rate)
		b.Last = now
	}
	return b
}
