# RWSA Fee Tracker - Claude Documentation

## Build & Development Commands

```bash
# Development
bun run dev          # Start development server (don't use - runs indefinitely)
bun run build        # Build for production
bun run start        # Start production server
bun run lint         # Run ESLint

# TypeScript
npx tsc --noEmit     # Type check without emitting files
```

## Code Style Guidelines

### Framework & Stack
- Next.js 15 with App Router
- TypeScript with strict mode
- Tailwind CSS for styling
- Firebase (Auth + Firestore)
- Bun as package manager

### Import Style
- Use `@/` path alias for src directory imports
- Group imports: external libs → internal components → relative imports
- No file extensions needed for TypeScript files

### Component Patterns
- Use `'use client'` directive for client components
- Functional components with TypeScript interfaces
- Props destructuring in component parameters
- Context providers for global state (AuthProvider pattern)

### Naming Conventions
- Components: PascalCase (e.g., `AuthProvider`, `BottomNav`)
- Files: PascalCase for components, camelCase for utilities
- Variables/functions: camelCase
- Constants: UPPER_SNAKE_CASE
- CSS classes: Tailwind utility classes

### Firebase Integration
- Authentication with Google OAuth (restricted by environment variables)
- Firestore for data storage with security rules
- Use Firebase v9+ modular SDK

### Mobile-First PWA
- Responsive design with mobile-first approach
- Desktop layout hidden on mobile (`lg:hidden` / `hidden lg:block`)
- Service worker for offline functionality
- Bottom navigation for mobile, desktop layout for large screens

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   └── shared/      # Shared/common components
├── lib/             # Configuration (Firebase, etc.)
└── utils/           # Utility functions
```

## Key Features
- Student fee tracking system for student union
- CSV import and manual data entry
- Protected routes with Firebase Auth
- Data visualization with charts (Recharts)
- QR code generation for PWA installation