# Project create

## Pathname

Create a new component at `src/app/transcribe/create`.

## UX

Add form to create a new project.

The required schema is defined in `src/server/src/schemata.ts` – `projectCreatePayloadSchema`.

Fields:

- Title: text input, required
- ID: text input, required, unique across all projects
- isHandwritten: select (unset, handwritten, typed), required
- Location: coordinates of the settlement relevant to the project, required. May copy `src/app/components/contribute/spatial-input.tsx`
- Sources: URLs relevant to the project, required. May copy `src/app/components/contribute/sources-input.tsx`
- Table locale: select (unset, pl, ru, uk), required
- Years range: range of years relevant to the project, or a single year, required. May copy `src/app/components/contribute/years-input.tsx`

## Request

Send a POST request to `new URL('/api/transcribe/projects', environment.NEXT_PUBLIC_API_SITE)`.

### Request body

```http
POST /api/transcribe/projects HTTP/1.1
Host: localhost:4000
Content-Type: application/json

{
  "id": "test",
  "isHandwritten": true,
  "location": [0, 0],
  "sources": ["https://example/com/data"],
  "tableLocale": "pl",
  "title": "Test",
  "yearsRange": [1900, 2000]
}
```
