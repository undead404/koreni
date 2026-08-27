# Image upload changes

Now image upload is handled by `PUT` request to `'/api/projects/:projectId/images/:imageId'`. Its code is defined in `src/server/src/handlers/handle-project-image.ts`.

Change `src/app/transcribe/images/page.tsx` accordingly. Fill (and calculate) `pageSequence` and `blurhash` fields, alongside with `file`.
