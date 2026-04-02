# Skin Capture Studio

`Skin Capture Studio` is a local-first Next.js app for capturing a palm/skin image, collecting a short skin profile, enhancing the image, and saving the consultation record.

The app includes:
- guided 4-step intake flow
- background removal and text overlay
- local API routes in Next.js
- SQLite persistence with Prisma
- gallery view for saved consultations

## Workflow

1. Upload or capture an image.
2. Fill the required skin profile fields.
3. Enhance the image with background removal and optional text overlay.
4. Submit the consultation and review it in the gallery.

## Getting Started


Run the project from the root folder(skin-capture).

### Prerequisite: Node.js

Make sure you have **Node.js (v18 or later)** installed. You can check by running:

```bash
node --version
```

If you see a version number, you're good to go. If not, [download Node.js](https://nodejs.org/) or install it using your system's package manager (e.g., `sudo apt install nodejs npm` on Ubuntu).

1. Install dependencies:

```bash
npm install
```

2. Sync the Prisma schema to the local SQLite database:

```bash
npx prisma db push
```

3. Start the development server:

```bash
npm run dev
```

4. Open the app:

```bash
http://localhost:3000
```

## Tech Stack

- `Next.js 16` with App Router
- `React 19`
- `Tailwind CSS 4`
- `Prisma`
- `SQLite`
- `better-sqlite3`
- `@imgly/background-removal-node`
- `sharp`

## How Data Is Stored

The app stores data in two places:

- Images are stored as files under:
  - `public/submissions/originals/`
  - `public/submissions/enhanced/`
- Form data and file paths are stored in SQLite:
  - `prisma/dev.db`

The database stores metadata only, not raw image blobs.

## Main App Areas

- Intake flow: [`app/page.tsx`](./app/page.tsx)
- Main intake UI: [`components/skin-capture-studio.tsx`](./components/skin-capture-studio.tsx)
- Gallery: [`app/gallery/page.tsx`](./app/gallery/page.tsx)
- Enhance API: [`app/api/enhance/route.ts`](./app/api/enhance/route.ts)
- Submission API: [`app/api/submissions/route.ts`](./app/api/submissions/route.ts)
- Delete API: [`app/api/submissions/[id]/route.ts`](./app/api/submissions/[id]/route.ts)
- Image processing: [`lib/image-processing.ts`](./lib/image-processing.ts)
- Prisma schema: [`prisma/schema.prisma`](./prisma/schema.prisma)

## Project Hierarchy

```text
skin-capture/
├── app/
│   ├── api/
│   │   ├── enhance/route.ts
│   │   └── submissions/
│   │       ├── route.ts
│   │       └── [id]/route.ts
│   ├── gallery/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── icon.svg
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── feedback-ui.tsx
│   ├── header-nav.tsx
│   ├── skin-capture-studio.tsx
│   ├── submission-card.tsx
│   └── submission-filter-bar.tsx
├── lib/
│   ├── db.ts
│   ├── image-processing.ts
│   ├── skin-profile.ts
│   └── types/
│       ├── api.ts
│       ├── submission.ts
│       └── ui.ts
├── prisma/
│   ├── dev.db
│   └── schema.prisma
├── public/
│   └── submissions/
│       ├── enhanced/
│       └── originals/
├── next.config.ts
├── package.json
├── prisma.config.ts
└── README.md
```

## Build

Run a production build:

```bash
npm run build
```

If you hit a `better-sqlite3` / `NODE_MODULE_VERSION` error after switching Node versions, rebuild the native module:

```bash
npm rebuild better-sqlite3
```

If that still fails, do a clean reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

## View the Database

You can inspect the local SQLite DB with Prisma Studio:

```bash
npx prisma studio
```

Or with SQLite CLI:

```bash
sqlite3 prisma/dev.db
```

## Notes

- The enhancer uses `@imgly/background-removal-node` and applies a fallback padded pass for difficult close-capture cases.
- Enhanced previews are returned to the client as Base64 during the preview step, then saved as files on submit.
- The gallery is the user-facing view of saved consultations; Prisma Studio is the easiest admin-style DB viewer.
