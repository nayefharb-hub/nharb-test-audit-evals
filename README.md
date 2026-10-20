# throttled

A small HTTP rate limiter. Clients are identified by address and each one
gets a token bucket; requests over the limit get `429 Too Many Requests`.

Work in progress.
