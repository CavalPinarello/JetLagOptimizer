import Link from 'next/link';
import {
  Sun,
  Moon,
  Plane,
  Clock,
  Utensils,
  Dumbbell,
  Pill,
  Coffee,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: Clock,
    title: 'Chronotype Assessment',
    description:
      'Determine your circadian type with validated MEQ and MCTQ questionnaires',
  },
  {
    icon: Plane,
    title: 'Smart Trip Planning',
    description:
      'Input your travel details and get automatic timezone shift calculations',
  },
  {
    icon: Sun,
    title: 'Light Timing',
    description:
      'Precise light exposure and avoidance windows based on phase response curves',
  },
  {
    icon: Utensils,
    title: 'Meal Anchoring',
    description:
      'Strategic meal timing to synchronize your peripheral clocks',
  },
  {
    icon: Dumbbell,
    title: 'Exercise Optimization',
    description:
      'Time your workouts to reinforce circadian adjustment',
  },
  {
    icon: Pill,
    title: 'Supplement Guidance',
    description:
      'Evidence-based melatonin, caffeine, and creatine recommendations',
  },
];

const interventions = [
  { icon: Sun, label: 'Light', color: 'text-amber-500' },
  { icon: Moon, label: 'Dark', color: 'text-slate-600' },
  { icon: Utensils, label: 'Meals', color: 'text-green-500' },
  { icon: Dumbbell, label: 'Exercise', color: 'text-blue-500' },
  { icon: Pill, label: 'Melatonin', color: 'text-purple-500' },
  { icon: Coffee, label: 'Caffeine', color: 'text-orange-500' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-indigo-600 flex items-center justify-center">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg">JetLagOptimizer</span>
            <Badge variant="secondary" className="text-xs">Beta</Badge>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition"
            >
              Dashboard
            </Link>
            <Link
              href="/trips"
              className="text-sm text-muted-foreground hover:text-foreground transition"
            >
              Trips
            </Link>
            <Link
              href="/trips/new"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
            >
              Create Trip
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Evidence-based circadian science
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Beat Jet Lag{' '}
              <span className="bg-gradient-to-r from-amber-500 to-indigo-600 bg-clip-text text-transparent">
                Faster
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Personalized day-by-day protocols that coordinate light, meals,
              exercise, and supplements based on your unique chronotype and
              travel plans.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/trips/new"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 transition w-full sm:w-auto"
              >
                Create Your First Trip
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/test-trips"
                className="inline-flex items-center justify-center gap-2 rounded-md border px-6 py-3 text-base font-medium hover:bg-muted transition w-full sm:w-auto"
              >
                See Demo Trips
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Interventions Preview */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6">
            {interventions.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm"
              >
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Coordinated Circadian Adjustment
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Unlike simple jet lag calculators, we synchronize multiple
              zeitgebers (time-givers) based on phase response curve science.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border bg-card hover:shadow-md transition"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">
              Three simple steps to your personalized protocol
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Know Your Chronotype</h3>
              <p className="text-sm text-muted-foreground">
                Complete our questionnaire to determine your natural circadian
                rhythm and estimate your DLMO.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">Enter Your Trip</h3>
              <p className="text-sm text-muted-foreground">
                Add your travel details including departure, arrival times, and
                how long you will be at your destination.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Follow Your Protocol</h3>
              <p className="text-sm text-muted-foreground">
                Get a day-by-day plan with precise timing for light, meals,
                exercise, and supplements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Science Preview */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">
                  Based on Real Science
                </h2>
                <p className="text-muted-foreground mb-6">
                  Our protocols are built on peer-reviewed circadian research
                  from 2015-2025, including phase response curves for light and
                  melatonin.
                </p>
                <ul className="space-y-3">
                  {[
                    'Phase Response Curve (PRC) based timing',
                    'Central and peripheral clock coordination',
                    'Chronotype-adjusted recommendations',
                    'Social jet lag considerations',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-muted rounded-xl p-8">
                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    Adjustment rates with interventions
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div className="p-4 bg-background rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-1">
                      ~1.5h
                    </div>
                    <div className="text-lg font-medium">Eastward</div>
                    <p className="text-xs text-muted-foreground">
                      Phase Advance (harder)
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ~1h/day without help
                    </p>
                  </div>
                  <div className="p-4 bg-background rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-1">
                      ~2h
                    </div>
                    <div className="text-lg font-medium">Westward</div>
                    <p className="text-xs text-muted-foreground">
                      Phase Delay (easier)
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ~1.5h/day without help
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Per day adjustment rate
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Travel Better?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Try our beta and get your personalized circadian adjustment protocol.
          </p>
          <Link
            href="/trips/new"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-white text-primary px-6 py-3 text-base font-medium hover:bg-white/90 transition"
          >
            Create Your Trip
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-indigo-600"></div>
              <span className="font-medium">JetLagOptimizer</span>
              <Badge variant="secondary" className="text-xs">Beta</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Evidence-based circadian adjustment for modern travelers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
