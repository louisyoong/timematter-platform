import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, MapPin, Search, Users, X } from 'lucide-react';
import { supabase, BACKEND_URL, TM_TOKEN_KEY } from '../services/supabase';

type ApiEvent = {
  id: string;
  title: string;
  description: string;
  banner_image_url?: string;
  event_date: string;
  location: string;
  category: string;
  status: string;
  attendee_count: number;
  is_joined: boolean;
  organizations?: { id: string; name: string; logo_url?: string };
};

const CATEGORIES = ['All', 'Health', 'Social', 'Sport', 'Creative', 'Education'];

const formatDate = (iso: string) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-MY', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
};

const getToken = async (): Promise<string | null> => {
  const jwt = localStorage.getItem(TM_TOKEN_KEY);
  if (jwt) return jwt;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
};

const FindEvents: React.FC = () => {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchEvents = useCallback(async (category: string) => {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      const params = new URLSearchParams({ limit: '100', offset: '0' });
      if (category !== 'All') params.set('category', category.toLowerCase());

      const res = await fetch(`${BACKEND_URL}/api/events?${params}`, {
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

  useEffect(() => { fetchEvents(filterCategory); }, [filterCategory, fetchEvents]);

  const filtered = events.filter((e) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      (e.location ?? '').toLowerCase().includes(q) ||
      (e.organizations?.name ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="pb-20">
      {/* Hero banner */}
      <div className="relative h-64 bg-emerald-900 overflow-hidden">
        <img
          src="https://picsum.photos/id/1020/1600/400"
          className="w-full h-full object-cover opacity-50"
          alt="banner"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4 text-center">
          <h1 className="text-4xl font-bold mb-2">Find Events Near You</h1>
          <p className="text-emerald-100">Discover upcoming events in your community.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-[-40px] relative z-20">
        {/* Search & filter bar */}
        <div className="bg-white rounded-2xl shadow-xl p-5 border border-emerald-50">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by title, venue, or organizer…"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    filterCategory === cat
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {loading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'Event' : 'Events'} found`}
            </h2>
            {(searchTerm || filterCategory !== 'All') && (
              <button
                onClick={() => { setSearchTerm(''); setFilterCategory('All'); }}
                className="flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:underline"
              >
                <X size={15} /> Clear filters
              </button>
            )}
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-80 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center rounded-3xl border border-dashed border-gray-300 bg-white">
              <Search className="mx-auto mb-4 text-gray-300" size={48} />
              <h3 className="text-xl font-semibold text-gray-900">No events found</h3>
              <p className="mt-2 text-sm text-gray-500">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((event) => (
                <a
                  key={event.id}
                  href={`#/event/${event.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-xl"
                >
                  {/* Banner */}
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    {event.banner_image_url ? (
                      <img
                        src={event.banner_image_url}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-emerald-50 text-emerald-300 text-5xl font-black">
                        {event.title.charAt(0)}
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-emerald-500 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                      {event.category}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="mb-3 line-clamp-2 text-lg font-bold text-gray-900 min-h-[3.25rem]">
                      {event.title}
                    </h3>
                    <div className="mb-4 flex-1 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar size={14} className="shrink-0 text-emerald-500" />
                        {formatDate(event.event_date)}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MapPin size={14} className="shrink-0 text-emerald-500" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-50 pt-3 text-xs text-gray-400">
                      <div className="flex items-center gap-1.5">
                        {event.organizations?.logo_url ? (
                          <img
                            src={event.organizations.logo_url}
                            alt="org"
                            className="h-5 w-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-5 w-5 rounded-full bg-emerald-100" />
                        )}
                        <span className="truncate max-w-[100px]">{event.organizations?.name ?? 'Organizer'}</span>
                      </div>
                      <span className="flex items-center gap-1">
                        <Users size={12} className="text-emerald-500" />
                        {event.attendee_count ?? 0} joined
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FindEvents;
