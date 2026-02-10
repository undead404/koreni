# Koreni

A project aimed to provide full-text search through ambiguous indexations of Ukrainian genealogical documents collected from volunteers.

For data integration see [API docs](./src/server/README.md).

## License

Koreni's [data folder](./data) is licensed under [ODbL license](./LICENSE.md).

All other contents (the code and everything else) in this repository is licensed under the [MIT license](./LICENSE-CODE.txt).

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

## Clean repo

```sh
yarn artifacts:clean
yarn cache clean
```
