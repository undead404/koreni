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

```sh
yarn
yarn docker:typesense:start # If you want to use TypeSense search
yarn typesense:populate # This takes substantial time
cd ./src/server && yarn db:init && cd ../..
cp ./.env.example ./.env
cp ./src/server/.env.example ./src/server/.env
```

In `./src/server/.env`, you need to set a strong JWT_SECRET value. To generate it, you can use this command:

```sh
# Source - https://stackoverflow.com/a/74481179
# Retrieved 2026-05-30, License - CC BY-SA 4.0
node -e "console.log(require('crypto').randomBytes(32).toString('hex'));"
```

To set `NEXT_PUBLIC_OAUTH_CLIENT_ID` in `./.env` and `OAUTH_CLIENT_ID` in `./src/server/.env`, ask the maintainer - @undead404.

Then, to run the app:

```sh
yarn dev
```

If you want to work with data contribution and-or transcription, run in another terminal:

```sh
yarn dev:server
```

## Production setup

Use scripts from `./scripts/prepare-server` folder.

## Clean repo

```sh
yarn artifacts:clean
yarn cache clean
```
