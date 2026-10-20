package bucket

import (
	"testing"
	"time"
)

// fakeClock is a manually advanced time source.
type fakeClock struct{ t time.Time }

func newFakeClock() *fakeClock {
	return &fakeClock{t: time.Date(2024, 3, 1, 12, 0, 0, 0, time.UTC)}
}

func (c *fakeClock) Now() time.Time          { return c.t }
func (c *fakeClock) Advance(d time.Duration) { c.t = c.t.Add(d) }

func TestAllow(t *testing.T) {
	tests := []struct {
		name    string
		rate    float64
		burst   int
		prior   int           // requests made before the one under test
		advance time.Duration // time elapsed after the prior requests
		n       int
		want    bool
	}{
		{name: "fresh bucket", rate: 1, burst: 5, n: 1, want: true},
		{name: "last token in burst", rate: 1, burst: 5, prior: 4, n: 1, want: true},
		{name: "burst exhausted", rate: 1, burst: 5, prior: 5, n: 1, want: false},
		{name: "refilled after one second", rate: 1, burst: 5, prior: 5, advance: time.Second, n: 1, want: true},
		{name: "partial refill not enough", rate: 1, burst: 5, prior: 5, advance: 900 * time.Millisecond, n: 1, want: false},
		{name: "fast rate refills quickly", rate: 100, burst: 2, prior: 2, advance: 10 * time.Millisecond, n: 1, want: true},
		{name: "refill capped at burst", rate: 10, burst: 3, prior: 3, advance: time.Hour, n: 4, want: false},
		{name: "request larger than burst", rate: 10, burst: 3, n: 4, want: false},
		{name: "multi-token request fits", rate: 1, burst: 5, prior: 2, n: 3, want: true},
		{name: "multi-token request does not fit", rate: 1, burst: 5, prior: 3, n: 3, want: false},
		{name: "zero tokens always allowed", rate: 1, burst: 1, prior: 1, n: 0, want: true},
		{name: "zero rate never refills", rate: 0, burst: 1, prior: 1, advance: time.Hour, n: 1, want: false},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			clk := newFakeClock()
			l := New(tc.rate, tc.burst, WithClock(clk.Now))
			for i := 0; i < tc.prior; i++ {
				if !l.Allow("k") {
					t.Fatalf("prior request %d unexpectedly rejected", i)
				}
			}
			clk.Advance(tc.advance)
			if got := l.AllowN("k", tc.n); got != tc.want {
				t.Errorf("AllowN(%d) = %v, want %v", tc.n, got, tc.want)
			}
		})
	}
}

func TestLimiter(t *testing.T) {
	t.Run("keys are independent", func(t *testing.T) {
		clk := newFakeClock()
		l := New(1, 1, WithClock(clk.Now))
		if !l.Allow("a") {
			t.Fatal("first request for a rejected")
		}
		if l.Allow("a") {
			t.Fatal("second request for a admitted")
		}
		if !l.Allow("b") {
			t.Error("request for b rejected after a was exhausted")
		}
	})

	t.Run("retry after reflects missing tokens", func(t *testing.T) {
		clk := newFakeClock()
		l := New(4, 1, WithClock(clk.Now))
		if got := l.RetryAfter("a"); got != 0 {
			t.Fatalf("RetryAfter on full bucket = %v, want 0", got)
		}
		l.Allow("a")
		if got, want := l.RetryAfter("a"), 250*time.Millisecond; got != want {
			t.Errorf("RetryAfter = %v, want %v", got, want)
		}
		clk.Advance(100 * time.Millisecond)
		if got, want := l.RetryAfter("a"), 150*time.Millisecond; got != want {
			t.Errorf("RetryAfter after 100ms = %v, want %v", got, want)
		}
	})

	t.Run("reset restores full bucket", func(t *testing.T) {
		clk := newFakeClock()
		l := New(1, 3, WithClock(clk.Now))
		for i := 0; i < 3; i++ {
			l.Allow("a")
		}
		l.Reset("a")
		if got := l.Tokens("a"); got != 3 {
			t.Errorf("Tokens after Reset = %v, want 3", got)
		}
	})

	t.Run("clock going backwards does not add tokens", func(t *testing.T) {
		clk := newFakeClock()
		l := New(1, 2, WithClock(clk.Now))
		l.AllowN("a", 2)
		clk.Advance(-time.Minute)
		if l.Allow("a") {
			t.Error("request admitted after clock moved backwards")
		}
	})
}
