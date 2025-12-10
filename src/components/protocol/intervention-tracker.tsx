'use client';

import { useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Sun,
  Moon,
  Pill,
  Coffee,
  Utensils,
  Dumbbell,
  Clock,
  Trophy,
  Flame,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ProtocolDay, Intervention, InterventionType } from '@/types/protocol';

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
  light_exposure: 'text-amber-500',
  light_avoidance: 'text-slate-500',
  sleep: 'text-indigo-500',
  melatonin: 'text-purple-500',
  caffeine: 'text-orange-500',
  meal: 'text-green-500',
  exercise: 'text-blue-500',
  creatine: 'text-cyan-500',
};

interface DayCompletionStats {
  total: number;
  completed: number;
  critical: number;
  criticalCompleted: number;
  percentage: number;
}

function calculateDayStats(day: ProtocolDay): DayCompletionStats {
  const total = day.interventions.length;
  const completed = day.interventions.filter((i) => i.completed).length;
  const critical = day.interventions.filter(
    (i) => i.priority === 'critical'
  ).length;
  const criticalCompleted = day.interventions.filter(
    (i) => i.priority === 'critical' && i.completed
  ).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, critical, criticalCompleted, percentage };
}

interface InterventionTrackerProps {
  day: ProtocolDay;
  onToggle: (interventionId: string) => void;
  compact?: boolean;
}

export function InterventionTracker({
  day,
  onToggle,
  compact = false,
}: InterventionTrackerProps) {
  const stats = useMemo(() => calculateDayStats(day), [day]);

  // Group interventions by time of day
  const timeGroups = useMemo(() => {
    const groups: { morning: Intervention[]; afternoon: Intervention[]; evening: Intervention[]; night: Intervention[] } = {
      morning: [],
      afternoon: [],
      evening: [],
      night: [],
    };

    day.interventions.forEach((intervention) => {
      const hour = parseInt(intervention.startTime.split(':')[0]);
      if (hour >= 5 && hour < 12) {
        groups.morning.push(intervention);
      } else if (hour >= 12 && hour < 17) {
        groups.afternoon.push(intervention);
      } else if (hour >= 17 && hour < 21) {
        groups.evening.push(intervention);
      } else {
        groups.night.push(intervention);
      }
    });

    return groups;
  }, [day.interventions]);

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <Progress value={stats.percentage} className="flex-1" />
          <span className="text-sm font-medium min-w-[3rem] text-right">
            {stats.completed}/{stats.total}
          </span>
        </div>

        {/* Compact intervention list */}
        <div className="flex flex-wrap gap-2">
          {day.interventions.map((intervention) => {
            const Icon = interventionIcons[intervention.type];
            return (
              <button
                key={intervention.id}
                onClick={() => onToggle(intervention.id)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-all',
                  intervention.completed
                    ? 'bg-green-500/10 border-green-500/30 text-green-600'
                    : 'bg-muted border-muted hover:border-primary'
                )}
              >
                {intervention.completed ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <Icon className={cn('h-3 w-3', interventionColors[intervention.type])} />
                )}
                <span>{intervention.startTime}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-2xl font-bold">{stats.percentage}%</p>
            <p className="text-sm text-muted-foreground">completed</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="text-sm">
            <p>
              <span className="font-medium">{stats.completed}</span>/{stats.total} interventions
            </p>
            {stats.critical > 0 && (
              <p className="text-muted-foreground">
                {stats.criticalCompleted}/{stats.critical} critical
              </p>
            )}
          </div>
        </div>

        {stats.percentage === 100 && (
          <Badge className="bg-green-500 hover:bg-green-600">
            <Trophy className="h-3 w-3 mr-1" />
            All done!
          </Badge>
        )}
      </div>

      {/* Progress bar */}
      <Progress value={stats.percentage} className="h-3" />

      {/* Time-grouped interventions */}
      {Object.entries(timeGroups).map(([timeOfDay, interventions]) => {
        if (interventions.length === 0) return null;

        const timeLabels = {
          morning: 'Morning',
          afternoon: 'Afternoon',
          evening: 'Evening',
          night: 'Night',
        };

        return (
          <div key={timeOfDay} className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {timeLabels[timeOfDay as keyof typeof timeLabels]}
            </h4>
            <div className="space-y-2">
              {interventions.map((intervention) => {
                const Icon = interventionIcons[intervention.type];
                const colorClass = interventionColors[intervention.type];

                return (
                  <div
                    key={intervention.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-all',
                      intervention.completed
                        ? 'bg-muted/50 border-muted opacity-70'
                        : 'bg-background hover:border-primary/50'
                    )}
                  >
                    <button
                      onClick={() => onToggle(intervention.id)}
                      className="shrink-0"
                    >
                      {intervention.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                      )}
                    </button>

                    <Icon className={cn('h-4 w-4 shrink-0', colorClass)} />

                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'font-medium truncate',
                          intervention.completed && 'line-through'
                        )}
                      >
                        {intervention.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {intervention.startTime}
                        {intervention.endTime && ` - ${intervention.endTime}`}
                      </p>
                    </div>

                    {intervention.priority === 'critical' && (
                      <Badge variant="destructive" className="shrink-0">
                        Critical
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface ProtocolStreakProps {
  days: ProtocolDay[];
}

export function ProtocolStreak({ days }: ProtocolStreakProps) {
  const streak = useMemo(() => {
    let currentStreak = 0;
    let maxStreak = 0;

    // Sort days by date
    const sortedDays = [...days].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    for (const day of sortedDays) {
      const stats = calculateDayStats(day);
      if (stats.percentage >= 80) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return { current: currentStreak, max: maxStreak };
  }, [days]);

  if (streak.current === 0 && streak.max === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10">
            <Flame className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {streak.current} day{streak.current !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-muted-foreground">
              Current streak (80%+ completion)
            </p>
          </div>
          {streak.max > streak.current && (
            <div className="ml-auto text-right">
              <p className="text-lg font-medium text-muted-foreground">
                {streak.max}
              </p>
              <p className="text-xs text-muted-foreground">Best</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface WeeklyOverviewProps {
  days: ProtocolDay[];
}

export function WeeklyOverview({ days }: WeeklyOverviewProps) {
  const weekData = useMemo(() => {
    return days.slice(0, 7).map((day) => ({
      day,
      stats: calculateDayStats(day),
    }));
  }, [days]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Weekly Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {weekData.map(({ day, stats }, index) => {
            const dayLabel =
              day.dayNumber === 0
                ? 'T'
                : day.dayNumber > 0
                ? `D${day.dayNumber}`
                : `D${day.dayNumber}`;

            return (
              <div key={day.dayNumber} className="text-center">
                <p className="text-xs text-muted-foreground mb-1">{dayLabel}</p>
                <div
                  className={cn(
                    'h-8 w-8 mx-auto rounded-full flex items-center justify-center text-xs font-medium',
                    stats.percentage >= 80
                      ? 'bg-green-500 text-white'
                      : stats.percentage >= 50
                      ? 'bg-amber-500 text-white'
                      : stats.percentage > 0
                      ? 'bg-red-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {stats.percentage}%
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
