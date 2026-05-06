import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../store/AppContext';
import { supabase, BACKEND_URL, TM_TOKEN_KEY } from '../services/supabase';
import {
  Calendar, MapPin, Users, ArrowLeft, ChevronRight,
  Mail, User as UserIcon, Search, UserCheck, Pencil,
} from 'lucide-react';

type OrgEvent = {
  id: string;
  title: string;
  banner_image_url?: string;
  event_date: string;
  location: string;
  category: string;
  status: string;
  attendee_count: number;
  organizer?: { id: string | number; name: string };
};

type Attendee = {
  id: string | number;
  name: string;
  email: string;
  profile_photo_url?: string;
  joined_at: string;
};

const getToken = async (): Promise<string | null> => {
  const jwt = localStorage.getItem(TM_TOKEN_KEY);
  if (jwt) return jwt;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
};

const formatDate = (iso: string) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' });
  } catch { return iso; }
};

const formatJoinedAt = (iso: string) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' });
  } catch { return iso; }
};

const categoryColors: Record<string, string> = {
  health: 'bg-green-100 text-green-700',
  social: 'bg-blue-100 text-blue-700',
  sport: 'bg-orange-100 text-orange-700',
  creative: 'bg-purple-100 text-purple-700',
  education: 'bg-yellow-100 text-yellow-700',
};

