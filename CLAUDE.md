# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Beer Label Editor - A client-side React application for designing professional beer bottle and can labels. Uses Fabric.js for canvas-based editing and jsPDF for high-resolution PDF export.

## Development Commands

```bash
npm run dev       # Start dev server on port 5173
npm run build     # TypeScript check + Vite production build
npm run lint      # ESLint validation
npm run preview   # Preview production build
```

## Docker Deployment

```bash
docker compose up -d --build   # Build and start container
docker compose logs -f         # View logs
docker compose down            # Stop container
```

Note: Use `docker compose` (without hyphen) - the new Docker Compose V2 syntax.

## Architecture

### Component Hierarchy

```
App.tsx                        # Main orchestrator, global state management
├── Header                     # Top navigation
├── Sidebar                    # Tabbed panel container
│   ├── ElementsPanel          # Add beer fields, text, images, shapes
│   ├── LayersPanel            # Object z-order management
│   ├── FormatPanel            # Label format selection
│   └── StylePanel             # Text/image styling controls
├── CanvasEditor               # Fabric.js canvas wrapper + toolbar
├── TemplateGallery            # Template browser modal
└── MultiLabelExport           # A4 sheet printing modal
```

### Key Files

- `src/hooks/useCanvas.ts` - Core Fabric.js wrapper hook (canvas operations, history, selection)
- `src/types/label.ts` - TypeScript interfaces (LabelFormat, LabelElement, BeerLabelData, ElementStyle)
- `src/constants/labelFormats.ts` - 5 predefined label formats + mm/px conversion constants
- `src/constants/defaultStyles.ts` - 60+ Google Fonts, default styles, field templates
- `src/utils/formatConverter.ts` - mm↔px conversion (96 DPI for screen, 300 DPI for print)
- `src/utils/printCalculator.ts` - A4 sheet layout calculation for multi-label export
- `src/data/templates.ts` - 4 pre-made templates as Fabric.js JSON

### State Flow

1. User interactions modify state in App.tsx via useState hooks
2. Canvas operations go through `canvasActionsRef` exposed by useCanvas hook
3. Fabric.js Canvas manages all 2D objects (text, images, shapes)
4. Undo/redo history maintained in useCanvas (max 50 states)
5. Projects persist to localStorage

### Canvas Operations (useCanvas hook)

The hook exposes methods via ref: `addText`, `addImage`, `addShape`, `deleteSelected`, `undo`, `redo`, `bringForward`, `sendBackward`, `applyTemplate`, `exportToPDF`, `getCanvasJSON`.

Keyboard shortcuts: Delete (remove), Ctrl+Z (undo), Ctrl+Y (redo), Ctrl+D (duplicate)

### Text Styling Features

StylePanel provides text formatting controls:
- **Font**: 60+ Google Fonts selection
- **Size**: Range slider + numeric input (6-200px)
- **Style**: Bold, Italic, Underline toggles
- **Color**: Color picker + quick color palette
- **Spacing**: Line height (0.8-3) and letter spacing (-5 to 20px)
- **Shadow**: Toggle with color, blur (0-20px), and offset X/Y (-20 to 20px)

Note: Text alignment (left/center/right) was removed as unnecessary for label design.

### StylePanel Local State Pattern

StylePanel uses local state to ensure smooth UI updates for sliders and toggle buttons. The pattern:
1. Local state (`textStyle`, `shadowValues`, `imageValues`) holds current values
2. `useRef` tracks previous element ID to detect selection changes
3. State syncs from `selectedElement` only when a NEW element is selected
4. Changes update local state immediately, then propagate to parent via callbacks

This prevents React re-renders from resetting slider positions mid-drag.

## Tech Stack

- **React 18** with TypeScript (strict mode, ES2020 target)
- **Fabric.js 6.5** for canvas manipulation
- **jsPDF 2.5** for PDF generation
- **Tailwind CSS 3.4** for styling
- **Vite 6** for build tooling

## Notes

- UI text is in French
- No backend - entirely client-side SPA
- No test infrastructure configured
- Path alias: `@/*` maps to `src/*`
- Export uses 4x resolution multiplier for print quality
