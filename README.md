# Koreni

A project aimed to provide full-text search through ambiguous indexations of Ukrainian genealogical documents collected from volunteers.

## Getting Started

### Prerequisites

- Node.js
- copy `.env.example` into `.env`

### Typesense setup

#### Run a local server

- using docker:
  ```sh
  ./scripts/prepare-server/setup-typesense-via-docker.sh
  ```
- or as a DEB package:
  ```sh
  ./scripts/prepare-server/setup-typesense.sh
  ```

[_Read more._](https://typesense.org/docs/guide/install-typesense.html#option-2-local-machine-self-hosting)

> Be aware of using `xyz` as a TYPESENSE_BOOTSTRAP_KEY

#### Get keys

1. Run `./scripts/prepare-server/create-admin-key.sh` and copy a `value` from a response into `.env`'s `TYPESENSE_ADMIN_KEY`
2. Run `./scripts/prepare-server/create-search-key.sh` and copy a `value` from a response into `.env`'s `NEXT_PUBLIC_TYPESENSE_SEARCH_KEY`

### BugSnag setup

To not use BugSnag, comment `NEXT_PUBLIC_BUGSNAG_API_KEY=` in `.env` file.

// TODO add more information

### Start a project

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
