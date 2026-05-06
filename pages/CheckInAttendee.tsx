import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../store/AppContext';
import { supabase, BACKEND_URL, TM_TOKEN_KEY } from '../services/supabase';
import {
  ArrowLeft, Search, Users, Calendar, MapPin,
  UserCheck, CheckCircle2, Clock, Mail, User as UserIcon,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

type Attendee = {
  id: string | number;
  name: string;
  email: string;
  profile_photo_url?: string;
  joined_at: string;
  checked_in: boolean;
  checked_in_at?: string | null;
};

type EventSummary = {
  id: string;
  title: string;
  event_date: string;
  location?: string;
  banner_image_url?: string;
  category?: string;
  attendee_count?: number;
};

const PAGE_SIZE = 10;

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

const getEventId = (): string | null => {
  const hash = window.location.hash.replace('#', '');
  const match = hash.match(/\/checkin\/(.+)/);
  return match ? match[1] : null;
};

const CheckInAttendee: React.FC = () => {
  const { currentUser } = useApp();
  const eventId = getEventId();

  const [event, setEvent] = useState<EventSummary | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [checkingIn, setCheckingIn] = useState<string | number | null>(null);

  const fetchData = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [eventRes, attendeesRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/events/${eventId}`, { headers }),
        fetch(`${BACKEND_URL}/api/events/${eventId}/attendees`, { headers }),
      ]);

      if (eventRes.ok) {
        const json = await eventRes.json();
        const e = json.event;
        setEvent({
          id: e.id,
          title: e.title,
          event_date: e.event_date,
          location: e.location,
          banner_image_url: e.banner_image_url,
          category: e.category,
          attendee_count: e.attendee_count,
        });
      }

      if (!attendeesRes.ok) {
        const json = await attendeesRes.json();
        setError(json.error || 'Failed to load attendees.');
        return;
      }
      const json = await attendeesRes.json();
      setAttendees(json.attendees ?? []);
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCheckIn = async (attendee: Attendee) => {
    if (attendee.checked_in) return;
    setCheckingIn(attendee.id);
    try {
      const token = await getToken();
      const res = await fetch(
        `${BACKEND_URL}/api/events/${eventId}/attendees/${attendee.id}/checkin`,
        { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        setAttendees((prev) =>
          prev.map((a) =>
            a.id === attendee.id
              ? { ...a, checked_in: true, checked_in_at: new Date().toISOString() }
              : a
          )
        );
      } else {
        const json = await res.json();
        setError(json.error || 'Check-in failed.');
      }
    } catch {
      setError('Unable to connect.');
    } finally {
      setCheckingIn(null);
    }
  };

  const filtered = attendees.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (a.name ?? '').toLowerCase().includes(q) ||
      (a.email ?? '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const checkedInCount = attendees.filter((a) => a.checked_in).length;

  if (!currentUser) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-gray-400">
        Please sign in.
      </div>
    );
  }

  return (
    <div className="pb-20 max-w-5xl mx-auto px-4 py-10">
      {/* Back button */}
      <button
        onClick={() => { window.location.hash = '/organizer-events'; }}
        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 mb-8 transition-colors"
      >
        <ArrowLeft size={16} /> Back to All My Events
      </button>

      {/* Event summary card */}
      {event && (
        <div className="flex gap-4 items-start mb-8 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
          {event.banner_image_url ? (
            <img
              src={event.banner_image_url}
              alt={event.title}
              className="h-20 w-32 rounded-xl object-cover shrink-0"
            />
          ) : (
            <div className="h-20 w-32 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-300 text-4xl font-black shrink-0 select-none">
              {event.title.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-gray-900 line-clamp-1">{event.title}</h2>
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(event.event_date)}</span>
              {event.location && <span className="flex items-center gap-1"><MapPin size={12} />{event.location}</span>}
            </div>
          </div>
          {/* Check-in stats */}
          <div className="shrink-0 text-right">
            <p className="text-2xl font-bold text-emerald-600">{checkedInCount}</p>
            <p className="text-xs text-gray-400">of {attendees.length} checked in</p>
          </div>
        </div>
      )}

      {/* Header + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-3 flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Check-In Attendees</h1>
          {!loading && (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
              {filtered.length}
            </span>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="Search name or email…"
            className="pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500 w-64"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border border-dashed border-gray-200 bg-white">
          <Users className="mx-auto mb-3 text-gray-300" size={40} />
          <p className="font-semibold text-gray-500">
            {attendees.length === 0 ? 'No attendees have joined this event.' : 'No attendees match your search.'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[2rem_1fr_1fr_auto_auto] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              <span>#</span>
              <span>Attendee</span>
              <span>Email</span>
              <span>Joined</span>
              <span>Check In</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-50">
              {paginated.map((a, idx) => {
                const rowNum = (safePage - 1) * PAGE_SIZE + idx + 1;
                const isActing = checkingIn === a.id;
                return (
                  <div
                    key={a.id}
                    className={`flex sm:grid sm:grid-cols-[2rem_1fr_1fr_auto_auto] gap-4 items-center px-5 py-4 transition-colors ${
                      a.checked_in ? 'bg-emerald-50/50' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* # */}
                    <span className="text-xs font-bold text-gray-300 hidden sm:block">{rowNum}</span>

                    {/* Name */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {a.profile_photo_url ? (
                        <img src={a.profile_photo_url} alt={a.name} className="h-9 w-9 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
                          {a.name?.charAt(0) ?? <UserIcon size={14} />}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{a.name}</p>
                        {/* Email shown here on mobile */}
                        <p className="flex items-center gap-1 text-xs text-gray-400 truncate sm:hidden">
                          <Mail size={10} />{a.email}
                        </p>
                      </div>
                    </div>

                    {/* Email (desktop) */}
                    <p className="hidden sm:flex items-center gap-1 text-xs text-gray-500 truncate">
                      <Mail size={11} className="shrink-0 text-gray-300" />{a.email}
                    </p>

                    {/* Joined at */}
                    <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0">
                      <span className="text-xs text-gray-400">{formatDate(a.joined_at)}</span>
                      {a.checked_in && a.checked_in_at && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-500">
                          <Clock size={9} /> {formatDate(a.checked_in_at)}
                        </span>
                      )}
                    </div>

                    {/* Check-in button */}
                    <div className="shrink-0 ml-auto sm:ml-0">
                      {a.checked_in ? (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 text-xs font-bold">
                          <CheckCircle2 size={14} /> Checked In
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCheckIn(a)}
                          disabled={isActing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-emerald-600 hover:text-white text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          {isActing ? (
                            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <UserCheck size={14} />
                          )}
                          Check In
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5">
              <p className="text-sm text-gray-400">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={15} /> Prev
                </button>
                <span className="text-sm font-semibold text-gray-700 px-2">
                  {safePage} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CheckInAttendee;
