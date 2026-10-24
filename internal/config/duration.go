package config

import (
	"encoding/json"
	"fmt"
	"time"
)

// Duration is a time.Duration that is written in config files as a Go
// duration string such as "5s" or "1m30s".
type Duration time.Duration

// UnmarshalJSON implements json.Unmarshaler.
func (d *Duration) UnmarshalJSON(b []byte) error {
	var s string
	if err := json.Unmarshal(b, &s); err != nil {
		return fmt.Errorf("duration must be a string like \"5s\": %w", err)
	}
	v, err := time.ParseDuration(s)
	if err != nil {
		return err
	}
	*d = Duration(v)
	return nil
}

// String returns the duration in Go syntax.
func (d Duration) String() string { return time.Duration(d).String() }
