package config

import (
	"path/filepath"
	"testing"
)

func TestLoadFile(t *testing.T) {
	cfg, err := Load(filepath.Join("testdata", "custom.json"))
	if err != nil {
		t.Fatal(err)
	}
	want := Default()
	want.Listen = "127.0.0.1:9000"
	want.Rate = 2.5
	want.Burst = 5
	want.TrustProxy = true
	if cfg != want {
		t.Errorf("Load = %+v\nwant %+v", cfg, want)
	}
}

func TestLoadEnvOverridesFile(t *testing.T) {
	t.Setenv("THROTTLED_RATE", "40")
	t.Setenv("THROTTLED_BURST", "80")
	t.Setenv("THROTTLED_STATE_PATH", "")

	cfg, err := Load(filepath.Join("testdata", "custom.json"))
	if err != nil {
		t.Fatal(err)
	}
	if cfg.Rate != 40 || cfg.Burst != 80 {
		t.Errorf("rate, burst = %v, %v; want 40, 80", cfg.Rate, cfg.Burst)
	}
	if cfg.StatePath != "" {
		t.Errorf("StatePath = %q, want empty", cfg.StatePath)
	}
	if cfg.Listen != "127.0.0.1:9000" {
		t.Errorf("Listen = %q, want value from file", cfg.Listen)
	}
}

func TestLoadErrors(t *testing.T) {
	if _, err := Load(filepath.Join("testdata", "missing.json")); err == nil {
		t.Error("Load of missing file succeeded")
	}
	if _, err := Load(filepath.Join("testdata", "bad.json")); err == nil {
		t.Error("Load of malformed file succeeded")
	}
	t.Setenv("THROTTLED_BURST", "lots")
	if _, err := Load(""); err == nil {
		t.Error("Load with non-numeric THROTTLED_BURST succeeded")
	}
}

func TestDefaultsFileRoundTrip(t *testing.T) {
	// testdata/defaults.json is produced by `go generate` from Default, so
	// loading it must give back exactly the defaults.
	cfg, err := Load(filepath.Join("testdata", "defaults.json"))
	if err != nil {
		t.Fatal(err)
	}
	if cfg != Default() {
		t.Errorf("Load(defaults.json) = %+v\nwant %+v", cfg, Default())
	}
}

func TestValidate(t *testing.T) {
	tests := []struct {
		name   string
		modify func(*Config)
	}{
		{"empty listen", func(c *Config) { c.Listen = "" }},
		{"zero rate", func(c *Config) { c.Rate = 0 }},
		{"negative rate", func(c *Config) { c.Rate = -1 }},
		{"zero burst", func(c *Config) { c.Burst = 0 }},
		{"negative flush interval", func(c *Config) { c.FlushInterval = "-1s" }},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			cfg := Default()
			tc.modify(&cfg)
			if err := cfg.Validate(); err == nil {
				t.Errorf("Validate accepted %+v", cfg)
			}
		})
	}
}
