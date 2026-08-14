# Rate limits

| Tier | Per minute | Per month |
| --- | ---: | ---: |
| Anonymous | 120 | Unmetered |
| Free key | 120 | 100,000 |
| Pro key | 1,200 | Unmetered |

Every response reports the current state:

```http
x-ratelimit-limit: 120
x-ratelimit-remaining: 119
x-ratelimit-reset: 1786692648
```

## These are ceilings, not guarantees

**Counting happens in each serverless instance's memory, and requests spread
across instances.** A burst can therefore exceed the stated number before any
single instance notices.

Treat the figures above as the level below which you will certainly not be
limited, rather than the exact point at which you will be. **Build against the
headers and the 429, not against the number** — a global counter is the planned
upgrade, and when it lands the ceiling will start biting exactly where it says.

This is stated plainly because the alternative is publishing a precise-looking
number that does not hold, and then having someone build retry logic on it.

## Being limited

```json
{
  "error": {
    "code": "rate_limited",
    "message": "Rate limit of 120 requests per minute exceeded. Retry in 34s.",
    "retryAfterSeconds": 34,
    "limit": 120
  }
}
```

The response also carries the standard `Retry-After` header, so most HTTP
libraries can back off correctly without parsing the body.

## Buckets

Anonymous callers are bucketed **by IP address**, so everyone behind one
corporate NAT shares a budget. A presented API key gets **its own bucket** — that
is the half of a key's value people forget. It is not only a higher ceiling; it
is a ceiling that nobody else is eating into.

## Being a good citizen

The API is free and there is no commercial pressure to throttle you. A few
things that keep it that way:

- **Cache reference data.** `/api/v1/states` and `/api/v1/assumptions` change a
  few times a year, not a few times a minute.
- **Use the datasets for bulk work.** Downloading [the CSV](datasets.md) once
  beats fifty calls to `/api/v1/states/{state}`.
- **Do not poll for changes.** `/api/v1/assumptions` carries the year each figure
  applies to; check it daily at most. There is a
  [GitHub Actions example](../examples/github-actions/watch-assumptions.yml) that
  does exactly this.
- **Back off on 429 rather than retrying immediately.** Retrying in a tight loop
  is the one behaviour that would force a stricter limit on everyone.

If you need materially more throughput than a pro key allows, get in touch
before building around it — devscriptify@gmail.com.
