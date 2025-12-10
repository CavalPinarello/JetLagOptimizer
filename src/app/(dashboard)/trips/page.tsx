'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plane,
  Plus,
  Calendar,
  Clock,
  ArrowRight,
  MoreVertical,
  Trash2,
  Edit,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTripStore } from '@/stores/trip-store';
import { cn } from '@/lib/utils';
import type { Trip, TripStatus } from '@/types/trip';

const statusColors: Record<TripStatus, string> = {
  upcoming: 'bg-blue-500/10 text-blue-500',
  active: 'bg-green-500/10 text-green-500',
  completed: 'bg-gray-500/10 text-gray-500',
  archived: 'bg-gray-500/10 text-gray-500',
};

function TripCard({ trip, onDelete }: { trip: Trip; onDelete: (id: string) => void }) {
  const [showMenu, setShowMenu] = useState(false);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const daysUntil = () => {
    const now = new Date();
    const departure = new Date(trip.departureDateTime);
    const diff = Math.ceil(
      (departure.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff < 0) return null;
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `In ${diff} days`;
  };

  return (
    <Card className="relative group">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{trip.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {trip.originCity} <ArrowRight className="inline h-3 w-3" />{' '}
              {trip.destinationCity}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusColors[trip.status]}>{trip.status}</Badge>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
              {showMenu && (
                <div className="absolute right-0 top-8 z-10 w-40 rounded-md border bg-background shadow-lg">
                  <Link href={`/trips/${trip.id}`}>
                    <button className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted">
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
                  </Link>
                  <Link href={`/trips/${trip.id}/edit`}>
                    <button className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted">
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                  </Link>
                  <button
                    onClick={() => onDelete(trip.id)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Departure</p>
            <p className="font-medium">{formatDate(trip.departureDateTime)}</p>
            <p className="text-xs text-muted-foreground">
              {formatTime(trip.departureDateTime)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Arrival</p>
            <p className="font-medium">{formatDate(trip.arrivalDateTime)}</p>
            <p className="text-xs text-muted-foreground">
              {formatTime(trip.arrivalDateTime)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {trip.timezoneShiftHours > 0 ? '+' : ''}
                {trip.timezoneShiftHours}h
              </span>
            </div>
            <Badge variant="outline">
              {trip.direction === 'eastward' ? 'East' : 'West'}
            </Badge>
          </div>
          {daysUntil() && (
            <span className="text-sm font-medium text-primary">
              {daysUntil()}
            </span>
          )}
        </div>

        {trip.protocolId && (
          <Link href={`/trips/${trip.id}/protocol`}>
            <Button variant="outline" className="w-full mt-4">
              View Protocol
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Plane className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">No Trips Yet</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Plan your first trip to get a personalized circadian adjustment protocol.
      </p>
      <Link href="/trips/new">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Your First Trip
        </Button>
      </Link>
    </div>
  );
}

export default function TripsPage() {
  const { trips, deleteTrip } = useTripStore();
  const [filter, setFilter] = useState<TripStatus | 'all'>('all');

  const filteredTrips =
    filter === 'all' ? trips : trips.filter((t) => t.status === filter);

  const sortedTrips = [...filteredTrips].sort((a, b) => {
    return (
      new Date(a.departureDateTime).getTime() -
      new Date(b.departureDateTime).getTime()
    );
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this trip?')) {
      deleteTrip(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trips</h1>
          <p className="text-muted-foreground">
            Manage your travel itineraries and protocols
          </p>
        </div>
        <Link href="/trips/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Trip
          </Button>
        </Link>
      </div>

      {/* Filters */}
      {trips.length > 0 && (
        <div className="flex gap-2">
          {(['all', 'upcoming', 'active', 'completed'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      )}

      {/* Trips Grid or Empty State */}
      {trips.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
