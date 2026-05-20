# JSON Beauty

A privacy-first Angular app for formatting, validating, comparing, and converting JSON — entirely in the browser.

## Overview

JSON Beauty is a client-side JSON toolkit for developers and analysts. Paste messy API responses, beautify them in a split workspace, explore structure with a tree view, run JSONPath queries, diff versions, and export to other formats — without sending data to a server.

**Live workflow:** landing page at `/` → main editor at `/editor`.

## Features

| Area | Capabilities |
|------|----------------|
| **Editing** | Dual-panel workspace (input + output), Ace editor with syntax highlighting, code folding, and configurable indentation |
| **Formatting** | Beautify, minify, and lint/fix JSON; relaxed JSON5 input (trailing commas, comments, single quotes) normalized to strict JSON |
| **Validation** | Inline syntax errors; JSON Schema validation; schema generation from sample JSON |
| **Exploration** | Tree/outline navigation, table view, JSONPath query and extraction, pagination for large documents |
| **Comparison** | Structured diff between JSON documents; version history for undo/redo across edits |
| **Conversion** | JSON ↔ YAML, JSON → CSV, JSON → XML, XML → JSON, JSON5 → JSON |
| **Search** | Find bar and regex-aware search & replace across panels |
| **Sharing** | Compress payloads into shareable URLs that open directly in the editor |
| **Visualization** | Chart-style views for numeric and structural data |
| **Themes** | Light, Dark, Solarized, and Monokai editor themes |
| **Performance** | Web Workers for heavy parse, stringify, beautify, minify, compare, and conversion tasks |
| **Privacy** | 100% client-side processing; no account required |

## Tech stack

- **Angular 21** with Angular Material and CDK
- **Ace** for the code editor
- **Tailwind CSS** for layout and utility styling
- **ajv** for JSON Schema validation
- **jsonpath**, **jsondiffpatch**, **js-yaml**, **xml2js**, and related libraries for querying, diffing, and conversion

## Getting started

### Prerequisites

- [Node.js 22](https://nodejs.org/) (see `.nvmrc`)
- npm

### Install and run

```bash
git clone <repository-url>
cd json-beauty
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200). The editor is at [http://localhost:4200/editor](http://localhost:4200/editor).

### Build

```bash
# Production build → dist/json-beauty/
npm run build

# Development build
npm run build:dev
```

### Test

```bash
npm test
```

### Bundle analysis

```bash
npm run analyze
```

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + F` | Show or hide floating find bar |
| `Ctrl/Cmd + Shift + F` | Show or hide Search & Replace panel |
| `Ctrl + B` | Beautify JSON |
| `Ctrl + M` | Minify JSON |
| `Ctrl + L` | Lint and fix JSON |
| `Ctrl + C` | Copy to clipboard |
| `Ctrl + S` | Download JSON |
| `Ctrl + D` | Clear editor |
| `Ctrl + K` | Show or hide keyboard shortcuts |
| `Ctrl + 1` | Maximize or minimize input panel |
| `Ctrl + 2` | Maximize or minimize output panel |
| `Ctrl + Alt + 0` | Fold all code |
| `Ctrl + Alt + Shift + 0` | Unfold all code |

## Project structure

```
src/app/
├── components/       # UI (editor, toolbar, comparison, paths, version history, …)
├── modules/          # Feature modules (landing, editor, conversion, validation)
├── services/         # JSON operations, conversion, validation, workers, theme, share
├── interfaces/       # Service contracts
├── constants/        # App-wide constants
├── utils/            # Shared helpers
└── types/            # TypeScript definitions
```

### Routes

| Path | Description |
|------|-------------|
| `/` | Landing page |
| `/editor` | Main JSON workspace |
| `/conversion` | Conversion module (lazy-loaded; reserved for future routes) |
| `/validation` | Validation module (lazy-loaded; reserved for future routes) |

## Architecture notes

- **Modular services** — Formatting, validation, conversion, comparison, JSONPath, and history are split into focused services behind small interfaces.
- **Converter factory** — Format conversions use a strategy/factory pattern (`JSON_TO_YAML`, `YAML_TO_JSON`, `JSON_TO_CSV`, `JSON_TO_XML`, `XML_TO_JSON`, `JSON5_TO_JSON`).
- **Web Workers** — Large-document parse, stringify, beautify, minify, compare, and conversion run off the main thread where appropriate.
- **Security** — CSP configuration and input sanitization for safer handling of untrusted pasted content.

## Contributing

1. Match existing TypeScript, SCSS, and Angular patterns in the codebase.
2. Add or update unit tests when behavior changes.
3. Keep this README accurate when adding user-facing features.
4. Use clear, descriptive commit messages.
