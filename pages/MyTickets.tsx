import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../store/AppContext';
import { supabase, BACKEND_URL, TM_TOKEN_KEY } from '../services/supabase';
import { Calendar, MapPin, Building2, Clock, CheckCircle2 } from 'lucide-react';

type TicketEvent = {
  id: string;
  title: string;
  banner_image_url?: string;
  event_date: string;
  location: string;
  category: string;
  status: string;
  joined_at: string;
  organizations?: { id: string; name: string; logo_url?: string };
};

type TicketsResponse = {
  total: number;
  upcoming: TicketEvent[];
  past: TicketEvent[];
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

const categoryColors: Record<string, string> = {
  health: 'bg-green-100 text-green-700',
  social: 'bg-blue-100 text-blue-700',
  sport: 'bg-orange-100 text-orange-700',
  creative: 'bg-purple-100 text-purple-700',
  education: 'bg-yellow-100 text-yellow-700',
};

const TicketCard: React.FC<{ event: TicketEvent; isPast?: boolean }> = ({ event, isPast }) => (
  <a
    href={`#/event/${event.id}`}
    className={`flex gap-4 items-center p-4 bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all text-left group ${
      isPast ? 'border-gray-100 opacity-70 hover:opacity-100' : 'border-emerald-100 hover:border-emerald-200'
    }`}
  >
    {event.banner_image_url ? (
      <img
        src={event.banner_image_url}
        alt={event.title}
        className="h-20 w-28 rounded-xl object-cover shrink-0"
      />
    ) : (
      <div className="h-20 w-28 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-200 text-4xl font-black shrink-0 select-none">
        {event.title.charAt(0)}
      </div>
    )}

    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${categoryColors[event.category?.toLowerCase()] ?? 'bg-gray-100 text-gray-500'}`}>
          {event.category}
        </span>
        {isPast && (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Past</span>
        )}
      </div>
      <h3 className="font-bold text-gray-900 text-base line-clamp-1 group-hover:text-emerald-700 transition-colors">
        {event.title}
      </h3>
      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-400">
        <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(event.event_date)}</span>
        {event.location && (
          <span className="flex items-center gap-1"><MapPin size={11} />{event.location}</span>
        )}
        {event.organizations?.name && (
          <span className="flex items-center gap-1"><Building2 size={11} />{event.organizations.name}</span>
        )}
      </div>
    </div>

    <div className="shrink-0 flex flex-col items-end gap-1">
      <div className={`flex items-center gap-1 text-xs font-semibold ${isPast ? 'text-gray-400' : 'text-emerald-600'}`}>
        <CheckCircle2 size={14} /> Joined
      </div>
      <p className="text-[10px] text-gray-400">{formatDate(event.joined_at)}</p>
    </div>
  </a>
);

const MyTickets: React.FC = () => {
  const { currentUser } = useApp();
  const [data, setData] = useState<TicketsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/events/my-tickets`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error || 'Failed to load tickets.');
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  if (!currentUser) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-sm text-gray-400 gap-3">
        <p>Please sign in to view your tickets.</p>
        <a href="#/login" className="text-emerald-600 font-bold hover:underline">Sign In</a>
      </div>
    );
  }

  const activeList = tab === 'upcoming' ? (data?.upcoming ?? []) : (data?.past ?? []);

  return (
    <div className="pb-20 max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Tickets</h1>
        <p className="mt-1 text-sm text-gray-500">Events you've joined — click to view details.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {/* Tabs */}
      {!loading && data && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('upcoming')}
            className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
              tab === 'upcoming'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            Upcoming
            {data.upcoming.length > 0 && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${tab === 'upcoming' ? 'bg-white/20' : 'bg-gray-300 text-gray-600'}`}>
                {data.upcoming.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('past')}
            className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
              tab === 'past'
                ? 'bg-gray-800 text-white shadow-md'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            Past
            {data.past.length > 0 && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${tab === 'past' ? 'bg-white/20' : 'bg-gray-300 text-gray-600'}`}>
                {data.past.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : activeList.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border border-dashed border-gray-200 bg-white">
          {tab === 'upcoming' ? (
            <>
              <Clock className="mx-auto mb-4 text-gray-300" size={48} />
              <h3 className="text-xl font-semibold text-gray-900">No upcoming events</h3>
              <p className="mt-2 text-sm text-gray-500">Browse events and join something you love.</p>
              <a
                href="#/find-events"
                className="mt-6 inline-block px-6 py-3 bg-emerald-600 text-white text-sm font-bold rounded-2xl hover:bg-emerald-700 transition-colors"
              >
                Find Events
              </a>
            </>
          ) : (
            <>
              <CheckCircle2 className="mx-auto mb-4 text-gray-300" size={48} />
              <h3 className="text-xl font-semibold text-gray-900">No past events yet</h3>
              <p className="mt-2 text-sm text-gray-500">Events you've attended will appear here.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {activeList.map((event) => (
            <TicketCard key={event.id} event={event} isPast={tab === 'past'} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTickets;
