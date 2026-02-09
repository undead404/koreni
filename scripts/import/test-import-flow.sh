#!/usr/bin/env bash

source .env

# Ваші дані
GITHUB_USER="undead404"
REPO_NAME="koreni"

# Генерація JSON з даними (щоб не екранувати лапки вручну)
cat <<EOF > test_payload.json
{
  "event_type": "import_data",
  "client_payload": {
    "title": "E2E Test Table",
    "yearsRange": [1920],
    "location": [49, 31],
    "author": "Tester <test@koreni.org.ua>",
    "archiveItems": ["ДАКО-1-1-1"],
    "sources": ["https://example.com/source"],
    "records": [
      { "Name": "Test1", "Year": 1920 },
      { "Name": "Test2", "Year": 1921 }
    ],
    "date": "2024-06-01T12:00:00Z",
    "id": "test-import-$(date +%s)",
    "tableLocale": "pl"
  }
}
EOF

# Відправка запиту
curl -L \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $IMPORT_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/$GITHUB_USER/$REPO_NAME/dispatches \
  -d @test_payload.json