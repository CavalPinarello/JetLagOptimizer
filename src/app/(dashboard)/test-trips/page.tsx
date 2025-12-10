'use client';

import { useState, useEffect } from 'react';
import { Plane, ArrowRight, Clock, CheckCircle2, Sun, Moon, Pill, Coffee, Utensils, Dumbbell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { generateProtocol } from '@/lib/circadian/protocol-generator';
import { useUserStore } from '@/stores/user-store';
import { useTripStore } from '@/stores/trip-store';
import { generateId } from '@/lib/utils';
import type { Trip } from '@/types/trip';
import type { Protocol, InterventionType } from '@/types/protocol';
import type { CircadianProfile } from '@/types/user';
import { DEFAULT_USER_PREFERENCES } from '@/types/user';

// Test scenarios representing different travel patterns
const testScenarios: Omit<Trip, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'NYC to London (Eastward +5h)',
    originCity: 'New York',
    originTimezone: 'America/New_York',
    originAirport: 'JFK',
    originOffsetMinutes: -300, // EST = UTC-5
    destinationCity: 'London',
    destinationTimezone: 'Europe/London',
    destinationAirport: 'LHR',
    destinationOffsetMinutes: 0, // GMT = UTC
    departureDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    arrivalDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000), // +7 hours flight
    flightDuration: 420, // 7 hours
    timezoneShiftHours: 5,
    direction: 'eastward',
    hasReturnTrip: false,
    returnDepartureDateTime: null,
    returnArrivalDateTime: null,
    tripDurationDays: 7,
    isShortTrip: false,
    protocolId: null,
    protocolGeneratedAt: null,
    status: 'upcoming',
  },
  {
    name: 'London to LA (Westward -8h)',
    originCity: 'London',
    originTimezone: 'Europe/London',
    originAirport: 'LHR',
    originOffsetMinutes: 0,
    destinationCity: 'Los Angeles',
    destinationTimezone: 'America/Los_Angeles',
    destinationAirport: 'LAX',
    destinationOffsetMinutes: -480, // PST = UTC-8
    departureDateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    arrivalDateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000),
    flightDuration: 660, // 11 hours
    timezoneShiftHours: -8,
    direction: 'westward',
    hasReturnTrip: false,
    returnDepartureDateTime: null,
    returnArrivalDateTime: null,
    tripDurationDays: 10,
    isShortTrip: false,
    protocolId: null,
    protocolGeneratedAt: null,
    status: 'upcoming',
  },
  {
    name: 'NYC to Tokyo (Eastward +14h)',
    originCity: 'New York',
    originTimezone: 'America/New_York',
    originAirport: 'JFK',
    originOffsetMinutes: -300,
    destinationCity: 'Tokyo',
    destinationTimezone: 'Asia/Tokyo',
    destinationAirport: 'NRT',
    destinationOffsetMinutes: 540, // JST = UTC+9
    departureDateTime: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    arrivalDateTime: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
    flightDuration: 840, // 14 hours
    timezoneShiftHours: 14,
    direction: 'eastward',
    hasReturnTrip: false,
    returnDepartureDateTime: null,
    returnArrivalDateTime: null,
    tripDurationDays: 14,
    isShortTrip: false,
    protocolId: null,
    protocolGeneratedAt: null,
    status: 'upcoming',
  },
  {
    name: 'Sydney to Dubai (Westward -7h)',
    originCity: 'Sydney',
    originTimezone: 'Australia/Sydney',
    originAirport: 'SYD',
    originOffsetMinutes: 660, // AEDT = UTC+11
    destinationCity: 'Dubai',
    destinationTimezone: 'Asia/Dubai',
    destinationAirport: 'DXB',
    destinationOffsetMinutes: 240, // GST = UTC+4
    departureDateTime: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    arrivalDateTime: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
    flightDuration: 840, // 14 hours
    timezoneShiftHours: -7,
    direction: 'westward',
    hasReturnTrip: false,
    returnDepartureDateTime: null,
    returnArrivalDateTime: null,
    tripDurationDays: 5,
    isShortTrip: false,
    protocolId: null,
    protocolGeneratedAt: null,
    status: 'upcoming',
  },
];

// Default test circadian profile (moderate morning type)
const testCircadianProfile: CircadianProfile = {
  meqScore: 55,
  mctqMSFsc: null,
  chronotypeCategory: 'intermediate',
  estimatedDLMO: '21:00',
  estimatedCBTmin: '04:30',
  habitualBedtime: '23:00',
  habitualWakeTime: '07:00',
  averageSleepDuration: 480,
  workdayBedtime: '23:00',
  workdayWakeTime: '07:00',
  freedayBedtime: '00:00',
  freedayWakeTime: '08:00',
  usesAlarmOnFreedays: false,
  lastAssessmentDate: new Date(),
  assessmentMethod: 'MEQ',
};

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

