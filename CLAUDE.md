# CLAUDE.md - JetLagOptimizer

## Project Overview
JetLagOptimizer is a Next.js application that generates personalized circadian adjustment protocols for travelers crossing time zones. It uses scientifically-validated chronotype assessments (MEQ questionnaire) and circadian rhythm calculations to create tailored light exposure, melatonin, and behavioral intervention schedules.

## Tech Stack
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand with persist middleware (localStorage)
- **Deployment**: Vercel

## Key Architecture Decisions

### State Management with Hydration
The app uses Zustand with persist middleware for client-side state. Important: SSR/hydration requires special handling:
- `_hasHydrated` flag tracks when localStorage data is loaded
- `onRehydrateStorage` callback sets the flag after hydration
- Helper hooks like `useHasChronotypeAssessment()` return safe defaults during SSR

### Circadian Profile System
- Users complete MEQ (Morningness-Eveningness Questionnaire) assessment
- Results calculate chronotype category and estimate DLMO (Dim Light Melatonin Onset)
- Profile is saved to user store and persisted in localStorage
- Demo users are auto-created when saving assessment without authentication

## Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/        # Authenticated dashboard routes
│   │   ├── dashboard/      # Main dashboard
│   │   ├── trips/          # Trip management
│   │   ├── questionnaire/  # MEQ assessment
│   │   └── ...
│   └── (auth)/             # Authentication routes
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Sidebar, mobile nav
│   ├── protocol/           # Protocol-related components
│   └── visualizations/     # Circadian clock, charts
├── stores/                 # Zustand stores
│   ├── user-store.ts       # User profile & chronotype
│   ├── trip-store.ts       # Trips & protocols
│   └── ui-store.ts         # UI state
├── lib/
│   ├── circadian/          # Core circadian algorithms
│   └── timezone/           # Timezone utilities
└── types/                  # TypeScript type definitions
```

## Common Commands
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
```

## Recent Session Notes

### 2025-12-10: Chronotype Assessment Persistence Fix
**Issue**: Users completing the chronotype assessment were still seeing "Complete your assessment" messages. The assessment data wasn't being recognized even though it was saved.

**Root Causes**:
1. Incorrect null check: `user?.circadianProfile !== null` returns `true` when `user` is `null` (because `undefined !== null`)
2. Hydration mismatch: Server renders with `user: null`, client loads localStorage data after hydration

**Fixes Applied**:
1. Created `useHasChronotypeAssessment()` helper hook with proper null/undefined checks
2. Updated all components (dashboard, sidebar, mobile-nav, trip detail) to use the helper hook
3. Added hydration tracking to Zustand store with `_hasHydrated` flag and `onRehydrateStorage` callback

**Commits**:
- `f859cdb` - Fix hydration issue with chronotype assessment check
- `0e2eb4e` - Fix trip detail page chronotype assessment check
- `6a837db` - Fix chronotype assessment persistence check
