# Koreni

A project aimed to provide full-text search through ambiguous indexations of Ukrainian genealogical documents collected from volunteers.

## Development setup

### Prerequisites

1. NodeJS 22
2. Yarn
3. Docker

The easiest way is to setup Typesense with Docker. Run this:

```sh
yarn
yarn docker:typesense:start
yarn typesense:populate # This takes substantial time
yarn dev
```

## Production setup

Use scripts from scripts/prepare-server folder.
