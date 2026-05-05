import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../store/AppContext';
import { UserRole } from '../types';
import { supabase, BACKEND_URL, TM_TOKEN_KEY } from '../services/supabase';
import {
  ShieldAlert, Calendar, MapPin, Users, Search,
  ShieldOff, ShieldCheck, Trash2, RefreshCw,
} from 'lucide-react';

type AdminEvent = {
  id: string;
  title: string;
  banner_image_url?: string;
  event_date: string;
  location: string;
  category: string;
  status: string;
  attendee_count: number;
  organizations?: { id: string; name: string };
  organizer?: { id: string | number; name: string };
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

const statusBadge = (status: string) => {
  if (status === 'published') return 'bg-emerald-100 text-emerald-700';
  if (status === 'draft')     return 'bg-amber-100 text-amber-700';
  if (status === 'blocked')   return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-500';
};

const categoryColors: Record<string, string> = {
  health: 'bg-green-100 text-green-700',
  social: 'bg-blue-100 text-blue-700',
  sport: 'bg-orange-100 text-orange-700',
  creative: 'bg-purple-100 text-purple-700',
  education: 'bg-yellow-100 text-yellow-700',
};

const AdminEvents: React.FC = () => {
  const { currentUser } = useApp();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<AdminEvent | null>(null);

  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="mx-auto mb-4 text-red-400" size={48} />
          <p className="text-xl font-bold text-gray-700">Access Denied</p>
          <p className="mt-2 text-sm text-gray-400">Admin access required.</p>
        </div>
      </div>
    );
  }

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/events?limit=200&offset=0`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Failed to load events.'); return; }
      setEvents(json.events ?? []);
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleBlock = async (event: AdminEvent) => {
    const newStatus = event.status === 'blocked' ? 'published' : 'blocked';
    setActionLoading(`block-${event.id}`);
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setEvents((prev) => prev.map((e) => e.id === event.id ? { ...e, status: newStatus } : e));
      } else {
        const json = await res.json();
        setError(json.error || 'Action failed.');
      }
    } catch {
      setError('Unable to connect.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (event: AdminEvent) => {
    setConfirmDelete(null);
    setActionLoading(`delete-${event.id}`);
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/events/${event.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== event.id));
      } else {
        const json = await res.json();
        setError(json.error || 'Failed to delete event.');
      }
    } catch {
      setError('Unable to connect.');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = events.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      (e.location ?? '').toLowerCase().includes(q) ||
      (e.organizer?.name ?? '').toLowerCase().includes(q) ||
      (e.organizations?.name ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="pb-20 max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Events</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review, block, unblock, or remove events across the platform.
          </p>
        </div>
        <button
          onClick={fetchEvents}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Search by title, location, or organizer…"
          className="w-full pl-9 pr-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {/* Stats row */}
      {!loading && (
        <div className="flex gap-3 mb-6 flex-wrap">
          {[
            { label: 'Total', count: events.length, cls: 'bg-gray-100 text-gray-700' },
            { label: 'Published', count: events.filter(e => e.status === 'published').length, cls: 'bg-emerald-100 text-emerald-700' },
            { label: 'Draft', count: events.filter(e => e.status === 'draft').length, cls: 'bg-amber-100 text-amber-700' },
            { label: 'Blocked', count: events.filter(e => e.status === 'blocked').length, cls: 'bg-red-100 text-red-700' },
          ].map((s) => (
            <span key={s.label} className={`px-3 py-1 rounded-full text-xs font-bold ${s.cls}`}>
              {s.label}: {s.count}
            </span>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border border-dashed border-gray-200 bg-white">
          <Search className="mx-auto mb-3 text-gray-300" size={40} />
          <p className="font-semibold text-gray-500">No events found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((event) => {
            const isActing = actionLoading?.endsWith(event.id);
            const isBlocked = event.status === 'blocked';
            return (
              <div
                key={event.id}
                className={`flex gap-4 items-center p-4 bg-white rounded-2xl border shadow-sm transition-all ${
                  isBlocked ? 'border-red-100 opacity-75' : 'border-gray-100'
                }`}
              >
                {/* Banner thumbnail */}
                {event.banner_image_url ? (
                  <img src={event.banner_image_url} alt={event.title}
                    className="h-14 w-20 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="h-14 w-20 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-300 text-2xl font-black shrink-0 select-none">
                    {event.title.charAt(0)}
                  </div>
                )}

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${categoryColors[event.category?.toLowerCase()] ?? 'bg-gray-100 text-gray-500'}`}>
                      {event.category}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusBadge(event.status)}`}>
                      {event.status}
                    </span>
                  </div>
                  <a href={`#/event/${event.id}`}
                    className="font-bold text-gray-900 text-sm hover:text-emerald-700 transition-colors line-clamp-1">
                    {event.title}
                  </a>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(event.event_date)}</span>
                    {event.location && <span className="flex items-center gap-1"><MapPin size={11} />{event.location}</span>}
                    <span className="flex items-center gap-1"><Users size={11} />{event.attendee_count ?? 0} joined</span>
                    {(event.organizer?.name || event.organizations?.name) && (
                      <span className="text-gray-400">
                        by {event.organizer?.name ?? event.organizations?.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleBlock(event)}
                    disabled={!!isActing}
                    title={isBlocked ? 'Unblock' : 'Block'}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 ${
                      isBlocked
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    {isActing && actionLoading?.startsWith('block') ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : isBlocked ? (
                      <><ShieldCheck size={13} /> Unblock</>
                    ) : (
                      <><ShieldOff size={13} /> Block</>
                    )}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(event)}
                    disabled={!!isActing}
                    title="Delete event"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    {isActing && actionLoading?.startsWith('delete') ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <><Trash2 size={13} /> Remove</>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Trash2 className="text-red-600" size={26} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Remove Event?</h3>
            <p className="text-sm text-gray-500 mb-1">
              <span className="font-semibold text-gray-700">"{confirmDelete.title}"</span>
            </p>
            <p className="text-sm text-gray-400 mb-7">
              This will permanently delete the event and all attendee records. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-3 rounded-2xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
