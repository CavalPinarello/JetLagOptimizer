import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'JetLagOptimizer - Personalized Circadian Adjustment',
  description:
    'Evidence-based jet lag optimization with personalized day-by-day circadian adjustment protocols. Beat jet lag faster using light, meals, exercise, and supplements.',
  keywords: [
    'jet lag',
    'circadian rhythm',
    'travel health',
    'chronotype',
    'melatonin',
    'light therapy',
    'sleep optimization',
  ],
  authors: [{ name: 'JetLagOptimizer' }],
  openGraph: {
    title: 'JetLagOptimizer - Beat Jet Lag Faster',
    description:
      'Personalized circadian adjustment protocols based on your chronotype and travel plans.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
