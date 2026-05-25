# Project ID for images as a query parameter

## Description

The project uses SSG, so there is no way to have a dynamic URL for images upload component.
Adjust code structure so in place of `/transcribe/[projectId]/images` there is a `/transcribe/images?projectId=[projectId]`.

## Relevant files

- `src/app/transcribe/[projectId]/images/page.tsx`
- `src/app/transcribe/[projectId]/images/page.module.css`
