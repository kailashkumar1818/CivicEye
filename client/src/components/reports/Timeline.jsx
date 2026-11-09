import React from 'react';
import { format } from 'date-fns';
import StatusBadge from './StatusBadge';
import { Clock, User, CheckCircle } from 'lucide-react';

export default function Timeline({ events = [] }) {
  if (!events || events.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-4 text-center">
        No status history recorded yet.
      </p>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {events.map((event, idx) => {
          const isLast = idx === events.length - 1;
          const eventDate = event.created_at ? new Date(event.created_at) : new Date();

          return (
            <li key={event.id || idx}>
              <div className="relative pb-8">
                {/* Connecting line */}
                {!isLast && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200"
                    aria-hidden="true"
                  />
                )}

                <div className="relative flex space-x-3 items-start">
                  {/* Dot icon */}
                  <div>
                    <span className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center ring-4 ring-white">
                      <Clock className="w-4 h-4" />
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 pt-1 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <StatusBadge status={event.to_status} size="sm" />
                        {event.from_status && (
                          <span className="text-xs text-slate-400">
                            (was {event.from_status.replace('_', ' ')})
                          </span>
                        )}
                      </div>
                      <time className="text-xs text-slate-400 whitespace-nowrap">
                        {format(eventDate, 'MMM d, yyyy · h:mm a')}
                      </time>
                    </div>

                    {event.note && (
                      <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-2.5 border border-slate-100 mt-1">
                        {event.note}
                      </p>
                    )}

                    {event.changed_by_name && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Updated by {event.changed_by_name}
                        {event.changed_by_role && (
                          <span className="capitalize">({event.changed_by_role})</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

