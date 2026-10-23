// Command throttled runs a rate-limited HTTP service.
package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"

	"github.com/nayefharb-hub/throttled/internal/bucket"
	"github.com/nayefharb-hub/throttled/internal/config"
	"github.com/nayefharb-hub/throttled/internal/middleware"
)

func main() {
	configPath := flag.String("config", "", "path to JSON config file")
	flag.Parse()

	cfg, err := config.Load(*configPath)
	if err != nil {
		log.Fatal(err)
	}

	limiter := bucket.New(cfg.Rate, cfg.Burst)
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "ok")
	})
	handler := middleware.RateLimit(limiter, middleware.Options{TrustProxy: cfg.TrustProxy}, mux)

	log.Printf("listening on %s (rate=%v/s burst=%d)", cfg.Listen, cfg.Rate, cfg.Burst)
	log.Fatal(http.ListenAndServe(cfg.Listen, handler))
}
