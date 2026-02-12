# PolySynth Web Demo

This repository now serves the GitHub Pages experience for **PolySynth** with two goals:

1. Keep the latest iPlug2 web build embedded at the top of the page.
2. Keep a companion section for rendered audio examples (`.wav`) so listeners can compare patches and changes over time.

## Local development

```bash
npm install
npm run dev
```

Run tests and production build:

```bash
npm test
npm run build:web-demo
npm run build
```

## How the GitHub Pages pipeline works

The deploy workflow (`.github/workflows/deploy.yml`) publishes on every push to `main`.

Before `vite build`, it runs:

```bash
npm run build:web-demo
```

That script (`scripts/prepare-web-demo.mjs`) can execute an iPlug2 build command and copy generated files into `public/web/PolySynth/`.

Set these repository **variables** in GitHub Settings → Secrets and variables → Actions:

- `IPLUG2_WEB_BUILD_COMMAND`: command that builds the iPlug2 web target.
- `IPLUG2_WEB_BUILD_OUTPUT`: folder path (relative to repo root) containing the built web bundle.

If those variables are not set, the committed placeholder web demo stays in place.

## Audio render gallery

- Put rendered `.wav` files in `public/renders/`.
- Register them in `public/renders/renders-manifest.json`.

Example manifest entry:

```json
{
  "tracks": [
    {
      "name": "Factory Bass Sweep",
      "file": "factory-bass-sweep.wav",
      "description": "PolySynth patch with medium resonance",
      "durationSeconds": 18
    }
  ]
}
```
