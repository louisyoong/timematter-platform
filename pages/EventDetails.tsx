import React, { useState, useEffect, useCallback } from "react";
import { useApp } from "../store/AppContext";
import { supabase, BACKEND_URL, TM_TOKEN_KEY } from "../services/supabase";
import {
  Calendar,
  MapPin,
  Users,
  Share2,
  Check,
  ArrowLeft,
  Info,
  AlertTriangle,
  Car,
  ShieldCheck,
  Building2,
} from "lucide-react";

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
  parking_info?: string; // 'free' | 'paid' | 'none'
  age_restriction?: string; // 'all' | 'restricted'
  age_min?: number;
  age_max?: number;
  organizations?: { id: string; name: string; logo_url?: string };
  organizer?: { id: string | number; name: string; profile_photo_url?: string };
};

const getEventIdFromHash = () => {
  const match = window.location.hash.match(/^#\/event\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : "";
};

const getToken = async (): Promise<string | null> => {
  const jwt = localStorage.getItem(TM_TOKEN_KEY);
  if (jwt) return jwt;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
};

const formatDate = (iso: string) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-MY", {
      dateStyle: "full",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
};

const parkingLabel = (info?: string) => {
  if (info === "free") return "Free parking available";
  if (info === "paid") return "Paid parking nearby";
  if (info === "none") return "No parking — use public transport";
  return null;
};

const ageLabel = (restriction?: string, min?: number, max?: number) => {
  if (restriction === "all") return "Open to all ages";
  if (restriction === "restricted") {
    if (min && max) return `Ages ${min}–${max} only`;
    if (min) return `Ages ${min}+ only`;
    if (max) return `Up to age ${max}`;
  }
  return null;
};

