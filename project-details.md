# Skin Capture Workspace

## Purpose

This `next-16` project is the new workspace for the skin image capture task.

It will be used to build:

1. image capture or upload
2. skin profile form
3. image enhancement actions
4. submission to a local API with persistence

## Reference Project

The `loreal-bg-removal` project in the same workspace is the functional reference for:

- image upload flow
- local background removal
- review and save patterns
- local API structure

## What Is Prepared

- modern Next.js 16 + Tailwind 4 base
- branded landing screen for the new task
- shared skin-profile constants and types in `lib/skin-profile.ts`
- reusable step card component in `components/step-card.tsx`

## Expected Next Build Steps

1. create the actual capture/upload component
2. build the form UI and state model
3. add enhancement preview actions
4. add local API route and persistence layer
5. connect submit success/error states
