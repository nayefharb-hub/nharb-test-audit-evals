// Package config loads service configuration from a JSON file and the
// environment.
package config

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strconv"
	"time"
)

//go:generate go run ./gen -o testdata/defaults.json

// Config is the service configuration.
type Config struct {
	// Listen is the address the HTTP server binds to.
	Listen string `json:"listen"`
	// Rate is the number of tokens added to each bucket per second.
	Rate float64 `json:"rate"`
	// Burst is the bucket capacity.
	Burst int `json:"burst"`
	// TrustProxy makes the middleware key clients by X-Forwarded-For.
	TrustProxy bool `json:"trust_proxy"`
	// StatePath is where bucket state is persisted. Empty disables it.
	StatePath string `json:"state_path"`
	// FlushInterval is how often state is written to StatePath.
	FlushInterval Duration `json:"flush_interval"`
}

// Default returns the built-in configuration.
func Default() Config {
	return Config{
		Listen:        ":8080",
		Rate:          10,
		Burst:         20,
		StatePath:     "throttled.state",
		FlushInterval: Duration(5 * time.Second),
	}
}

// Load reads the file at path on top of Default and then applies
// environment overrides. An empty path skips the file.
func Load(path string) (Config, error) {
	cfg := Default()
	if path != "" {
		data, err := os.ReadFile(path)
		if err != nil {
			return Config{}, fmt.Errorf("config: %w", err)
		}
		if err := json.Unmarshal(data, &cfg); err != nil {
			return Config{}, fmt.Errorf("config: parse %s: %w", path, err)
		}
	}
	if err := applyEnv(&cfg); err != nil {
		return Config{}, err
	}
	return cfg, cfg.Validate()
}

func applyEnv(cfg *Config) error {
	if v, ok := os.LookupEnv("THROTTLED_LISTEN"); ok {
		cfg.Listen = v
	}
	if v, ok := os.LookupEnv("THROTTLED_RATE"); ok {
		f, err := strconv.ParseFloat(v, 64)
		if err != nil {
			return fmt.Errorf("config: THROTTLED_RATE: %w", err)
		}
		cfg.Rate = f
	}
	if v, ok := os.LookupEnv("THROTTLED_BURST"); ok {
		n, err := strconv.Atoi(v)
		if err != nil {
			return fmt.Errorf("config: THROTTLED_BURST: %w", err)
		}
		cfg.Burst = n
	}
	if v, ok := os.LookupEnv("THROTTLED_STATE_PATH"); ok {
		cfg.StatePath = v
	}
	return nil
}

// Validate reports the first problem with cfg, if any.
func (c Config) Validate() error {
	if c.Listen == "" {
		return errors.New("config: listen address is required")
	}
	if c.Rate <= 0 {
		return fmt.Errorf("config: rate must be positive, got %v", c.Rate)
	}
	if c.FlushInterval < 0 {
		return fmt.Errorf("config: flush_interval must not be negative, got %v", c.FlushInterval)
	}
	return nil
}