const EventDetails: React.FC = () => {
  const { currentUser } = useApp();
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [joining, setJoining] = useState(false);
  const [actionError, setActionError] = useState("");

  const id = getEventIdFromHash();

  const fetchEvent = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/events/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const json = await res.json();
      setEvent(json.event ?? json);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchEvent();
  }, [id, fetchEvent]);

  const handleJoin = async () => {
    if (!currentUser) {
      window.location.hash = "/login";
      return;
    }
    if (!event) return;
    setJoining(true);
    setActionError("");
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/events/${event.id}/join`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const json = await res.json();
        setActionError(json.error || "Failed to join event.");
      } else {
        setEvent((prev) =>
          prev
            ? {
                ...prev,
                is_joined: true,
                attendee_count: prev.attendee_count + 1,
              }
            : prev
        );
      }
    } catch {
      setActionError("Unable to connect to server.");
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!event) return;
    setJoining(true);
    setActionError("");
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/events/${event.id}/join`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const json = await res.json();
        setActionError(json.error || "Failed to leave event.");
      } else {
        setEvent((prev) =>
          prev
            ? {
                ...prev,
                is_joined: false,
                attendee_count: Math.max(0, prev.attendee_count - 1),
              }
            : prev
        );
      }
    } catch {
      setActionError("Unable to connect to server.");
    } finally {
      setJoining(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="pb-20">
        <div className="h-[400px] md:h-[500px] bg-gray-200 animate-pulse" />
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-4">
            <div className="h-8 bg-gray-200 rounded-xl animate-pulse w-3/4" />
            <div className="h-4 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-4 bg-gray-100 rounded-xl animate-pulse w-5/6" />
          </div>
          <div className="lg:col-span-4 h-64 bg-gray-200 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <AlertTriangle size={48} className="text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Event Not Found</h2>
        <p className="mt-2 text-sm text-gray-500">
          This event may have been removed or made private.
        </p>
        <a
          href="#/find-events"
          className="mt-6 text-emerald-600 font-bold hover:underline"
        >
          Return to browse
        </a>
      </div>
    );
  }

  const isPast = new Date(event.event_date) < new Date();
  const parking = parkingLabel(event.parking_info);
  const age = ageLabel(event.age_restriction, event.age_min, event.age_max);
  const orgName =
    event.organizations?.name ?? event.organizer?.name ?? "Organizer";
  const organizerName = event.organizer?.name ?? orgName;
  const organizerPhoto = event.organizer?.profile_photo_url;

  return (
    <div className="pb-20">
      {/* Banner */}
      <div className="relative h-[400px] md:h-[500px]">
        {event.banner_image_url ? (
          <img
            src={event.banner_image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-emerald-50 flex items-center justify-center text-emerald-200 text-[10rem] font-black select-none">
            {event.title.charAt(0)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

        <div className="absolute top-6 left-6">
          <a
            href="#/find-events"
            className="p-3 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white/40 transition-all flex items-center justify-center"
          >
            <ArrowLeft size={22} />
          </a>
        </div>

        <div className="absolute bottom-12 left-0 right-0 max-w-7xl mx-auto px-4 md:px-8 text-white">
          <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">
            {event.category}
          </span>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <h1 className="text-4xl md:text-5xl font-bold drop-shadow-lg max-w-3xl">
              {event.title}
            </h1>
            {isPast && (
              <span className="shrink-0 self-center rounded-full bg-gray-700/80 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
                Ended
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-6 text-emerald-50 text-sm">
            <div className="flex items-center gap-2">
              {event.organizations?.logo_url ? (
                <img
                  src={event.organizations.logo_url}
                  alt="org"
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <Building2 size={18} />
              )}
              {orgName}
            </div>
            <div className="flex items-center gap-2">
              <Users size={18} /> {event.attendee_count ?? 0} attending
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-[-40px] relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main content */}
          <div className="lg:col-span-8 bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12">
            <div className="flex items-center gap-2 text-emerald-600 mb-6 font-bold uppercase tracking-widest text-sm">
              <Info size={17} /> About this event
            </div>

            <div className="text-gray-700 leading-relaxed text-base space-y-4">
              {event.description.split("\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            {/* Event info pills */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {parking && (
                <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
                  <Car size={18} className="mt-0.5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                      Parking
                    </p>
                    <p className="text-sm font-semibold text-gray-700">
                      {parking}
                    </p>
                  </div>
                </div>
              )}
              {age && (
                <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
                  <ShieldCheck
                    size={18}
                    className="mt-0.5 text-emerald-500 shrink-0"
                  />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                      Age Restriction
                    </p>
                    <p className="text-sm font-semibold text-gray-700">{age}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Organizer */}
            <div className="mt-12 pt-10 border-t border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-5">
                Event Organizer
              </h3>
              <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                {organizerPhoto ? (
                  <img
                    src={organizerPhoto}
                    alt="organizer"
                    className="h-14 w-14 rounded-2xl object-cover border border-gray-200"
                  />
                ) : event.organizations?.logo_url ? (
                  <img
                    src={event.organizations.logo_url}
                    alt="org"
                    className="h-14 w-14 rounded-2xl object-cover border border-gray-200"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 text-xl font-bold">
                    {organizerName.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-gray-900">{organizerName}</h4>
                  {orgName !== organizerName && (
                    <p className="text-xs text-gray-400 mt-0.5">{orgName}</p>
                  )}
                  <p className="text-sm text-gray-400 mt-0.5">
                    Verified Community Partner
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 top-24">
              {/* Date, location */}
              <div className="space-y-5 mb-8">
                <div className="flex gap-4">
                  <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Date & Time
                    </p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">
                      {formatDate(event.event_date)}
                    </p>
                  </div>
                </div>
                {event.location && (
                  <div className="flex gap-4">
                    <div className="w-11 h-11 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center shrink-0">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Location
                      </p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">
                        {event.location}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex gap-4">
                  <div className="w-11 h-11 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center shrink-0">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Attendees
                    </p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">
                      {event.attendee_count ?? 0} joined
                    </p>
                  </div>
                </div>
              </div>

              {/* Error */}
              {actionError && (
                <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {actionError}
                </div>
              )}

              {/* Join / Leave button */}
              {event.is_joined ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl py-4 text-emerald-700 font-bold text-sm">
                    <Check size={18} /> You&apos;re attending
                  </div>
                  <button
                    onClick={handleLeave}
                    disabled={joining}
                    className="w-full py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-60"
                  >
                    {joining ? "Processing…" : "Leave event"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full py-4 rounded-2xl font-bold text-lg bg-emerald-600 text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {joining ? "Processing…" : "Join for Free"}
                </button>
              )}

              {!currentUser && (
                <p className="text-center text-xs text-gray-400 mt-3">
                  <a href="#/login" className="underline">
                    Sign in
                  </a>{" "}
                  to join this event.
                </p>
              )}

              {/* Share */}
              <button
                onClick={handleShare}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 text-emerald-600 font-bold hover:bg-emerald-50 rounded-2xl border-2 border-emerald-600 transition-colors text-sm"
              >
                <Share2 size={18} /> Share Event
              </button>
            </div>

            {/* Safety card */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-7 text-white">
              <h4 className="text-base font-bold mb-3">Safety First</h4>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                All TimeMatter events follow strict community guidelines. If you
                feel uncomfortable or notice something wrong, please report it.
              </p>
              <button className="text-red-400 text-sm font-bold hover:underline">
                Report Event
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
