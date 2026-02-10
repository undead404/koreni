#!/bin/bash

curl -X POST http://localhost:4000/api/submit \
  -H "x-api-key: %YOUR_API_KEY%" \
  -H "Content-Type: application/json" \
  -d '{
    "archiveItems": ["ДАКО-1-1-1", "ДАКО-1-1-2"],
    "author": "John Doe <john.doe@example.com>",
    "date": "2024-06-01T12:00:00Z",
    "id": "DAKO-1-1-Ivanivka",
    "tableFilename": "ivanivka.csv",
    "location": [50.4501, 30.5234],
    "records": [
      {"year": 1990, "value": 100},
      {"year": 2000, "value": 150},
      {"year": 2010, "value": 200},
      {"year": 2020, "value": 250}
    ],
    "sources": ["https://example.com/source1", "https://example.com/source2"],
    "title": "Sample Data Submission",
    "tableLocale": "pl",
    "yearsRange": [1990, 2020]
    }'
