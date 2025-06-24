# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Architecture

This is a Next.js 15 application using the App Router with React 19 and TypeScript. The project follows a modern Next.js structure:

### Key Technologies
- **Next.js 15** with App Router and Turbopack for development
- **React 19** with TypeScript
- **Tailwind CSS v4** for styling
- **shadcn/ui** components with "new-york" style
- **Lucide React** for icons

### Directory Structure
- `src/app/` - Next.js App Router pages and layouts
- `src/lib/` - Utility functions and shared logic
- `components/` - Reusable UI components (shadcn/ui setup)
- `public/` - Static assets

### Component System
The project uses shadcn/ui with these configurations:
- Style: "new-york"
- Base color: gray
- CSS variables enabled
- Path aliases: `@/components`, `@/lib/utils`, `@/components/ui`

### Styling
- Tailwind CSS v4 with PostCSS
- Custom utility function `cn()` in `src/lib/utils.ts` for class merging
- Geist fonts (Sans and Mono) loaded via `next/font`

### Development Notes
- Uses strict TypeScript configuration
- ESLint configured with Next.js recommended rules
- Path aliases configured for clean imports (`@/*` → `src/*`)