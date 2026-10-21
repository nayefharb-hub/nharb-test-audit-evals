// Command gen writes the default configuration as JSON. It is run by
// go generate to keep testdata/defaults.json and the documented example in
// step with Default.
package main

import (
	"encoding/json"
	"flag"
	"log"
	"os"

	"github.com/nayefharb-hub/throttled/internal/config"
)

func main() {
	out := flag.String("o", "", "output file (default stdout)")
	flag.Parse()

	data, err := json.MarshalIndent(config.Default(), "", "  ")
	if err != nil {
		log.Fatal(err)
	}
	data = append(data, '\n')
	if *out == "" {
		os.Stdout.Write(data)
		return
	}
	if err := os.WriteFile(*out, data, 0o644); err != nil {
		log.Fatal(err)
	}
}
