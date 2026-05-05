import React, { useState, useEffect } from "react";
import HeroSlider from "../components/HeroSlider";
import { supabase, BACKEND_URL, TM_TOKEN_KEY } from "../services/supabase";
import {
  Calendar,
  MapPin,
  Users,
  ArrowRight,
  ShieldCheck,
  Heart,
  Users2,
} from "lucide-react";

type ApiEvent = {
  id: string;
  title: string;
  banner_image_url?: string;
  event_date: string;
  location: string;
  category: string;
  attendee_count: number;
  organizations?: { id: string; name: string; logo_url?: string };
};

const formatDate = (iso: string) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-MY", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
};

const getToken = async (): Promise<string | null> => {
  const jwt = localStorage.getItem(TM_TOKEN_KEY);
  if (jwt) return jwt;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
};

const Home: React.FC = () => {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(
          `${BACKEND_URL}/api/events?limit=100&offset=0`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        if (!res.ok) return;
        const json = await res.json();
        const now = new Date();
        const upcoming = (json.events ?? ([] as ApiEvent[]))
          .filter((e: ApiEvent) => new Date(e.event_date) >= now)
          .sort(
            (a: ApiEvent, b: ApiEvent) =>
              new Date(a.event_date).getTime() -
              new Date(b.event_date).getTime()
          )
          .slice(0, 8);
        setEvents(upcoming);
      } catch {
        // silently fail — section just stays empty
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="flex flex-col gap-16 pb-16">
      <HeroSlider />

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center bg-white p-10 rounded-3xl shadow-sm border border-emerald-50">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-3xl font-bold text-gray-900">5,000+</h3>
            <p className="text-gray-500">Verified Seniors</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 mb-2">
              <Heart size={28} />
            </div>
            <h3 className="text-3xl font-bold text-gray-900">1,200+</h3>
            <p className="text-gray-500">Events Monthly</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 mb-2">
              <Users2 size={28} />
            </div>
            <h3 className="text-3xl font-bold text-gray-900">50+</h3>
            <p className="text-gray-500">Community Partners</p>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="max-w-7xl mx-auto px-4 w-full">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Upcoming Events
            </h2>
            <p className="text-gray-600 mt-2">
              Hand-picked gatherings happening near you.
            </p>
          </div>
          <a
            href="#/find-events"
            className="text-emerald-600 font-semibold flex items-center gap-2 group"
          >
            See all events{" "}
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </a>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-72 rounded-2xl bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center rounded-3xl border border-dashed border-gray-200 bg-white">
            <Calendar className="mx-auto mb-3 text-gray-300" size={40} />
            <p className="text-gray-500 font-medium">
              No upcoming events right now.
            </p>
            <a
              href="#/find-events"
              className="mt-4 inline-block text-sm text-emerald-600 font-bold hover:underline"
            >
              Browse all events
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {events.map((event) => (
              <a
                key={event.id}
                href={`#/event/${event.id}`}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 group"
              >
                <div className="relative h-48 overflow-hidden bg-emerald-50">
                  {event.banner_image_url ? (
                    <img
                      src={event.banner_image_url}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-emerald-200 text-5xl font-black select-none">
                      {event.title.charAt(0)}
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-emerald-700 shadow-sm capitalize">
                    {event.category}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                    {event.title}
                  </h3>
                  <div className="flex flex-col gap-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar
                        size={14}
                        className="text-emerald-500 shrink-0"
                      />
                      {formatDate(event.event_date)}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin
                          size={14}
                          className="text-emerald-500 shrink-0"
                        />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <span className="text-xs text-gray-400 truncate max-w-[120px]">
                      {event.organizations?.name ?? "Organizer"}
                    </span>
                    <span className="text-emerald-600 font-bold text-sm">
                      Free
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Sponsor Section */}
      <section className="bg-emerald-50 py-20 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Be Our Sponsor
              </h2>
              <p className="text-lg text-gray-700 mb-8 max-w-xl">
                Support the aging community and gain visibility. Our sponsors
                help provide free venues, snacks, and materials for our seniors
                activities.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <button className="bg-emerald-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-emerald-700 transition-colors">
                  Contact Sponsorship
                </button>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white p-8 rounded-2xl shadow-sm flex items-center justify-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer border border-emerald-100"
                >
                  <div className="text-xl font-bold text-gray-300 italic">
                    LOGO {i}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-200/20 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-200/20 rounded-full -ml-48 -mb-48 blur-3xl" />
      </section>
    </div>
  );
};

export default Home;