const OrganizerEvents: React.FC = () => {
  const { currentUser } = useApp();
  const [events, setEvents] = useState<OrgEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Attendee view state
  const [selectedEvent, setSelectedEvent] = useState<OrgEvent | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [attendeesError, setAttendeesError] = useState('');
  const [attendeeSearch, setAttendeeSearch] = useState('');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/events/mine`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) { setError('Failed to load events.'); return; }
      const json = await res.json();
      setEvents(json.events ?? []);
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const openAttendees = async (event: OrgEvent) => {
    setSelectedEvent(event);
    setAttendees([]);
    setAttendeesError('');
    setAttendeeSearch('');
    setAttendeesLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/events/${event.id}/attendees`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const json = await res.json();
        setAttendeesError(json.error || 'Failed to load attendees.');
        return;
      }
      const json = await res.json();
      setAttendees(json.attendees ?? []);
    } catch {
      setAttendeesError('Unable to connect to the server.');
    } finally {
      setAttendeesLoading(false);
    }
  };

  const filteredAttendees = attendees.filter((a) => {
    if (!attendeeSearch) return true;
    const q = attendeeSearch.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
  });

  if (!currentUser) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-gray-400">
        Please sign in to view your events.
      </div>
    );
  }

  // ── Attendee list view ──────────────────────────────────────────────────────
  if (selectedEvent) {
    return (
      <div className="pb-20 max-w-4xl mx-auto px-4 py-10">
        <button
          onClick={() => setSelectedEvent(null)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Back to All Events
        </button>

        {/* Event summary */}
        <div className="flex gap-4 items-start mb-8 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
          {selectedEvent.banner_image_url ? (
            <img
              src={selectedEvent.banner_image_url}
              alt={selectedEvent.title}
              className="h-20 w-32 rounded-xl object-cover shrink-0"
            />
          ) : (
            <div className="h-20 w-32 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-300 text-4xl font-black shrink-0">
              {selectedEvent.title.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${categoryColors[selectedEvent.category?.toLowerCase()] ?? 'bg-gray-100 text-gray-600'}`}>
              {selectedEvent.category}
            </span>
            <h2 className="mt-1 text-xl font-bold text-gray-900 line-clamp-1">{selectedEvent.title}</h2>
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(selectedEvent.event_date)}</span>
              {selectedEvent.location && <span className="flex items-center gap-1"><MapPin size={12} />{selectedEvent.location}</span>}
              <span className="flex items-center gap-1"><Users size={12} />{selectedEvent.attendee_count ?? 0} joined</span>
            </div>
          </div>
        </div>

        {/* Attendee header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-gray-900">
            {attendeesLoading ? 'Loading attendees…' : `${filteredAttendees.length} Attendee${filteredAttendees.length !== 1 ? 's' : ''}`}
          </h3>
          {attendees.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search by name or email…"
                className="pl-8 pr-4 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500 w-56"
                value={attendeeSearch}
                onChange={(e) => setAttendeeSearch(e.target.value)}
              />
            </div>
          )}
        </div>

        {attendeesError && (
          <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {attendeesError}
          </div>
        )}

        {attendeesLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filteredAttendees.length === 0 ? (
          <div className="py-16 text-center rounded-3xl border border-dashed border-gray-200 bg-white">
            <Users className="mx-auto mb-3 text-gray-300" size={40} />
            <p className="font-semibold text-gray-500">
              {attendees.length === 0 ? 'No one has joined this event yet.' : 'No attendees match your search.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAttendees.map((a, idx) => (
              <div
                key={a.id}
                className="flex items-center gap-4 px-5 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm"
              >
                <span className="text-xs font-bold text-gray-300 w-5 shrink-0 text-right">{idx + 1}</span>
                {a.profile_photo_url ? (
                  <img src={a.profile_photo_url} alt={a.name} className="h-10 w-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
                    {a.name?.charAt(0) ?? <UserIcon size={14} />}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm truncate">{a.name}</p>
                  <p className="flex items-center gap-1 text-xs text-gray-400 truncate">
                    <Mail size={11} /> {a.email}
                  </p>
                </div>
                <p className="text-xs text-gray-400 shrink-0 hidden sm:block">
                  Joined {formatJoinedAt(a.joined_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Events list view ────────────────────────────────────────────────────────
  return (
    <div className="pb-20 max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All My Events</h1>
        <p className="mt-1 text-sm text-gray-500">Events you've created. Click an event to view attendees.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border border-dashed border-gray-200 bg-white">
          <Calendar className="mx-auto mb-4 text-gray-300" size={48} />
          <h3 className="text-xl font-semibold text-gray-900">No events yet</h3>
          <p className="mt-2 text-sm text-gray-500">Create your first event to get started.</p>
          <a
            href="#/create-event"
            className="mt-6 inline-block px-6 py-3 bg-emerald-600 text-white text-sm font-bold rounded-2xl hover:bg-emerald-700 transition-colors"
          >
            Create Event
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const eventDay = new Date(event.event_date);
            const now = new Date();
            const isToday =
              eventDay.getFullYear() === now.getFullYear() &&
              eventDay.getMonth() === now.getMonth() &&
              eventDay.getDate() === now.getDate();

            return (
              <div
                key={event.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all"
              >
                <div className="flex gap-4 items-center p-4">
                  {/* Thumbnail */}
                  {event.banner_image_url ? (
                    <img
                      src={event.banner_image_url}
                      alt={event.title}
                      className="h-16 w-24 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-16 w-24 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-300 text-3xl font-black shrink-0 select-none">
                      {event.title.charAt(0)}
                    </div>
                  )}

                  {/* Info — clicking opens attendees for published, edit form for draft */}
                  <button
                    onClick={() => {
                      if (event.status === 'draft') {
                        window.location.hash = `/create-event?id=${event.id}`;
                      } else {
                        openAttendees(event);
                      }
                    }}
                    className="min-w-0 flex-1 text-left group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${categoryColors[event.category?.toLowerCase()] ?? 'bg-gray-100 text-gray-600'}`}>
                        {event.category}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${event.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {event.status}
                      </span>
                      {isToday && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          Today
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 text-base line-clamp-1 group-hover:text-emerald-700 transition-colors">{event.title}</h3>
                    <div className="flex flex-wrap gap-4 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(event.event_date)}</span>
                      {event.location && <span className="flex items-center gap-1"><MapPin size={11} />{event.location}</span>}
                    </div>
                  </button>

                  {/* Right actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1 text-sm font-bold text-emerald-600">
                      <Users size={14} /> {event.attendee_count ?? 0}
                      <span className="text-[10px] font-normal text-gray-400 ml-0.5">joined</span>
                    </div>
                    <button
                      onClick={() => { window.location.hash = `/create-event?id=${event.id}`; }}
                      title="Edit event"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 text-xs font-semibold transition-colors"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                  </div>
                </div>

                {/* Check-in button — only on event day */}
                {isToday && event.status === 'published' && (
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => { window.location.hash = `/checkin/${event.id}`; }}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors"
                    >
                      <UserCheck size={15} /> Check In Attendee
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrganizerEvents;
