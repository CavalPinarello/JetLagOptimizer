'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { cn } from '@/lib/utils';
import type { ProtocolDay } from '@/types/protocol';

interface PhaseProgressionProps {
  days: ProtocolDay[];
  targetDLMO: string;
  className?: string;
}

function timeToDecimal(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours + minutes / 60;
}

export function PhaseProgression({
  days,
  targetDLMO,
  className,
}: PhaseProgressionProps) {
  // Prepare data for chart
  const data = days.map((day) => ({
    day: day.dayNumber,
    label:
      day.dayNumber < 0
        ? `D${day.dayNumber}`
        : day.dayNumber === 0
        ? 'Travel'
        : `D+${day.dayNumber}`,
    dlmo: timeToDecimal(day.estimatedDLMO),
    cbtmin: timeToDecimal(day.estimatedCBTmin),
    progress: day.adjustmentProgress,
    phase: day.phase,
  }));

  const targetDLMODecimal = timeToDecimal(targetDLMO);

  // Format time for tooltip
  const formatTime = (value: number) => {
    const hours = Math.floor(value);
    const minutes = Math.round((value - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis
            domain={[18, 30]}
            tickFormatter={(value) => formatTime(value % 24)}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            label={{
              value: 'Time',
              angle: -90,
              position: 'insideLeft',
              className: 'fill-muted-foreground',
            }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const dlmo = payload.find((p) => p.dataKey === 'dlmo');
              const cbtmin = payload.find((p) => p.dataKey === 'cbtmin');
              const progress = payload[0]?.payload?.progress;

              return (
                <div className="bg-background border rounded-lg p-3 shadow-lg">
                  <p className="font-medium mb-2">{label}</p>
                  {dlmo && (
                    <p className="text-sm text-purple-500">
                      DLMO: {formatTime(dlmo.value as number)}
                    </p>
                  )}
                  {cbtmin && (
                    <p className="text-sm text-blue-500">
                      CBTmin: {formatTime(cbtmin.value as number)}
                    </p>
                  )}
                  {progress !== undefined && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Progress: {progress}%
                    </p>
                  )}
                </div>
              );
            }}
          />

          {/* Target DLMO reference line */}
          <ReferenceLine
            y={targetDLMODecimal}
            stroke="#22c55e"
            strokeDasharray="5 5"
            label={{
              value: `Target: ${formatTime(targetDLMODecimal)}`,
              position: 'right',
              className: 'fill-green-500 text-xs',
            }}
          />

          {/* DLMO line */}
          <Line
            type="monotone"
            dataKey="dlmo"
            stroke="#a855f7"
            strokeWidth={2}
            dot={{ fill: '#a855f7', r: 4 }}
            activeDot={{ r: 6 }}
            name="DLMO"
          />

          {/* CBTmin line */}
          <Line
            type="monotone"
            dataKey="cbtmin"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
            name="CBTmin"
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-muted-foreground">DLMO</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">CBTmin</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-green-500" style={{ width: 20 }} />
          <span className="text-muted-foreground">Target</span>
        </div>
      </div>
    </div>
  );
}

// Progress bar visualization
interface AdjustmentProgressProps {
  progress: number;
  direction: 'eastward' | 'westward';
  daysRemaining: number;
  className?: string;
}

export function AdjustmentProgress({
  progress,
  direction,
  daysRemaining,
  className,
}: AdjustmentProgressProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Adjustment Progress</span>
        <span className="font-medium">{progress}%</span>
      </div>

      <div className="relative h-4 bg-muted rounded-full overflow-hidden">
        {/* Progress bar */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
            direction === 'eastward'
              ? 'bg-gradient-to-r from-orange-500 to-amber-400'
              : 'bg-gradient-to-r from-blue-500 to-cyan-400'
          )}
          style={{ width: `${progress}%` }}
        />

        {/* Milestone markers */}
        {[25, 50, 75].map((milestone) => (
          <div
            key={milestone}
            className="absolute top-0 bottom-0 w-0.5 bg-background/50"
            style={{ left: `${milestone}%` }}
          />
        ))}
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Home</span>
        <span>
          {daysRemaining > 0
            ? `~${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`
            : 'Adjusted!'}
        </span>
        <span>Adjusted</span>
      </div>
    </div>
  );
}
