# Koreni API integration

This directory contains the server-side code for handling data import API requests, both from the public submission form and from authenticated external applications.

## How to use the API

### Import dependency readiness

`GET /api/ready` checks GitHub connectivity and read access using the configured
`GITHUB_TOKEN` to read `heads/main` in `GITHUB_REPO`, the base branch used by CSV
submissions. It makes no writes and requires no API key (normal API rate limits apply).

It returns HTTP `200` with `{"status":"ok","checks":{"github":"ok"}}`, or HTTP
`503` with `{"status":"unavailable","checks":{"github":"unavailable"}}` when
GitHub rejects the credential, the repository/branch is inaccessible, GitHub is
rate limited, the response is invalid, or the request fails or exceeds five seconds.
Results (including failures) are cached in each server process for 30 seconds;
concurrent probes share one request. Responses use `Cache-Control: no-store`.

This is a read-only dependency check, not a write dry run: success does not
guarantee permission to create commits, branches, or pull requests, nor validate
a particular CSV. `/api/health` retains its existing behavior.

### Submitting data

First, you must acquire an API key. Drop us a line at [admin@koreni.org.ua](mailto:admin@koreni.org.ua).

Then, you can submit your indexation data to the API like this (see comments):

```sh
curl -X POST https://koreni.org.ua/api/submit \
  -H "x-api-key: %YOUR_API_KEY%" \
  -H "Content-Type: application/json" \
  -d '{
    "archiveItems": ["ДАКО-1-1-1", "ДАКО-1-1-2"],
    "author": "John Doe <john.doe@example.com>",
    "date": "2024-06-01T12:00:00Z",
    "id": "DAKO-1-1-Ivanivka",
    "tableFilename": "ivanivka.csv", # You can make this up, just make it filename-like
    "location": [50.4501, 30.5234], # Coordinates of the settlement your data is about. If it concerns the whole district, provide coordinates of the district center.
    "records": [
      {"year": 1990, "value": 100},
      {"year": 2000, "value": 150},
      {"year": 2010, "value": 200},
      {"year": 2020, "value": 250}
    ],
    "sources": ["https://example.com/source1", "https://example.com/source2"],
    "title": "Sample Data Submission",
    "tableLocale": "pl", # Possible values: "pl", "ru", "ua"
    "yearsRange": [1990, 2020] # Either 1 or 2 numbers. If 1 number, all records are assumed to be from that year. If 2 numbers, they are assumed to be the start and end of the range of years covered by the records.
    }'
```

Max payload size is 60 kB. It is limited by Github Actions dispatching constraints.