function ProtocolSummary({ protocol, trip }: { protocol: Protocol; trip: Trip }) {
  const totalInterventions = protocol.days.reduce((acc, day) => acc + day.interventions.length, 0);
  const criticalInterventions = protocol.days.reduce(
    (acc, day) => acc + day.interventions.filter((i) => i.priority === 'critical').length,
    0
  );

  // Count intervention types
  const interventionCounts: Record<string, number> = {};
  protocol.days.forEach((day) => {
    day.interventions.forEach((intervention) => {
      interventionCounts[intervention.type] = (interventionCounts[intervention.type] || 0) + 1;
    });
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{trip.name}</CardTitle>
            <CardDescription>
              {trip.originCity} <ArrowRight className="inline h-3 w-3" /> {trip.destinationCity}
            </CardDescription>
          </div>
          <Badge variant={trip.direction === 'eastward' ? 'default' : 'secondary'}>
            {trip.direction === 'eastward' ? 'Eastward' : 'Westward'} {trip.timezoneShiftHours > 0 ? '+' : ''}
            {trip.timezoneShiftHours}h
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Protocol Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-muted-foreground">Duration</p>
            <p className="font-bold text-lg">{protocol.days.length} days</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-muted-foreground">Est. Adjust Time</p>
            <p className="font-bold text-lg">{protocol.estimatedDaysToAdjust} days</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-muted-foreground">Rate</p>
            <p className="font-bold text-lg">{protocol.adjustmentRatePerDay.toFixed(1)}h/day</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-muted-foreground">Interventions</p>
            <p className="font-bold text-lg">{totalInterventions} total</p>
          </div>
        </div>

        {/* Intervention breakdown */}
        <div>
          <p className="text-sm font-medium mb-2">Intervention Types:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(interventionCounts).map(([type, count]) => {
              const Icon = interventionIcons[type as InterventionType];
              return (
                <Badge key={type} variant="outline" className="flex items-center gap-1">
                  <Icon className="h-3 w-3" />
                  {type.replace('_', ' ')}: {count}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Day-by-day preview */}
        <div>
          <p className="text-sm font-medium mb-2">Day Overview:</p>
          <div className="flex flex-wrap gap-1">
            {protocol.days.map((day) => (
              <div
                key={day.dayNumber}
                className="w-8 h-8 rounded flex items-center justify-center text-xs font-medium"
                style={{
                  backgroundColor: `hsl(${120 * (day.adjustmentProgress / 100)}, 70%, 50%)`,
                  color: day.adjustmentProgress > 50 ? 'white' : 'black',
                }}
                title={`Day ${day.dayNumber}: ${day.adjustmentProgress}% adjusted`}
              >
                {day.dayNumber === 0 ? 'T' : day.dayNumber > 0 ? day.dayNumber : day.dayNumber}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            T = Travel day, colors show adjustment progress (red → green)
          </p>
        </div>

        {/* Sample day details */}
        <div>
          <p className="text-sm font-medium mb-2">Sample Day (Day 1):</p>
          <div className="space-y-1">
            {protocol.days
              .find((d) => d.dayNumber === 1)
              ?.interventions.slice(0, 5)
              .map((intervention) => {
                const Icon = interventionIcons[intervention.type];
                return (
                  <div key={intervention.id} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{intervention.startTime}</span>
                    <span className="text-muted-foreground">{intervention.title}</span>
                    {intervention.priority === 'critical' && (
                      <Badge variant="destructive" className="ml-auto text-xs">
                        Critical
                      </Badge>
                    )}
                  </div>
                );
              })}
            {(protocol.days.find((d) => d.dayNumber === 1)?.interventions.length || 0) > 5 && (
              <p className="text-xs text-muted-foreground">
                +{(protocol.days.find((d) => d.dayNumber === 1)?.interventions.length || 0) - 5} more interventions
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TestTripsPage() {
  const { user } = useUserStore();
  const { addTrip } = useTripStore();
  const [protocols, setProtocols] = useState<{ trip: Trip; protocol: Protocol }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chronotypeVariant, setChronotypeVariant] = useState<'morning' | 'intermediate' | 'evening'>('intermediate');

  const getChronotypeProfile = (variant: 'morning' | 'intermediate' | 'evening'): CircadianProfile => {
    const profiles: Record<string, CircadianProfile> = {
      morning: {
        ...testCircadianProfile,
        meqScore: 68,
        chronotypeCategory: 'moderate_morning',
        estimatedDLMO: '19:30',
        estimatedCBTmin: '03:00',
        habitualBedtime: '22:00',
        habitualWakeTime: '06:00',
      },
      intermediate: testCircadianProfile,
      evening: {
        ...testCircadianProfile,
        meqScore: 35,
        chronotypeCategory: 'moderate_evening',
        estimatedDLMO: '23:00',
        estimatedCBTmin: '06:00',
        habitualBedtime: '01:00',
        habitualWakeTime: '09:00',
      },
    };
    return profiles[variant];
  };

  const generateAllProtocols = async () => {
    setIsGenerating(true);
    setProtocols([]);

    const profile = getChronotypeProfile(chronotypeVariant);
    const results: { trip: Trip; protocol: Protocol }[] = [];

    for (const scenario of testScenarios) {
      const trip: Trip = {
        ...scenario,
        id: generateId(),
        userId: user?.id || 'test-user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      try {
        const protocol = generateProtocol({
          trip,
          circadianProfile: profile,
          preferences: user?.preferences || DEFAULT_USER_PREFERENCES,
        });

        results.push({ trip, protocol });
      } catch (error) {
        console.error(`Error generating protocol for ${trip.name}:`, error);
      }

      // Small delay to simulate processing
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setProtocols(results);
    setIsGenerating(false);
  };

  const addTestTripsToStore = () => {
    protocols.forEach(({ trip }) => {
      addTrip(trip);
    });
    alert(`Added ${protocols.length} test trips to your trips list!`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Test Multiple Trips</h1>
        <p className="text-muted-foreground">
          Generate and compare protocols for different travel scenarios
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
          <CardDescription>Choose chronotype and generate protocols for all test scenarios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Chronotype:</p>
            <div className="flex gap-2">
              {(['morning', 'intermediate', 'evening'] as const).map((type) => (
                <Button
                  key={type}
                  variant={chronotypeVariant === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChronotypeVariant(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)} Type
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Morning types adapt easier eastward, evening types adapt easier westward
            </p>
          </div>

          <div className="flex gap-3">
            <Button onClick={generateAllProtocols} disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Generate All Protocols'}
            </Button>
            {protocols.length > 0 && (
              <Button variant="outline" onClick={addTestTripsToStore}>
                Add Trips to Store
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Scenarios Description */}
      <Card>
        <CardHeader>
          <CardTitle>Test Scenarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {testScenarios.map((scenario, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <Plane className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{scenario.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {scenario.originCity} → {scenario.destinationCity} ({scenario.tripDurationDays} days)
                  </p>
                </div>
                <Badge variant={scenario.direction === 'eastward' ? 'default' : 'secondary'} className="ml-auto">
                  {scenario.direction}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generated Protocols */}
      {protocols.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Generated Protocols</h2>
          <p className="text-sm text-muted-foreground">
            Using {chronotypeVariant} chronotype profile (DLMO: {getChronotypeProfile(chronotypeVariant).estimatedDLMO}
            , CBTmin: {getChronotypeProfile(chronotypeVariant).estimatedCBTmin})
          </p>
          {protocols.map(({ trip, protocol }) => (
            <ProtocolSummary key={trip.id} protocol={protocol} trip={trip} />
          ))}
        </div>
      )}

      {/* Summary Statistics */}
      {protocols.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Summary Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Trip</th>
                    <th className="text-right py-2">Shift</th>
                    <th className="text-right py-2">Est. Days</th>
                    <th className="text-right py-2">Rate</th>
                    <th className="text-right py-2">Total Interventions</th>
                    <th className="text-right py-2">Critical</th>
                  </tr>
                </thead>
                <tbody>
                  {protocols.map(({ trip, protocol }) => {
                    const totalInterventions = protocol.days.reduce((acc, d) => acc + d.interventions.length, 0);
                    const critical = protocol.days.reduce(
                      (acc, d) => acc + d.interventions.filter((i) => i.priority === 'critical').length,
                      0
                    );
                    return (
                      <tr key={trip.id} className="border-b">
                        <td className="py-2">{trip.name}</td>
                        <td className="text-right py-2">
                          {trip.timezoneShiftHours > 0 ? '+' : ''}
                          {trip.timezoneShiftHours}h
                        </td>
                        <td className="text-right py-2">{protocol.estimatedDaysToAdjust}</td>
                        <td className="text-right py-2">{protocol.adjustmentRatePerDay.toFixed(1)}h/day</td>
                        <td className="text-right py-2">{totalInterventions}</td>
                        <td className="text-right py-2">{critical}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
