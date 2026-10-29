package bucket

import (
	"sync"
	"sync/atomic"
	"testing"
)

func TestConcurrentAllowDoesNotOverAdmit(t *testing.T) {
	const (
		burst      = 50
		workers    = 16
		perWorker  = 20
		totalCalls = workers * perWorker
	)
	clk := newFakeClock()
	l := New(1, burst, WithClock(clk.Now))

	var admitted int64
	var wg sync.WaitGroup
	for w := 0; w < workers; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for i := 0; i < perWorker; i++ {
				if l.Allow("shared") {
					atomic.AddInt64(&admitted, 1)
				}
			}
		}()
	}
	wg.Wait()

	if admitted > totalCalls {
		t.Errorf("admitted %d requests, limit is %d", admitted, totalCalls)
	}
}

func TestSnapshotRestore(t *testing.T) {
	clk := newFakeClock()
	l := New(1, 4, WithClock(clk.Now))
	l.AllowN("a", 3)
	snap := l.Snapshot()

	r := New(1, 2, WithClock(clk.Now))
	r.Restore(map[string]State{"a": snap["a"], "b": {Tokens: 9, Last: clk.Now()}})
	if got := r.Tokens("a"); got != 1 {
		t.Errorf("restored tokens for a = %v, want 1", got)
	}
	if got := r.Tokens("b"); got != 2 {
		t.Errorf("restored tokens for b = %v, want clamped to 2", got)
	}
}
