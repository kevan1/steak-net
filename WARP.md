# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

SteakNet Website is a Next.js 14 application for the SteakNet liquid staking platform on Solana. The site showcases STEAKSOL (liquid staking token) and STEAK (community reward token) with a dark, branded design system.

## Development Commands

### Core Development
```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting (ESLint with Next.js TypeScript rules)
npm run lint
```

### Single Test Execution
This project doesn't have test scripts configured. To add testing:
- For Jest: `npm install --save-dev jest @testing-library/react @testing-library/jest-dom`
- For Playwright: `npm install --save-dev @playwright/test`

## Architecture and Code Structure

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS v4 with custom CSS variables
- **UI Components**: Radix UI primitives with shadcn/ui (New York variant)
- **TypeScript**: Strict mode enabled
- **Fonts**: Custom SteakFont, Poppins, and Geist fonts
- **Analytics**: Vercel Analytics integration

### Key Architectural Patterns

#### Component Architecture
- **UI Components**: Located in `components/ui/` - reusable Radix-based components
- **Custom Components**: `components/theme-provider.tsx` for theme management
- **Single Page Application**: Main landing page in `app/page.tsx`

#### Design System
- **Brand Colors**: Primary red (#ee444d), dark brown background (#3a2020)
- **Typography**: SteakFont for headings with stroke effects, Poppins for body text
- **Glassmorphism**: Custom `.glass-card` utility with backdrop blur and transparency
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

#### State Management
- React hooks for local state (stake amounts, navigation blur)
- Custom hooks in `hooks/`: `use-mobile.ts`, `use-toast.ts`
- No global state management library (appropriate for landing page)

#### Styling Architecture
- **CSS Variables**: Comprehensive design token system in `app/globals.css`
- **Tailwind Configuration**: Uses `components.json` for shadcn/ui path aliases
- **Custom Utilities**: Gradient backgrounds, font inheritance, glassmorphism effects

### Important File Locations
- **Main Page**: `app/page.tsx` - Complete landing page component
- **Layout**: `app/layout.tsx` - Root layout with font loading and analytics
- **Styles**: `app/globals.css` - CSS variables and custom utilities
- **Utils**: `lib/utils.ts` - `cn()` function for conditional classes
- **Config**: `next.config.mjs` - Next.js configuration (development mode has build error ignoring)

### Development Notes
- **Build Configuration**: TypeScript and ESLint errors are ignored during builds (see `next.config.mjs`)
- **Font Loading**: Custom fonts loaded locally from `public/fonts/`
- **Image Optimization**: Disabled for development/static export compatibility
- **Path Aliases**: `@/*` maps to root directory for clean imports

### Key Dependencies Understanding
- **Radix UI**: Comprehensive primitive components for accessibility
- **Tailwind Merge + clsx**: Conditional class handling in `cn()` utility
- **Next Themes**: Theme provider (though site uses consistent dark theme)
- **Vercel Analytics**: Integrated for production metrics
- **React Hook Form + Zod**: Form handling capabilities (though not actively used in current implementation)

### Deployment Considerations
- Built for Vercel deployment (analytics integration)
- Static export compatible (images unoptimized)
- Custom fonts require `public/fonts/` directory structure