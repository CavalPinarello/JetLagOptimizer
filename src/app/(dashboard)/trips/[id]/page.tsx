'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plane,
  Calendar,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Coffee,
  Utensils,
  Dumbbell,
  Pill,
  CheckCircle2,
  Circle,
  MapPin,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTripStore } from '@/stores/trip-store';
import { useUserStore } from '@/stores/user-store';
import { cn } from '@/lib/utils';
import { formatProtocolDay } from '@/lib/utils';
import { generateProtocol } from '@/lib/circadian/protocol-generator';
import {
  CircadianClock,
  CircadianClockLegend,
} from '@/components/visualizations/circadian-clock';
import { AdjustmentProgress } from '@/components/visualizations/phase-progression';
import type { Intervention, InterventionType, ProtocolDay } from '@/types/protocol';

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
  light_exposure: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  light_avoidance: 'text-slate-500 bg-slate-500/10 border-slate-500/30',
  sleep: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30',
  melatonin: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
  caffeine: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
  meal: 'text-green-500 bg-green-500/10 border-green-500/30',
  exercise: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  creatine: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30',
};

function InterventionItem({
  intervention,
  onToggle,
}: {
  intervention: Intervention;
  onToggle: () => void;
}) {
  const Icon = interventionIcons[intervention.type];
  const colorClass = interventionColors[intervention.type];
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-all',
        colorClass,
        intervention.completed && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-3">
        <button onClick={onToggle} className="mt-1 shrink-0">
          {intervention.completed ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="h-4 w-4 shrink-0" />
            <span className="font-medium truncate">{intervention.title}</span>
            <Badge
              variant="outline"
              className={cn(
                'ml-auto shrink-0',
                intervention.priority === 'critical' && 'border-red-500 text-red-500'
              )}
            >
              {intervention.priority}
            </Badge>
          </div>

          <p className="text-sm opacity-80">
            {intervention.startTime}
            {intervention.endTime && ` - ${intervention.endTime}`}
          </p>

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs mt-2 hover:underline"
          >
            {expanded ? 'Show less' : 'Show details'}
          </button>

          {expanded && (
            <div className="mt-2 text-sm space-y-2">
              <p>{intervention.description}</p>
              <p className="text-xs italic opacity-70">
                {intervention.rationale}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DayView({
  day,
  onToggleIntervention,
}: {
  day: ProtocolDay;
  onToggleIntervention: (interventionId: string) => void;
}) {
  const completedCount = day.interventions.filter((i) => i.completed).length;

  return (
    <div className="space-y-4">
      {/* Day Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{formatProtocolDay(day.dayNumber)}</h3>
          <p className="text-sm text-muted-foreground">{day.summary}</p>
        </div>
        <div className="text-right">
          <Badge variant={day.phase === 'adjusted' ? 'default' : 'outline'}>
            {day.phase.replace('_', ' ')}
          </Badge>
          <p className="text-xs text-muted-foreground mt-1">
            {completedCount}/{day.interventions.length} done
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <Progress value={day.adjustmentProgress} className="flex-1" />
        <span className="text-sm font-medium w-12">
          {day.adjustmentProgress}%
        </span>
      </div>

      {/* Circadian State */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="p-3 rounded-lg bg-purple-500/10">
          <p className="text-xs text-muted-foreground">DLMO</p>
          <p className="font-mono font-medium text-purple-500">
            {day.estimatedDLMO}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-blue-500/10">
          <p className="text-xs text-muted-foreground">CBTmin</p>
          <p className="font-mono font-medium text-blue-500">
            {day.estimatedCBTmin}
          </p>
        </div>
      </div>

      {/* Interventions */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          Interventions
        </h4>
        {day.interventions.map((intervention) => (
          <InterventionItem
            key={intervention.id}
            intervention={intervention}
            onToggle={() => onToggleIntervention(intervention.id)}
          />
        ))}
      </div>

      {/* Tips */}
      {day.tips.length > 0 && (
        <div className="p-3 rounded-lg bg-muted">
          <h4 className="text-sm font-medium mb-2">Tips</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {day.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const { trips, activeProtocol, setActiveTrip, setActiveProtocol, markInterventionComplete } =
    useTripStore();
  const { user } = useUserStore();

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const trip = trips.find((t) => t.id === tripId);

  useEffect(() => {
    if (trip) {
      setActiveTrip(trip.id);
    }
  }, [trip, setActiveTrip]);

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Trip Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The trip you're looking for doesn't exist.
        </p>
        <Link href="/trips">
          <Button>Back to Trips</Button>
        </Link>
      </div>
    );
  }

  const handleGenerateProtocol = async () => {
    if (!user?.circadianProfile) {
      router.push('/questionnaire');
      return;
    }

    setIsGenerating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate processing

      const protocol = generateProtocol({
        trip,
        circadianProfile: user.circadianProfile,
        preferences: user.preferences,
      });

      setActiveProtocol(protocol);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleIntervention = (interventionId: string) => {
    if (!activeProtocol) return;

    const day = activeProtocol.days[selectedDayIndex];
    const intervention = day.interventions.find((i) => i.id === interventionId);

    if (intervention) {
      markInterventionComplete(
        day.dayNumber,
        interventionId,
        !intervention.completed
      );
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const selectedDay = activeProtocol?.days[selectedDayIndex];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link href="/trips">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Trips
          </Button>
        </Link>
      </div>

      {/* Trip Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{trip.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <MapPin className="h-4 w-4" />
                <span>{trip.originCity}</span>
                <ArrowRight className="h-4 w-4" />
                <span>{trip.destinationCity}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge
                variant={trip.direction === 'eastward' ? 'default' : 'secondary'}
                className="text-sm"
              >
                {trip.direction === 'eastward' ? 'Eastward' : 'Westward'}
              </Badge>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {trip.timezoneShiftHours > 0 ? '+' : ''}
                  {trip.timezoneShiftHours}h
                </p>
                <p className="text-xs text-muted-foreground">timezone shift</p>
              </div>
            </div>
          </div>

          {/* Trip Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Departure</p>
              <p className="font-medium">{formatDate(trip.departureDateTime)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Arrival</p>
              <p className="font-medium">{formatDate(trip.arrivalDateTime)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium">{trip.tripDurationDays} days</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant="outline">{trip.status}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Protocol Section */}
      {!activeProtocol ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Protocol Generated</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {user?.circadianProfile
                ? 'Generate a personalized adjustment protocol for this trip based on your chronotype.'
                : 'Complete your chronotype assessment first to get a personalized protocol.'}
            </p>
            <Button onClick={handleGenerateProtocol} disabled={isGenerating}>
              {isGenerating
                ? 'Generating...'
                : user?.circadianProfile
                ? 'Generate Protocol'
                : 'Complete Assessment'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Protocol Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Adjustment Protocol</CardTitle>
                  <CardDescription>
                    {activeProtocol.days.length} days |{' '}
                    {activeProtocol.adjustmentRatePerDay.toFixed(1)}h/day rate |{' '}
                    ~{activeProtocol.estimatedDaysToAdjust} days to adjust
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleGenerateProtocol}>
                  Regenerate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <AdjustmentProgress
                progress={selectedDay?.adjustmentProgress || 0}
                direction={activeProtocol.direction}
                daysRemaining={Math.max(
                  0,
                  activeProtocol.estimatedDaysToAdjust - selectedDayIndex
                )}
              />
            </CardContent>
          </Card>

          {/* Day Navigator */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDayIndex(Math.max(0, selectedDayIndex - 1))}
              disabled={selectedDayIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex gap-1 overflow-x-auto px-2">
              {activeProtocol.days.map((day, index) => (
                <button
                  key={day.dayNumber}
                  onClick={() => setSelectedDayIndex(index)}
                  className={cn(
                    'px-3 py-1 rounded-md text-sm whitespace-nowrap transition-colors',
                    index === selectedDayIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  {day.dayNumber === 0 ? 'Travel' : `D${day.dayNumber > 0 ? '+' : ''}${day.dayNumber}`}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSelectedDayIndex(
                  Math.min(activeProtocol.days.length - 1, selectedDayIndex + 1)
                )
              }
              disabled={selectedDayIndex === activeProtocol.days.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Day Detail */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="pt-6">
                  {selectedDay && (
                    <DayView
                      day={selectedDay}
                      onToggleIntervention={handleToggleIntervention}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Circadian Clock */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Circadian Phase</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {selectedDay && (
                  <>
                    <CircadianClock
                      dlmo={selectedDay.estimatedDLMO}
                      cbtmin={selectedDay.estimatedCBTmin}
                      size={220}
                    />
                    <div className="mt-4 text-center text-sm text-muted-foreground">
                      <p>
                        Shifted{' '}
                        <span className="font-medium text-foreground">
                          {selectedDay.phaseShiftFromHome.toFixed(1)}h
                        </span>{' '}
                        from home
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
