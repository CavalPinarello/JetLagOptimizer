# JetLagOptimizer

A science-based jet lag optimization tool that generates personalized circadian adjustment protocols for travelers.

## Features

- **Chronotype Assessment**: MEQ (Morningness-Eveningness Questionnaire) to determine your circadian preference
- **Personalized Protocols**: Custom light exposure, melatonin, and behavioral intervention schedules
- **Trip Management**: Plan multiple trips with timezone shift calculations
- **Visual Tracking**: Circadian clock visualizations and progress tracking
- **Scientific Rationale**: Each intervention includes explanation of the underlying science

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/CavalPinarello/JetLagOptimizer.git
cd JetLagOptimizer

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Environment Variables

Create a `.env.local` file (optional):
```env
# No required environment variables for basic functionality
```

## Usage

1. **Complete Assessment**: Take the 5-minute chronotype questionnaire to establish your baseline circadian profile
2. **Create a Trip**: Enter your origin, destination, and travel dates
3. **Generate Protocol**: Get a day-by-day adjustment plan with timed interventions
4. **Follow Protocol**: Track your progress and mark interventions as completed

## Tech Stack

- [Next.js 16](https://nextjs.org/) - React framework with App Router
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [Vercel](https://vercel.com/) - Deployment

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Navigation components
│   └── visualizations/     # Charts and clocks
├── stores/                 # Zustand state stores
├── lib/                    # Utility functions
│   └── circadian/          # Circadian rhythm algorithms
└── types/                  # TypeScript definitions
```

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
```

## Deployment

The app is deployed on Vercel with automatic deployments on push to `main`.

Live site: [jet-lag-optimizer.vercel.app](https://jet-lag-optimizer.vercel.app)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private. All rights reserved.

## Acknowledgments

- MEQ questionnaire based on Horne & Ostberg (1976)
- Circadian science research from various academic sources (see `/docs/CIRCADIAN_SCIENCE_RESEARCH.md`)
