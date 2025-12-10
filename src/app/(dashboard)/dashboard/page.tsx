'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Sun,
  Moon,
  Coffee,
  Utensils,
  Dumbbell,
  Pill,
  Plane,
  Clock,
  CheckCircle2,
  Circle,
  ChevronRight,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ProtocolStreak, WeeklyOverview } from '@/components/protocol/intervention-tracker';
import { useUserStore } from '@/stores/user-store';
import { useTripStore, useTodayProtocolDay, useNextTrip } from '@/stores/trip-store';
import { cn } from '@/lib/utils';
import { formatProtocolDay } from '@/lib/utils';
import type { Intervention, InterventionType } from '@/types/protocol';

const interventionIcons: Record<InterventionType, React.ElementType> = {
  light_exposure: Sun,
  light_avoidance: Moon,
  sleep: Moon,
  melatonin: Pill,
  caffeine: Coffee,
  meal: Utensils,
  exercise: Dumbbell,
  creatine: Pill,
};

const interventionColors: Record<InterventionType, string> = {
  light_exposure: 'text-amber-500 bg-amber-500/10',
  light_avoidance: 'text-slate-500 bg-slate-500/10',
  sleep: 'text-indigo-500 bg-indigo-500/10',
  melatonin: 'text-purple-500 bg-purple-500/10',
  caffeine: 'text-orange-500 bg-orange-500/10',
  meal: 'text-green-500 bg-green-500/10',
  exercise: 'text-blue-500 bg-blue-500/10',
  creatine: 'text-cyan-500 bg-cyan-500/10',
};

function InterventionCard({
  intervention,
  onToggleComplete,
}: {
  intervention: Intervention;
  onToggleComplete: (id: string) => void;
}) {
  const Icon = interventionIcons[intervention.type];
  const colorClass = interventionColors[intervention.type];
  const [showRationale, setShowRationale] = useState(false);

  const isPast = (() => {
    const now = new Date();
    const [hours, minutes] = intervention.endTime?.split(':').map(Number) || [23, 59];
    const interventionEnd = new Date();
    interventionEnd.setHours(hours, minutes, 0, 0);
    return now > interventionEnd;
  })();

  return (
    <div
      className={cn(
        'group relative rounded-lg border p-4 transition-all hover:shadow-md',
        intervention.completed && 'bg-muted/50 opacity-75',
        isPast && !intervention.completed && 'border-amber-500/50'
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn('rounded-lg p-2', colorClass)}>
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{intervention.title}</h4>
            <Badge
              variant={
                intervention.priority === 'critical'
                  ? 'default'
                  : intervention.priority === 'recommended'
                  ? 'secondary'
                  : 'outline'
              }
            >
              {intervention.priority}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground">
            {intervention.startTime}
            {intervention.endTime && ` - ${intervention.endTime}`}
          </p>

          <p className="text-sm">{intervention.description}</p>

          {/* Rationale Toggle */}
          <button
            onClick={() => setShowRationale(!showRationale)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {showRationale ? 'Hide' : 'Show'} scientific rationale
          </button>

          {showRationale && (
            <p className="text-xs italic text-muted-foreground mt-2 p-2 bg-muted rounded">
              {intervention.rationale}
            </p>
          )}
        </div>

        {/* Complete Button */}
        <button
          onClick={() => onToggleComplete(intervention.id)}
          className="shrink-0"
          aria-label={intervention.completed ? 'Mark incomplete' : 'Mark complete'}
        >
          {intervention.completed ? (
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          ) : (
            <Circle className="h-6 w-6 text-muted-foreground hover:text-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}

function NoActiveProtocol() {
  const nextTrip = useNextTrip();

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Plane className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">No Active Protocol</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        {nextTrip
          ? `Your next trip to ${nextTrip.destinationCity} starts on ${new Date(
              nextTrip.departureDateTime
            ).toLocaleDateString()}. Generate a protocol to start your adjustment plan.`
          : 'Create a trip to generate your personalized circadian adjustment protocol.'}
      </p>
      <div className="flex gap-3">
        {nextTrip ? (
          <Link href={`/trips/${nextTrip.id}`}>
            <Button>
              View Trip <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Link href="/trips/new">
            <Button>
              <Plane className="mr-2 h-4 w-4" />
              Plan a Trip
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

function NeedsAssessment() {
  return (
    <Card className="border-amber-500/50 bg-amber-500/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-lg">Complete Your Assessment</CardTitle>
        </div>
        <CardDescription>
          We need to know your chronotype to create personalized protocols
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Take the 5-minute MEQ questionnaire to determine if you are a morning
          or evening type. This helps us time your interventions optimally.
        </p>
        <Link href="/questionnaire">
          <Button>
            Start Assessment <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useUserStore();
  const { activeProtocol, markInterventionComplete } = useTripStore();
  const todayDay = useTodayProtocolDay();

  const hasChronotypeAssessment = user?.circadianProfile !== null;

  // Mock data for demonstration if no real data
  const showMockData = !activeProtocol && hasChronotypeAssessment;

  const handleToggleComplete = (interventionId: string) => {
    if (todayDay) {
      const intervention = todayDay.interventions.find(
        (i) => i.id === interventionId
      );
      if (intervention) {
        markInterventionComplete(
          todayDay.dayNumber,
          interventionId,
          !intervention.completed
        );
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {todayDay
            ? `${formatProtocolDay(todayDay.dayNumber)} - ${todayDay.summary}`
            : "Your personalized circadian adjustment plan"}
        </p>
      </div>

      {/* Assessment Warning */}
      {!hasChronotypeAssessment && <NeedsAssessment />}

      {/* Progress Overview */}
      {todayDay && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Adjustment Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Progress value={todayDay.adjustmentProgress} className="flex-1" />
                <span className="text-sm font-medium">
                  {todayDay.adjustmentProgress}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Current DLMO
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{todayDay.estimatedDLMO}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Dim Light Melatonin Onset
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Phase Shift
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {todayDay.phaseShiftFromHome > 0 ? '+' : ''}
                  {todayDay.phaseShiftFromHome.toFixed(1)}h
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Shifted from home time
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Today's Interventions */}
      {todayDay ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Today's Protocol</CardTitle>
                <CardDescription>
                  {todayDay.interventions.filter((i) => i.completed).length} of{' '}
                  {todayDay.interventions.length} completed
                </CardDescription>
              </div>
              <Badge variant="outline">{todayDay.phase.replace('_', ' ')}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayDay.interventions.map((intervention) => (
              <InterventionCard
                key={intervention.id}
                intervention={intervention}
                onToggleComplete={handleToggleComplete}
              />
            ))}
          </CardContent>
        </Card>
      ) : (
        hasChronotypeAssessment && <NoActiveProtocol />
      )}

      {/* Streak and Weekly Overview */}
      {activeProtocol && (
        <div className="grid gap-4 md:grid-cols-2">
          <ProtocolStreak days={activeProtocol.days} />
          <WeeklyOverview days={activeProtocol.days} />
        </div>
      )}

      {/* Tips */}
      {todayDay && todayDay.tips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tips for Today</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {todayDay.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
