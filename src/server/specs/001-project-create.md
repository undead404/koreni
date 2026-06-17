# Project create

## POST /api/transcribe/projects

### Request

```http
POST /api/transcribe/projects HTTP/1.1
Host: localhost:4000
Content-Type: application/json

{
  "authorEmail": "test@example.com",
  "authorGithubUsername": "test",
  "authorName": "Test",
  "id": "test",
  "isHandwritten": true,
  "location": [0, 0],
  "sources": ["source1", "source2"],
  "tableLocale": "pl",
  "title": "Test",
  "yearsRange": [1900, 2000]
}
```

Fields:

- id: unique identifier of the project (unique across all projects)
- isHandwritten: whether the transcribed document is handwritten or typed
- location: coordinates of the settlement relevant to the project
- sources: URLs relevant to the project
- tableLocale: language of the table (pl, ru, uk)
- title: title of the project
- yearsRange: range of years relevant to the project, or a single year

### Processing

Use `src/server/node_modules/kysely-codegen/dist/db.d.ts` to learn database types.

1. Create a database file `src/server/src/database/create-project.ts`, saving the project data to the database.
2. Create a request schema in `src/server/src/schemata.ts` – `projectCreatePayloadSchema`.
3. Create an endpoint handler - `src/server/src/handlers/handle-transcribe-project-create.ts`, calling the saving function.
4. Assign the endpoint to the route in `src/server/src/app.ts`; use `POST` request to `/api/transcribe/projects`.
5. Make sure the endpoint is protected by the `transcribeAuthMiddleware` middleware.
6. Make sure the endpoint responds with all errors from Zod validation.
7. Make sure the endpoint responds with a 409 error if the submitted ID in `id` field is already in use.

### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "projects": [
    {
      "created_at": "2023-07-11T14:00:00.000Z",
      "id": "test",
      "title": "Test"
    }
  ]
}
```
