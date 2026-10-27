// Package store persists limiter state to a file so that limits survive a
// restart.
package store

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"time"

	"github.com/nayefharb-hub/throttled/internal/bucket"
)

const formatVersion = 1

type file struct {
	Version int                     `json:"version"`
	SavedAt time.Time               `json:"saved_at"`
	Buckets map[string]bucket.State `json:"buckets"`
}

// Store reads and writes limiter snapshots at a fixed path.
type Store struct {
	path string
	now  func() time.Time
}

// Open returns a Store backed by path. The file need not exist yet.
func Open(path string) *Store {
	return &Store{path: path, now: time.Now}
}

// Path returns the backing file path.
func (s *Store) Path() string { return s.path }

// Load reads the stored snapshot. A missing file yields an empty snapshot.
func (s *Store) Load() (map[string]bucket.State, error) {
	data, err := os.ReadFile(s.path)
	if errors.Is(err, fs.ErrNotExist) {
		return map[string]bucket.State{}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("store: %w", err)
	}
	var f file
	if err := json.Unmarshal(data, &f); err != nil {
		return nil, fmt.Errorf("store: decode %s: %w", s.path, err)
	}
	if f.Version != formatVersion {
		return nil, fmt.Errorf("store: %s has version %d, want %d", s.path, f.Version, formatVersion)
	}
	if f.Buckets == nil {
		f.Buckets = map[string]bucket.State{}
	}
	return f.Buckets, nil
}

// Save writes snap atomically: it goes to a temporary file in the same
// directory which is then renamed over the target.
func (s *Store) Save(snap map[string]bucket.State) error {
	data, err := json.Marshal(file{Version: formatVersion, SavedAt: s.now().UTC(), Buckets: snap})
	if err != nil {
		return fmt.Errorf("store: %w", err)
	}
	tmp, err := os.CreateTemp(filepath.Dir(s.path), filepath.Base(s.path)+".*.tmp")
	if err != nil {
		return fmt.Errorf("store: %w", err)
	}
	defer os.Remove(tmp.Name())
	if _, err := tmp.Write(data); err != nil {
		tmp.Close()
		return fmt.Errorf("store: %w", err)
	}
	if err := tmp.Close(); err != nil {
		return fmt.Errorf("store: %w", err)
	}
	if err := os.Rename(tmp.Name(), s.path); err != nil {
		return fmt.Errorf("store: %w", err)
	}
	return nil
}
