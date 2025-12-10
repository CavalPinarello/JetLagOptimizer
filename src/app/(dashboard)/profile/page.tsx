'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  User,
  Clock,
  Sun,
  Moon,
  Coffee,
  Pill,
  Dumbbell,
  Settings,
  ChevronRight,
  Check,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useUserStore } from '@/stores/user-store';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import { getChronotypeDescription } from '@/lib/circadian/chronotype';
import type { UserPreferences } from '@/types/user';

function ChronotypeCard() {
  const { user } = useUserStore();
  const profile = user?.circadianProfile;

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Chronotype Assessment
          </CardTitle>
          <CardDescription>
            Complete the assessment to get personalized protocols
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 mb-4">
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
            <p className="text-muted-foreground mb-4">
              Take the 5-minute MEQ questionnaire to determine your chronotype
            </p>
            <Link href="/questionnaire">
              <Button>
                Start Assessment
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chronotypeIcons: Record<string, React.ElementType> = {
    definite_morning: Sun,
    moderate_morning: Sun,
    intermediate: Clock,
    moderate_evening: Moon,
    definite_evening: Moon,
  };

  const Icon = chronotypeIcons[profile.chronotypeCategory];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              Your Chronotype
            </CardTitle>
            <CardDescription>
              {getChronotypeDescription(profile.chronotypeCategory)}
            </CardDescription>
          </div>
          <Link href="/questionnaire">
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retake
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-primary">{profile.meqScore}</p>
            <p className="text-xs text-muted-foreground">MEQ Score</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-purple-500">
              {profile.estimatedDLMO}
            </p>
            <p className="text-xs text-muted-foreground">DLMO</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-blue-500">
              {profile.estimatedCBTmin}
            </p>
            <p className="text-xs text-muted-foreground">CBTmin</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold">
              {Math.round(profile.averageSleepDuration / 60)}h{' '}
              {profile.averageSleepDuration % 60}m
            </p>
            <p className="text-xs text-muted-foreground">Avg Sleep</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Sleep Schedule</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Habitual</p>
              <p>
                {profile.habitualBedtime} - {profile.habitualWakeTime}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Work Days</p>
              <p>
                {profile.workdayBedtime} - {profile.workdayWakeTime}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PreferencesCard() {
  const { user, updatePreferences } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [prefs, setPrefs] = useState<Partial<UserPreferences>>(
    user?.preferences || {}
  );

  const handleSave = () => {
    updatePreferences(prefs);
    setIsEditing(false);
  };

  const togglePref = (key: keyof UserPreferences, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    if (!isEditing) {
      updatePreferences({ [key]: value });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Intervention Preferences
            </CardTitle>
            <CardDescription>
              Customize which interventions appear in your protocols
            </CardDescription>
          </div>
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Check className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Melatonin */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Pill className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="font-medium">Melatonin</p>
              <p className="text-sm text-muted-foreground">
                Include melatonin timing in protocols
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              togglePref('usesMelatonin', !prefs.usesMelatonin)
            }
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              prefs.usesMelatonin ? 'bg-primary' : 'bg-muted'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                prefs.usesMelatonin ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {prefs.usesMelatonin && (
          <div className="ml-12 space-y-2">
            <Label>Dose (mg)</Label>
            <div className="flex gap-2">
              {[0.5, 1, 2, 3, 5].map((dose) => (
                <button
                  key={dose}
                  onClick={() =>
                    setPrefs((prev) => ({
                      ...prev,
                      melatoninDose: dose as UserPreferences['melatoninDose'],
                    }))
                  }
                  className={cn(
                    'px-3 py-1 rounded-md text-sm border',
                    prefs.melatoninDose === dose
                      ? 'border-primary bg-primary/10'
                      : 'border-border'
                  )}
                >
                  {dose}mg
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Caffeine */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Coffee className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="font-medium">Caffeine</p>
              <p className="text-sm text-muted-foreground">
                Include caffeine cutoff guidance
              </p>
            </div>
          </div>
          <button
            onClick={() => togglePref('caffeineUser', !prefs.caffeineUser)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              prefs.caffeineUser ? 'bg-primary' : 'bg-muted'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                prefs.caffeineUser ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {prefs.caffeineUser && (
          <div className="ml-12 space-y-2">
            <Label>Cutoff before bed (hours)</Label>
            <Input
              type="number"
              min={4}
              max={12}
              value={prefs.caffeineCutoffHours || 6}
              onChange={(e) =>
                setPrefs((prev) => ({
                  ...prev,
                  caffeineCutoffHours: Number(e.target.value),
                }))
              }
              className="w-24"
            />
          </div>
        )}

        {/* Exercise */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Dumbbell className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium">Exercise</p>
              <p className="text-sm text-muted-foreground">
                Include exercise timing recommendations
              </p>
            </div>
          </div>
          <Badge variant="outline">Always On</Badge>
        </div>

        {/* Aggressive Adjustment */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            <p className="font-medium">Aggressive Adjustment</p>
            <p className="text-sm text-muted-foreground">
              Faster adjustment with more interventions per day
            </p>
          </div>
          <button
            onClick={() =>
              togglePref('aggressiveAdjustment', !prefs.aggressiveAdjustment)
            }
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              prefs.aggressiveAdjustment ? 'bg-primary' : 'bg-muted'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                prefs.aggressiveAdjustment ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {/* Nap Guidance */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Nap Guidance</p>
            <p className="text-sm text-muted-foreground">
              Include power nap recommendations during adjustment
            </p>
          </div>
          <button
            onClick={() =>
              togglePref('includeNapGuidance', !prefs.includeNapGuidance)
            }
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              prefs.includeNapGuidance !== false ? 'bg-primary' : 'bg-muted'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                prefs.includeNapGuidance !== false
                  ? 'translate-x-6'
                  : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function DisplayPreferencesCard() {
  const { timeFormat, setTimeFormat, theme, setTheme } = useUIStore();
  const { user, updatePreferences } = useUserStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Display Preferences</CardTitle>
        <CardDescription>Customize how information is displayed</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Time Format */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Time Format</p>
            <p className="text-sm text-muted-foreground">
              {timeFormat === '12h' ? '12-hour (AM/PM)' : '24-hour'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeFormat('12h')}
              className={cn(
                'px-3 py-1 rounded-md text-sm border',
                timeFormat === '12h'
                  ? 'border-primary bg-primary/10'
                  : 'border-border'
              )}
            >
              12h
            </button>
            <button
              onClick={() => setTimeFormat('24h')}
              className={cn(
                'px-3 py-1 rounded-md text-sm border',
                timeFormat === '24h'
                  ? 'border-primary bg-primary/10'
                  : 'border-border'
              )}
            >
              24h
            </button>
          </div>
        </div>

        {/* Theme */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Theme</p>
            <p className="text-sm text-muted-foreground">
              {theme === 'system'
                ? 'System default'
                : theme === 'dark'
                ? 'Dark mode'
                : 'Light mode'}
            </p>
          </div>
          <div className="flex gap-2">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  'px-3 py-1 rounded-md text-sm border capitalize',
                  theme === t
                    ? 'border-primary bg-primary/10'
                    : 'border-border'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  const { user } = useUserStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your chronotype and preferences
        </p>
      </div>

      {/* User Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {user?.name || 'Traveler'}
              </h2>
              <p className="text-muted-foreground">
                {user?.email || 'No email set'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chronotype */}
      <ChronotypeCard />

      {/* Intervention Preferences */}
      <PreferencesCard />

      {/* Display Preferences */}
      <DisplayPreferencesCard />
    </div>
  );
}
