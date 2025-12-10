'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plane,
  MapPin,
  Calendar,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Check,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useTripStore } from '@/stores/trip-store';
import { useUserStore } from '@/stores/user-store';
import { generateId } from '@/lib/utils';
import { generateProtocol } from '@/lib/circadian/protocol-generator';
import {
  calculateTimezoneShift,
  getTripDirection,
  isShortTrip,
  calculateFlightDuration,
  getEstimatedAdjustmentDays,
} from '@/types/trip';
import type { Trip } from '@/types/trip';
import {
  POPULAR_CITIES,
  searchCities,
  formatOffset,
  type CityTimezone,
} from '@/lib/timezone/cities';
import { DEFAULT_USER_PREFERENCES } from '@/types/user';

type WizardStep = 'origin' | 'destination' | 'dates' | 'review';

interface TripFormData {
  name: string;
  origin: CityTimezone | null;
  destination: CityTimezone | null;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  tripDurationDays: number;
}

const initialFormData: TripFormData = {
  name: '',
  origin: null,
  destination: null,
  departureDate: '',
  departureTime: '09:00',
  arrivalDate: '',
  arrivalTime: '14:00',
  tripDurationDays: 7,
};

function CitySelector({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: CityTimezone | null;
  onSelect: (city: CityTimezone) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCities = useMemo(() => {
    return searchCities(searchQuery);
  }, [searchQuery]);

  return (
    <div className="space-y-4">
      <Label>{label}</Label>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search cities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* City Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
        {filteredCities.map((city) => (
          <button
            key={`${city.city}-${city.country}`}
            type="button"
            onClick={() => onSelect(city)}
            className={`p-3 rounded-lg border text-left transition-all ${
              selected?.city === city.city && selected?.country === city.country
                ? 'border-primary bg-primary/5 ring-2 ring-primary'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <p className="font-medium text-sm truncate">{city.city}</p>
            <p className="text-xs text-muted-foreground truncate">
              {city.country} • {formatOffset(city.offset)}
            </p>
            {city.airport && (
              <p className="text-xs text-muted-foreground">{city.airport}</p>
            )}
          </button>
        ))}
      </div>

      {selected && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm">
            <span className="font-medium">Selected:</span> {selected.city}, {selected.country}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatOffset(selected.offset)} • {selected.timezone}
            {selected.airport && ` • ${selected.airport}`}
          </p>
        </div>
      )}
    </div>
  );
}

export default function NewTripPage() {
  const router = useRouter();
  const { addTrip, setActiveTrip, setActiveProtocol } = useTripStore();
  const { user } = useUserStore();

  const [step, setStep] = useState<WizardStep>('origin');
  const [formData, setFormData] = useState<TripFormData>(initialFormData);
  const [isGenerating, setIsGenerating] = useState(false);

  const steps: WizardStep[] = ['origin', 'destination', 'dates', 'review'];
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Calculate trip details for review
  const timezoneShift = formData.origin && formData.destination
    ? calculateTimezoneShift(
        formData.origin.offset * 60,
        formData.destination.offset * 60
      )
    : 0;
  const direction = getTripDirection(timezoneShift);
  const isShort = isShortTrip(formData.tripDurationDays, timezoneShift);
  const estimatedDays = getEstimatedAdjustmentDays(timezoneShift, true);

  const canProceed = () => {
    switch (step) {
      case 'origin':
        return formData.origin !== null;
      case 'destination':
        return formData.destination !== null;
      case 'dates':
        return formData.departureDate && formData.arrivalDate;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

  const handleCreateTrip = async () => {
    if (!formData.origin || !formData.destination) return;

    setIsGenerating(true);

    try {
      // Create departure and arrival dates
      const departureDateTime = new Date(
        `${formData.departureDate}T${formData.departureTime}`
      );
      const arrivalDateTime = new Date(
        `${formData.arrivalDate}T${formData.arrivalTime}`
      );

      const flightDuration = calculateFlightDuration(
        departureDateTime,
        arrivalDateTime
      );

      const tripName = formData.name || `${formData.origin.city} to ${formData.destination.city}`;

      const trip: Trip = {
        id: generateId(),
        userId: user?.id || 'demo-user',
        name: tripName,
        createdAt: new Date(),
        updatedAt: new Date(),
        originCity: formData.origin.city,
        originTimezone: formData.origin.timezone,
        originAirport: formData.origin.airport,
        originOffsetMinutes: formData.origin.offset * 60,
        destinationCity: formData.destination.city,
        destinationTimezone: formData.destination.timezone,
        destinationAirport: formData.destination.airport,
        destinationOffsetMinutes: formData.destination.offset * 60,
        departureDateTime,
        arrivalDateTime,
        flightDuration,
        timezoneShiftHours: timezoneShift,
        direction,
        hasReturnTrip: false,
        returnDepartureDateTime: null,
        returnArrivalDateTime: null,
        tripDurationDays: formData.tripDurationDays,
        isShortTrip: isShort,
        protocolId: null,
        protocolGeneratedAt: null,
        status: 'upcoming',
      };

      // Add trip to store
      addTrip(trip);
      setActiveTrip(trip.id);

      // Generate protocol with default profile for demo
      const defaultProfile = user?.circadianProfile || {
        meqScore: 55,
        mctqMSFsc: null,
        chronotypeCategory: 'intermediate' as const,
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
        assessmentMethod: 'MEQ' as const,
      };

      const protocol = generateProtocol({
        trip,
        circadianProfile: defaultProfile,
        preferences: user?.preferences || DEFAULT_USER_PREFERENCES,
      });
      setActiveProtocol(protocol);

      router.push(`/trips/${trip.id}`);
    } catch (error) {
      console.error('Error creating trip:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">New Trip</h1>
          <span className="text-sm text-muted-foreground">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Step: Origin */}
      {step === 'origin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Where are you traveling from?
            </CardTitle>
            <CardDescription>
              Select your departure city
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CitySelector
              label="Origin City"
              selected={formData.origin}
              onSelect={(city) => setFormData((prev) => ({ ...prev, origin: city }))}
            />
          </CardContent>
        </Card>
      )}

      {/* Step: Destination */}
      {step === 'destination' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Where are you traveling to?
            </CardTitle>
            <CardDescription>
              Select your destination city
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CitySelector
              label="Destination City"
              selected={formData.destination}
              onSelect={(city) => setFormData((prev) => ({ ...prev, destination: city }))}
            />
          </CardContent>
        </Card>
      )}

      {/* Step: Dates */}
      {step === 'dates' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              When are you traveling?
            </CardTitle>
            <CardDescription>
              Enter your flight times and trip duration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Trip Name */}
            <div>
              <Label htmlFor="name">Trip Name (optional)</Label>
              <Input
                id="name"
                placeholder={formData.origin && formData.destination
                  ? `${formData.origin.city} to ${formData.destination.city}`
                  : 'My Trip'
                }
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            {/* Departure */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="departureDate">Departure Date</Label>
                <Input
                  id="departureDate"
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, departureDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="departureTime">Departure Time</Label>
                <Input
                  id="departureTime"
                  type="time"
                  value={formData.departureTime}
                  onChange={(e) => setFormData((prev) => ({ ...prev, departureTime: e.target.value }))}
                />
              </div>
            </div>

            {/* Arrival */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="arrivalDate">Arrival Date</Label>
                <Input
                  id="arrivalDate"
                  type="date"
                  value={formData.arrivalDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, arrivalDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="arrivalTime">Arrival Time (local)</Label>
                <Input
                  id="arrivalTime"
                  type="time"
                  value={formData.arrivalTime}
                  onChange={(e) => setFormData((prev) => ({ ...prev, arrivalTime: e.target.value }))}
                />
              </div>
            </div>

            {/* Trip Duration */}
            <div>
              <Label htmlFor="duration">Trip Duration (days at destination)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                max={90}
                value={formData.tripDurationDays}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, tripDurationDays: Number(e.target.value) }))
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Review */}
      {step === 'review' && formData.origin && formData.destination && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              Review Your Trip
            </CardTitle>
            <CardDescription>
              Confirm your trip details before generating your protocol
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Route Summary */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="text-center">
                <p className="font-bold text-lg">{formData.origin.city}</p>
                <p className="text-sm text-muted-foreground">
                  {formatOffset(formData.origin.offset)}
                </p>
                {formData.origin.airport && (
                  <p className="text-xs text-muted-foreground">{formData.origin.airport}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                <Badge variant={direction === 'eastward' ? 'default' : 'secondary'}>
                  {direction === 'eastward' ? 'East' : 'West'}
                </Badge>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{formData.destination.city}</p>
                <p className="text-sm text-muted-foreground">
                  {formatOffset(formData.destination.offset)}
                </p>
                {formData.destination.airport && (
                  <p className="text-xs text-muted-foreground">{formData.destination.airport}</p>
                )}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 border rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {timezoneShift > 0 ? '+' : ''}
                  {timezoneShift}h
                </p>
                <p className="text-xs text-muted-foreground">Timezone Shift</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-2xl font-bold">{estimatedDays}</p>
                <p className="text-xs text-muted-foreground">Days to Adjust</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-2xl font-bold">{formData.tripDurationDays}</p>
                <p className="text-xs text-muted-foreground">Trip Duration</p>
              </div>
            </div>

            {/* Adjustment Rate Info */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm">
              <p className="font-medium text-blue-700">
                {direction === 'eastward' ? 'Eastward Travel (Phase Advance)' : 'Westward Travel (Phase Delay)'}
              </p>
              <p className="text-muted-foreground">
                {direction === 'eastward'
                  ? 'Flying east is harder on your body. With our interventions, you can adjust ~1.5 hours per day.'
                  : 'Flying west is easier. With our interventions, you can adjust ~2 hours per day.'}
              </p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Departure</p>
                <p className="font-medium">
                  {formData.departureDate} at {formData.departureTime}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Arrival</p>
                <p className="font-medium">
                  {formData.arrivalDate} at {formData.arrivalTime}
                </p>
              </div>
            </div>

            {/* Short Trip Warning */}
            {isShort && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/50 rounded-lg text-sm">
                <p className="font-medium text-amber-600">Short Trip Detected</p>
                <p className="text-muted-foreground">
                  For trips under 3 days with large timezone shifts, full
                  adjustment may not be recommended. Your protocol will be
                  optimized accordingly.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStepIndex === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {step === 'review' ? (
          <Button onClick={handleCreateTrip} disabled={isGenerating}>
            {isGenerating ? (
              'Generating Protocol...'
            ) : (
              <>
                Create Trip & Generate Protocol
                <Check className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
