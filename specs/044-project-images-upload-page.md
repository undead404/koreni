# Project images upload page

Create a `/transcribe/[projectId]/images` page, where `projectId` is a project ID.

## Description

The page must allow to upload many images to the project.

### UX

4 states:

- No images selected: a button to select images
- Some images selected: different controls to add, remove, and add more images
- Uploading: one button to cancel uploading, other controls disabled, progress shown image by image
- Success: all controls disabled, a link to start transcribing – to `/transcribe/[projectId]`

#### No images selected

Just a button to select images. Only JPEG images are allowed.

#### Some images selected

Tiles with images previews. Every tile must have a button to remove the image. When clicked, the image must be dimmed and the button must transform into an include button.

Select button stays – to select more images.

When selecting more than 100 images, the user must be asked to confirm, advised to split their document into smaller chunks.

There must be a button to start uploading images. It's disabled if all images are dimmed ("removed").

#### Uploading

A button to cancel uploading. Upload cancellation must be confirmed. If cancelled, revert to selection state.

#### Success

Everything disabled except the link to start transcribing – to `/transcribe/[projectId]`.

### API

The page must send a POST request to `/api/transcribe/upload` endpoint, with a `projectId` query parameter. The request must contain a file or an image.

## Relevant files

- `src/app/transcribe/[projectId]/images/page.tsx` (doesn't exist yet)
- `src/app/transcribe/[projectId]/images/page.module.css` (doesn't exist yet)
- `src/app/transcribe/services/api.ts`
- `src/server/src/app.ts`
- `src/server/src/handlers/handle-r2-upload.ts`
- `src/server/src/schemata.ts`
- `src/server/src/services/r2.ts`
