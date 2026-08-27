# R2 upload

Create an endpoint to upload a JPEG image to the Cloudflare R2 bucket, in its `/temp/${projectId}` directory. `projectId` value must be passed from the client.

## Relevant files

- `src/server/src/handlers/handle-r2-upload.ts`
- `src/server/src/app.ts`

## Technical requirements

The endpoint must use `src/server/src/middlewares/transcribe-auth.ts` middleware to check that the user is authenticated.
