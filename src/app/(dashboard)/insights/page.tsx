'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Sun, Moon, TrendingUp, AlertCircle, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CircadianClock,
  CircadianClockLegend,
} from '@/components/visualizations/circadian-clock';
import {
  PhaseProgression,
  AdjustmentProgress,
} from '@/components/visualizations/phase-progression';
import { useUserStore } from '@/stores/user-store';
import { useTripStore } from '@/stores/trip-store';
import {
  getAdvanceWindow,
  getDelayWindow,
} from '@/lib/circadian/dlmo-estimator';
import { estimateCBTminFromDLMO } from '@/lib/circadian/dlmo-estimator';

function getCurrentTimeString(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
}

function NoDataState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <TrendingUp className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">No Data Yet</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Complete your chronotype assessment and create a trip to see your
        circadian insights and visualizations.
      </p>
      <div className="flex gap-3">
        <Link href="/questionnaire">
          <Button variant="outline">
            Take Assessment
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <Link href="/trips/new">
          <Button>
            Plan a Trip
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const { user } = useUserStore();
  const { activeProtocol, activeTrip } = useTripStore();
  const [currentTime, setCurrentTime] = useState(getCurrentTimeString());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTimeString());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const profile = user?.circadianProfile;

  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Insights</h1>
          <p className="text-muted-foreground">
            Visualize your circadian rhythm and adjustment progress
          </p>
        </div>
        <NoDataState />
      </div>
    );
  }

  const dlmo = profile.estimatedDLMO;
  const cbtmin = profile.estimatedCBTmin;

  // Calculate windows based on current profile
  const advanceWindow = getAdvanceWindow(cbtmin);
  const delayWindow = getDelayWindow(cbtmin);

  // Determine current phase (are we in a light-sensitive window?)
  const currentHour = parseInt(currentTime.split(':')[0]);
  const isInAdvanceWindow = (() => {
    const [startH] = advanceWindow.start.split(':').map(Number);
    const [endH] = advanceWindow.end.split(':').map(Number);
    if (endH > startH) {
      return currentHour >= startH && currentHour < endH;
    }
    return currentHour >= startH || currentHour < endH;
  })();

  const isInDelayWindow = (() => {
    const [startH] = delayWindow.start.split(':').map(Number);
    const [endH] = delayWindow.end.split(':').map(Number);
    if (endH > startH) {
      return currentHour >= startH && currentHour < endH;
    }
    return currentHour >= startH || currentHour < endH;
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Insights</h1>
        <p className="text-muted-foreground">
          Visualize your circadian rhythm and adjustment progress
        </p>
      </div>

      {/* Current Status Alert */}
      {(isInAdvanceWindow || isInDelayWindow) && (
        <Card
          className={
            isInAdvanceWindow
              ? 'border-amber-500/50 bg-amber-500/5'
              : 'border-slate-500/50 bg-slate-500/5'
          }
        >
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              {isInAdvanceWindow ? (
                <Sun className="h-5 w-5 text-amber-500" />
              ) : (
                <Moon className="h-5 w-5 text-slate-500" />
              )}
              <div>
                <p className="font-medium">
                  {isInAdvanceWindow
                    ? 'Light Advance Window Active'
                    : 'Light Delay Window Active'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isInAdvanceWindow
                    ? 'Bright light now will advance your clock (good for eastward travel)'
                    : 'Bright light now will delay your clock (good for westward travel)'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Circadian Clock */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Your Circadian Clock
            </CardTitle>
            <CardDescription>
              24-hour visualization of your circadian markers and windows
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <CircadianClock
              dlmo={dlmo}
              cbtmin={cbtmin}
              currentTime={currentTime}
              lightSeekWindow={advanceWindow}
              lightAvoidWindow={delayWindow}
              sleepWindow={{
                start: profile.habitualBedtime,
                end: profile.habitualWakeTime,
              }}
              size={280}
            />
            <CircadianClockLegend className="mt-6" />
          </CardContent>
        </Card>

        {/* Key Markers */}
        <Card>
          <CardHeader>
            <CardTitle>Circadian Markers</CardTitle>
            <CardDescription>
              Your estimated biological timing markers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* DLMO */}
            <div className="flex items-center justify-between p-4 bg-purple-500/10 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">
                  DLMO (Melatonin Onset)
                </p>
                <p className="text-2xl font-bold text-purple-500">{dlmo}</p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>~2h before sleep onset</p>
                <p>Melatonin starts rising</p>
              </div>
            </div>

            {/* CBTmin */}
            <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">
                  CBTmin (Temp Minimum)
                </p>
                <p className="text-2xl font-bold text-blue-500">{cbtmin}</p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>~2-3h before wake</p>
                <p>Lowest body temperature</p>
              </div>
            </div>

            {/* Light Windows */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Sun className="h-4 w-4 text-amber-500" />
                  <p className="text-sm font-medium">Advance Window</p>
                </div>
                <p className="text-lg font-mono">
                  {advanceWindow.start} - {advanceWindow.end}
                </p>
                <p className="text-xs text-muted-foreground">
                  Light here advances clock
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Moon className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-medium">Delay Window</p>
                </div>
                <p className="text-lg font-mono">
                  {delayWindow.start} - {delayWindow.end}
                </p>
                <p className="text-xs text-muted-foreground">
                  Light here delays clock
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Protocol Progress (if active) */}
      {activeProtocol && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Adjustment Progress</CardTitle>
                <CardDescription>
                  {activeTrip?.name || 'Current trip'} - Phase shifting{' '}
                  {activeProtocol.direction === 'eastward' ? 'east' : 'west'}
                </CardDescription>
              </div>
              <Badge>
                {activeProtocol.direction === 'eastward' ? 'Advancing' : 'Delaying'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress bar */}
            <AdjustmentProgress
              progress={
                activeProtocol.days[activeProtocol.days.length - 1]
                  ?.adjustmentProgress || 0
              }
              direction={activeProtocol.direction}
              daysRemaining={
                activeProtocol.estimatedDaysToAdjust -
                activeProtocol.days.filter((d) => d.dayNumber > 0).length
              }
            />

            {/* Phase progression chart */}
            <PhaseProgression
              days={activeProtocol.days}
              targetDLMO={activeProtocol.targetBedtime} // Simplified - should calculate target DLMO
            />
          </CardContent>
        </Card>
      )}

      {/* Educational Info */}
      <Card>
        <CardHeader>
          <CardTitle>Understanding Your Circadian Rhythm</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Phase Response Curves</h4>
              <p className="text-sm text-muted-foreground">
                Light has different effects depending on when you see it
                relative to your CBTmin:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>
                  <strong>2-4h after CBTmin:</strong> Light causes phase advance
                  (earlier sleep)
                </li>
                <li>
                  <strong>6-8h before CBTmin:</strong> Light causes phase delay
                  (later sleep)
                </li>
                <li>
                  <strong>Midday:</strong> Minimal effect (dead zone)
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Key Terminology</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  <strong>DLMO:</strong> Dim Light Melatonin Onset - when your
                  body starts producing sleep hormone
                </li>
                <li>
                  <strong>CBTmin:</strong> Core Body Temperature minimum -
                  anchor point for circadian phase
                </li>
                <li>
                  <strong>Zeitgeber:</strong> Time-giver - environmental cues
                  that synchronize your clock
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
