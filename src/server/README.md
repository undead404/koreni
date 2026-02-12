# Koreni API integration

This directory contains the server-side code for handling data import API requests, both from the public submission form and from authenticated external applications.

## How to use the API

First, you must acquire an API key. Drop us a line at [brute18@gmail.com](mailto:brute18@gmail.com).

Then, you can submit your indexation data to the API like this (see comments):

```sh
curl -X POST https://your-api-endpoint.com/api/submit \
  -H "X-Api-Key: your-api-key-here" \
  -F "file=@file.csv" \
  -F 'metadata={"archiveItems":["ДАКО-1-1-1","ДАКО-2-2-2"],"author":"Test Author <test@example.com>","date":"2024-01-01","id":"test-table-001","location":[55.75,37.62],"sources":["https://example.com/source1","https://example.com/source2"],"tableLocale":"ru","title":"Test Data Import","yearsRange":[2020,2021]}'
```

Required fields

- `file`: the CSV file containing the data to be imported
- `metadata`: a JSON object containing the metadata for the import

## How to run the server locally

1. `cd` into the `src/server` directory
2. Install dependencies with `yarn install`
3. Run the server with `yarn dev`

The server will start on port 4000 by default.
