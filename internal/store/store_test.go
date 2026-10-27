package store

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/nayefharb-hub/throttled/internal/bucket"
)

var seedPath = filepath.Join("testdata", "seed.json")

func TestMain(m *testing.M) {
	// Write a known snapshot for TestLoadSeed so it always starts from the
	// current file format.
	seed := Open(seedPath)
	err := seed.Save(map[string]bucket.State{
		"192.0.2.1": {Tokens: 3, Last: time.Date(2024, 3, 1, 12, 0, 0, 0, time.UTC)},
		"192.0.2.2": {Tokens: 0.5, Last: time.Date(2024, 3, 1, 12, 0, 1, 0, time.UTC)},
	})
	if err != nil {
		panic(err)
	}
	os.Exit(m.Run())
}

func TestLoadSeed(t *testing.T) {
	snap, err := Open(seedPath).Load()
	if err != nil {
		t.Fatal(err)
	}
	if len(snap) != 2 {
		t.Fatalf("got %d buckets, want 2", len(snap))
	}
	if got := snap["192.0.2.2"].Tokens; got != 0.5 {
		t.Errorf("tokens for 192.0.2.2 = %v, want 0.5", got)
	}
}

func TestSaveLoadRoundTrip(t *testing.T) {
	s := Open(filepath.Join(t.TempDir(), "state.json"))
	want := map[string]bucket.State{
		"a": {Tokens: 1.25, Last: time.Date(2024, 1, 2, 3, 4, 5, 0, time.UTC)},
	}
	if err := s.Save(want); err != nil {
		t.Fatal(err)
	}
	got, err := s.Load()
	if err != nil {
		t.Fatal(err)
	}
	if len(got) != 1 || got["a"].Tokens != 1.25 || !got["a"].Last.Equal(want["a"].Last) {
		t.Errorf("Load = %+v, want %+v", got, want)
	}
}

func TestLoadMissingFile(t *testing.T) {
	snap, err := Open(filepath.Join(t.TempDir(), "nope.json")).Load()
	if err != nil {
		t.Fatal(err)
	}
	if len(snap) != 0 {
		t.Errorf("got %d buckets from missing file", len(snap))
	}
}

func TestLoadRejectsUnknownVersion(t *testing.T) {
	path := filepath.Join(t.TempDir(), "state.json")
	if err := os.WriteFile(path, []byte(`{"version": 7, "buckets": {}}`), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := Open(path).Load(); err == nil {
		t.Error("Load accepted version 7")
	}
}

func TestSaveLeavesNoTempFiles(t *testing.T) {
	dir := t.TempDir()
	s := Open(filepath.Join(dir, "state.json"))
	for i := 0; i < 3; i++ {
		if err := s.Save(map[string]bucket.State{"k": {Tokens: float64(i)}}); err != nil {
			t.Fatal(err)
		}
	}
	entries, err := os.ReadDir(dir)
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) != 1 {
		var names []string
		for _, e := range entries {
			names = append(names, e.Name())
		}
		t.Errorf("directory contains %v, want only state.json", names)
	}
}
