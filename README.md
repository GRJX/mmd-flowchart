# MMD Flowchart Editor

A browser-based Mermaid flowchart editor with a React + TypeScript frontend.

> **Browser Compatibility:** Chrome / Chromium only.  
> The File System Access API used for folder management is not supported in Firefox or Safari.

---

## Development

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

## Production Build

```bash
npm run build
```

Static assets are output to `/dist`.

## Docker

Build and run the production image:

```bash
docker build -t mmd-flowchart-editor .
docker run -p 3000:80 mmd-flowchart-editor
```

Open `http://localhost:3000` in Chrome.

## Tech Stack

| Tool | Version |
|---|---|
| React | 18 |
| TypeScript | ~5.7 |
| Vite | ^6 |
| Tailwind CSS | ^3 |
| @xyflow/react | ^12 |
| Zustand | ^5 |
| Lucide React | ^0.511 |
| Mermaid | ^10.9.5 |
