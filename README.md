# throttled

`throttled` is a small HTTP service that rate-limits clients with a token
bucket per client. It is meant to sit behind a load balancer or in front of
an internal API and shed traffic from clients that exceed their allowance.

## How limiting works

* Every client key gets its own bucket that holds up to `burst` tokens and
  starts full.
* Tokens are added continuously at `rate` tokens per second, never beyond
  `burst`.
* Each request takes one token. If no whole token is available the request
  is rejected with `429 Too Many Requests` and a `Retry-After` header giving
  the number of seconds (rounded up) until a token will be available.
* Every response carries `X-RateLimit-Limit` with the bucket size.

### Client keys

By default a client is identified by the IP address of the connection
(`RemoteAddr` without the port). With `trust_proxy` enabled, the first
entry of `X-Forwarded-For` is used instead when present. Only turn this on
when the service is behind a proxy that overwrites that header, otherwise
clients can pick their own key.

## Persistence

If `state_path` is set, bucket state is written there every
`flush_interval` and on shutdown, and loaded again at startup, so a restart
does not hand every client a fresh burst. The file is replaced atomically
(write to a temporary file, then rename). An empty `state_path` disables
persistence.

## Configuration

Configuration comes from built-in defaults, then an optional JSON file
(`-config path`), then environment variables.

| Key              | Env var                | Default           |
|------------------|------------------------|-------------------|
| `listen`         | `THROTTLED_LISTEN`     | `:8080`           |
| `rate`           | `THROTTLED_RATE`       | `10`              |
| `burst`          | `THROTTLED_BURST`      | `20`              |
| `trust_proxy`    |                        | `false`           |
| `state_path`     | `THROTTLED_STATE_PATH` | `throttled.state` |
| `flush_interval` |                        | `"5s"`            |

`flush_interval` is a Go duration string (`"500ms"`, `"1m"`). `rate` must
be positive.

Example:

```json
{
  "listen": "127.0.0.1:9000",
  "rate": 2.5,
  "burst": 5,
  "trust_proxy": true,
  "state_path": "/var/lib/throttled/state.json",
  "flush_interval": "10s"
}
```

## Development

```sh
go build ./cmd/throttled
go test ./...
```

`internal/config/testdata/defaults.json` is generated from `config.Default`;
run `go generate ./internal/config` after changing the defaults.

The end-to-end restart test needs the `integration` tag:

```sh
go test -tags integration ./internal/store
```

## Layout

```
cmd/throttled         server entrypoint
internal/bucket       token bucket limiter
internal/config       config loading and validation
internal/middleware   HTTP middleware
internal/store        state persistence
```
