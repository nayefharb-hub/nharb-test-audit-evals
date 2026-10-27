// Command throttled runs a rate-limited HTTP service.
package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/nayefharb-hub/throttled/internal/bucket"
	"github.com/nayefharb-hub/throttled/internal/config"
	"github.com/nayefharb-hub/throttled/internal/middleware"
	"github.com/nayefharb-hub/throttled/internal/store"
)

func main() {
	configPath := flag.String("config", "", "path to JSON config file")
	flag.Parse()

	cfg, err := config.Load(*configPath)
	if err != nil {
		log.Fatal(err)
	}

	limiter := bucket.New(cfg.Rate, cfg.Burst)

	var st *store.Store
	if cfg.StatePath != "" {
		st = store.Open(cfg.StatePath)
		snap, err := st.Load()
		if err != nil {
			log.Fatal(err)
		}
		limiter.Restore(snap)
		log.Printf("restored %d buckets from %s", len(snap), cfg.StatePath)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "ok")
	})
	srv := &http.Server{
		Addr:    cfg.Listen,
		Handler: middleware.RateLimit(limiter, middleware.Options{TrustProxy: cfg.TrustProxy}, mux),
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	if st != nil && cfg.FlushInterval > 0 {
		go flushLoop(ctx, st, limiter, time.Duration(cfg.FlushInterval))
	}

	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		srv.Shutdown(shutdownCtx)
	}()

	log.Printf("listening on %s (rate=%v/s burst=%d)", cfg.Listen, cfg.Rate, cfg.Burst)
	if err := srv.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
	if st != nil {
		if err := st.Save(limiter.Snapshot()); err != nil {
			log.Printf("final flush: %v", err)
		}
	}
}

func flushLoop(ctx context.Context, st *store.Store, l *bucket.Limiter, every time.Duration) {
	t := time.NewTicker(every)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			if err := st.Save(l.Snapshot()); err != nil {
				log.Printf("flush: %v", err)
			}
		}
	}
}
