'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface CircadianClockProps {
  dlmo: string;
  cbtmin: string;
  currentTime?: string;
  lightSeekWindow?: { start: string; end: string };
  lightAvoidWindow?: { start: string; end: string };
  sleepWindow?: { start: string; end: string };
  size?: number;
  className?: string;
}

function timeToAngle(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  // Convert to angle (0 degrees = 12:00, clockwise)
  const totalHours = hours + minutes / 60;
  return (totalHours / 24) * 360 - 90; // -90 to start at top
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  // Handle arc crossing midnight
  let adjustedEndAngle = endAngle;
  if (endAngle < startAngle) {
    adjustedEndAngle += 360;
  }

  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, adjustedEndAngle);
  const largeArcFlag = adjustedEndAngle - startAngle <= 180 ? 0 : 1;

  return [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    1,
    end.x,
    end.y,
  ].join(' ');
}

export function CircadianClock({
  dlmo,
  cbtmin,
  currentTime,
  lightSeekWindow,
  lightAvoidWindow,
  sleepWindow,
  size = 300,
  className,
}: CircadianClockProps) {
  const center = size / 2;
  const outerRadius = size / 2 - 10;
  const innerRadius = outerRadius - 30;
  const markerRadius = innerRadius - 15;

  // Convert times to angles
  const dlmoAngle = timeToAngle(dlmo);
  const cbtminAngle = timeToAngle(cbtmin);
  const currentAngle = currentTime ? timeToAngle(currentTime) : null;

  // Hour markers
  const hourMarkers = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const angle = (i / 24) * 360 - 90;
      const isMajor = i % 6 === 0;
      const r1 = isMajor ? outerRadius - 8 : outerRadius - 5;
      const r2 = outerRadius;
      const start = polarToCartesian(center, center, r1, angle);
      const end = polarToCartesian(center, center, r2, angle);
      const labelPos = polarToCartesian(center, center, innerRadius - 25, angle);

      return { i, angle, start, end, labelPos, isMajor };
    });
  }, [center, outerRadius, innerRadius]);

  // Day/night gradient
  const dayNightGradientId = `daynight-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn('', className)}
    >
      <defs>
        {/* Day/night gradient */}
        <linearGradient
          id={dayNightGradientId}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#1e293b" /> {/* Night */}
          <stop offset="25%" stopColor="#fbbf24" /> {/* Dawn */}
          <stop offset="50%" stopColor="#f59e0b" /> {/* Day */}
          <stop offset="75%" stopColor="#fbbf24" /> {/* Dusk */}
          <stop offset="100%" stopColor="#1e293b" /> {/* Night */}
        </linearGradient>
      </defs>

      {/* Background circle with day/night */}
      <circle
        cx={center}
        cy={center}
        r={outerRadius}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-border"
      />

      {/* Inner circle */}
      <circle
        cx={center}
        cy={center}
        r={innerRadius}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        className="text-border/50"
      />

      {/* Sleep window arc */}
      {sleepWindow && (
        <path
          d={describeArc(
            center,
            center,
            outerRadius - 15,
            timeToAngle(sleepWindow.start),
            timeToAngle(sleepWindow.end)
          )}
          fill="none"
          stroke="#6366f1"
          strokeWidth="20"
          strokeLinecap="round"
          opacity="0.3"
        />
      )}

      {/* Light seek window arc */}
      {lightSeekWindow && (
        <path
          d={describeArc(
            center,
            center,
            outerRadius - 15,
            timeToAngle(lightSeekWindow.start),
            timeToAngle(lightSeekWindow.end)
          )}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="20"
          strokeLinecap="round"
          opacity="0.4"
        />
      )}

      {/* Light avoid window arc */}
      {lightAvoidWindow && (
        <path
          d={describeArc(
            center,
            center,
            outerRadius - 15,
            timeToAngle(lightAvoidWindow.start),
            timeToAngle(lightAvoidWindow.end)
          )}
          fill="none"
          stroke="#64748b"
          strokeWidth="20"
          strokeLinecap="round"
          opacity="0.3"
        />
      )}

      {/* Hour markers */}
      {hourMarkers.map(({ i, start, end, labelPos, isMajor }) => (
        <g key={i}>
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke="currentColor"
            strokeWidth={isMajor ? 2 : 1}
            className="text-foreground/50"
          />
          {isMajor && (
            <text
              x={labelPos.x}
              y={labelPos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="12"
              className="fill-muted-foreground font-medium"
            >
              {i === 0 ? '00' : i}
            </text>
          )}
        </g>
      ))}

      {/* DLMO marker */}
      <g>
        {(() => {
          const pos = polarToCartesian(center, center, markerRadius, dlmoAngle);
          return (
            <>
              <circle cx={pos.x} cy={pos.y} r="8" fill="#a855f7" />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="8"
                fill="white"
                fontWeight="bold"
              >
                D
              </text>
            </>
          );
        })()}
      </g>

      {/* CBTmin marker */}
      <g>
        {(() => {
          const pos = polarToCartesian(center, center, markerRadius, cbtminAngle);
          return (
            <>
              <circle cx={pos.x} cy={pos.y} r="8" fill="#3b82f6" />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="8"
                fill="white"
                fontWeight="bold"
              >
                T
              </text>
            </>
          );
        })()}
      </g>

      {/* Current time hand */}
      {currentAngle !== null && (
        <g>
          {(() => {
            const pos = polarToCartesian(center, center, innerRadius - 5, currentAngle);
            return (
              <>
                <line
                  x1={center}
                  y1={center}
                  x2={pos.x}
                  y2={pos.y}
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx={center} cy={center} r="4" fill="#ef4444" />
              </>
            );
          })()}
        </g>
      )}

      {/* Center label */}
      <text
        x={center}
        y={center + 40}
        textAnchor="middle"
        fontSize="10"
        className="fill-muted-foreground"
      >
        24-hour clock
      </text>
    </svg>
  );
}

// Legend component
export function CircadianClockLegend({ className }: { className?: string }) {
  const items = [
    { color: '#a855f7', label: 'DLMO (Melatonin Onset)' },
    { color: '#3b82f6', label: 'CBTmin (Temp Minimum)' },
    { color: '#f59e0b', label: 'Light Seek Window', opacity: 0.4 },
    { color: '#64748b', label: 'Light Avoid Window', opacity: 0.3 },
    { color: '#6366f1', label: 'Sleep Window', opacity: 0.3 },
    { color: '#ef4444', label: 'Current Time' },
  ];

  return (
    <div className={cn('flex flex-wrap gap-4 text-sm', className)}>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: item.color,
              opacity: item.opacity || 1,
            }}
          />
          <span className="text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
