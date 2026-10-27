//go:build integration

package store_test

import (
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"
	"time"

	"github.com/nayefharb-hub/throttled/internal/bucket"
	"github.com/nayefharb-hub/throttled/internal/middleware"
	"github.com/nayefharb-hub/throttled/internal/store"
)

// TestLimitsSurviveRestart runs the full stack against a real listener,
// exhausts a client's bucket, persists state, and checks that a freshly
// started server restored from disk still rejects that client while
// admitting others.
func TestLimitsSurviveRestart(t *testing.T) {
	now := time.Date(2024, 3, 1, 12, 0, 0, 0, time.UTC)
	clock := func() time.Time { return now }
	st := store.Open(filepath.Join(t.TempDir(), "state.json"))

	ok := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})
	start := func() (*bucket.Limiter, *httptest.Server) {
		l := bucket.New(1, 2, bucket.WithClock(clock))
		snap, err := st.Load()
		if err != nil {
			t.Fatal(err)
		}
		l.Restore(snap)
		opts := middleware.Options{TrustProxy: true}
		return l, httptest.NewServer(middleware.RateLimit(l, opts, ok))
	}
	get := func(srv *httptest.Server, client string) int {
		req, _ := http.NewRequest(http.MethodGet, srv.URL, nil)
		req.Header.Set("X-Forwarded-For", client)
		resp, err := srv.Client().Do(req)
		if err != nil {
			t.Fatal(err)
		}
		resp.Body.Close()
		return resp.StatusCode
	}

	l, srv := start()
	for i := 0; i < 2; i++ {
		if code := get(srv, "203.0.113.5"); code != http.StatusOK {
			t.Fatalf("request %d before restart: %d", i, code)
		}
	}
	if code := get(srv, "203.0.113.5"); code != http.StatusTooManyRequests {
		t.Fatalf("over-limit request before restart: %d", code)
	}
	if err := st.Save(l.Snapshot()); err != nil {
		t.Fatal(err)
	}
	srv.Close()

	_, srv = start()
	defer srv.Close()
	if code := get(srv, "203.0.113.5"); code != http.StatusTooManyRequests {
		t.Errorf("exhausted client after restart: %d, want 429", code)
	}
	if code := get(srv, "203.0.113.6"); code != http.StatusOK {
		t.Errorf("new client after restart: %d, want 200", code)
	}
}
