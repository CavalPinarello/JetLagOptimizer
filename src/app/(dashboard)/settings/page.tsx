'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Moon,
  Sun,
  Monitor,
  Bell,
  Pill,
  Coffee,
  Dumbbell,
  Clock,
  Save,
  LogOut,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useUserStore } from '@/stores/user-store';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import type { UserPreferences } from '@/types/user';

function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        checked ? 'bg-primary' : 'bg-muted',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, updatePreferences, logout } = useUserStore();
  const { theme, setTheme } = useUIStore();

  const [preferences, setPreferences] = useState<UserPreferences>(
    user?.preferences || {
      usesMelatonin: false,
      melatoninDose: 0.5,
      usesCreatine: false,
      creatineDose: 5,
      caffeineUser: true,
      caffeineCutoffHours: 6,
      exerciseFrequency: 'occasionally',
      preferredExerciseTime: 'flexible',
      darkMode: false,
      timeFormat: '24h',
      homeTimezone: 'UTC',
      aggressiveAdjustment: false,
      includeNapGuidance: true,
    }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    updatePreferences(preferences);
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Customize your experience and intervention preferences
        </p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Choose how the app looks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {[
              { value: 'light', icon: Sun, label: 'Light' },
              { value: 'dark', icon: Moon, label: 'Dark' },
              { value: 'system', icon: Monitor, label: 'System' },
            ].map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value as 'light' | 'dark' | 'system')}
                className={cn(
                  'flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors',
                  theme === value
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:bg-muted'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Intervention Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Intervention Preferences
          </CardTitle>
          <CardDescription>
            Configure which interventions to include in your protocols
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Melatonin */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Pill className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <p className="font-medium">Melatonin</p>
                <p className="text-sm text-muted-foreground">
                  Include melatonin timing recommendations
                </p>
              </div>
            </div>
            <ToggleSwitch
              checked={preferences.usesMelatonin}
              onChange={(checked) =>
                setPreferences({ ...preferences, usesMelatonin: checked })
              }
            />
          </div>

          {preferences.usesMelatonin && (
            <div className="ml-12 space-y-2">
              <Label htmlFor="melatoninDose">Typical dose (mg)</Label>
              <select
                id="melatoninDose"
                value={preferences.melatoninDose}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    melatoninDose: parseFloat(e.target.value) as 0.5 | 1 | 2 | 3 | 5,
                  })
                }
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value={0.5}>0.5 mg</option>
                <option value={1}>1 mg</option>
                <option value={2}>2 mg</option>
                <option value={3}>3 mg</option>
                <option value={5}>5 mg</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Research suggests 0.3-0.5mg is optimal for circadian shifting
              </p>
            </div>
          )}

          {/* Caffeine */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Coffee className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <p className="font-medium">Caffeine</p>
                <p className="text-sm text-muted-foreground">
                  Include caffeine cutoff recommendations
                </p>
              </div>
            </div>
            <ToggleSwitch
              checked={preferences.caffeineUser}
              onChange={(checked) =>
                setPreferences({ ...preferences, caffeineUser: checked })
              }
            />
          </div>

          {preferences.caffeineUser && (
            <div className="ml-12 space-y-2">
              <Label htmlFor="caffeineCutoff">Cutoff before bed (hours)</Label>
              <Input
                id="caffeineCutoff"
                type="number"
                min={4}
                max={12}
                step={1}
                value={preferences.caffeineCutoffHours}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    caffeineCutoffHours: parseInt(e.target.value) || 6,
                  })
                }
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                Stop caffeine this many hours before target bedtime.
              </p>
            </div>
          )}

          {/* Creatine */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <Pill className="h-4 w-4 text-cyan-500" />
              </div>
              <div>
                <p className="font-medium">Creatine</p>
                <p className="text-sm text-muted-foreground">
                  Include creatine timing for cognitive support
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                Research-backed
              </Badge>
            </div>
            <ToggleSwitch
              checked={preferences.usesCreatine}
              onChange={(checked) =>
                setPreferences({ ...preferences, usesCreatine: checked })
              }
            />
          </div>

          {/* Exercise */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Dumbbell className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">Exercise</p>
                <p className="text-sm text-muted-foreground">
                  Your typical exercise frequency
                </p>
              </div>
            </div>
            <select
              value={preferences.exerciseFrequency}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  exerciseFrequency: e.target.value as UserPreferences['exerciseFrequency'],
                })
              }
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="never">Never</option>
              <option value="occasionally">Occasionally</option>
              <option value="regularly">Regularly</option>
              <option value="daily">Daily</option>
            </select>
          </div>

          {preferences.exerciseFrequency !== 'never' && (
            <div className="ml-12 space-y-2">
              <Label>Preferred exercise time</Label>
              <select
                value={preferences.preferredExerciseTime}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    preferredExerciseTime: e.target.value as UserPreferences['preferredExerciseTime'],
                  })
                }
                className="rounded-md border border-input bg-background px-3 py-2 text-sm w-full"
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Protocol Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Protocol Preferences
          </CardTitle>
          <CardDescription>
            Fine-tune how protocols are generated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Aggressive adjustment</p>
              <p className="text-sm text-muted-foreground">
                Prefer faster adjustment with more interventions
              </p>
            </div>
            <ToggleSwitch
              checked={preferences.aggressiveAdjustment}
              onChange={(checked) =>
                setPreferences({ ...preferences, aggressiveAdjustment: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Include nap guidance</p>
              <p className="text-sm text-muted-foreground">
                Add power nap recommendations to protocols
              </p>
            </div>
            <ToggleSwitch
              checked={preferences.includeNapGuidance}
              onChange={(checked) =>
                setPreferences({ ...preferences, includeNapGuidance: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Time format</Label>
            <div className="flex gap-2">
              {['12h', '24h'].map((format) => (
                <button
                  key={format}
                  onClick={() =>
                    setPreferences({
                      ...preferences,
                      timeFormat: format as '12h' | '24h',
                    })
                  }
                  className={cn(
                    'px-4 py-2 rounded-md border text-sm',
                    preferences.timeFormat === format
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:bg-muted'
                  )}
                >
                  {format === '12h' ? '12-hour' : '24-hour'}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() =>
            setPreferences(
              user?.preferences || {
                usesMelatonin: false,
                melatoninDose: 0.5,
                usesCreatine: false,
                creatineDose: 5,
                caffeineUser: true,
                caffeineCutoffHours: 6,
                exerciseFrequency: 'occasionally',
                preferredExerciseTime: 'flexible',
                darkMode: false,
                timeFormat: '24h',
                homeTimezone: 'UTC',
                aggressiveAdjustment: false,
                includeNapGuidance: true,
              }
            )
          }
        >
          Reset
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            'Saving...'
          ) : saved ? (
            <>
              <Save className="mr-2 h-4 w-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Account Actions */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Account</CardTitle>
          <CardDescription>
            Manage your account settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
          <Button variant="destructive" className="w-full" disabled>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Account deletion will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
