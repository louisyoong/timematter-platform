
import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Calendar, MapPin, Users, Share2, Check, ArrowLeft, Info, AlertTriangle, Clock3, Ticket, Sparkles } from 'lucide-react';

const getEventIdFromHash = () => {
  const match = window.location.hash.match(/^#\/event\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : '';
};

const createSeededRandom = (seedText: string) => {
  let seed = 0;

  for (let index = 0; index < seedText.length; index += 1) {
    seed = (seed * 31 + seedText.charCodeAt(index)) >>> 0;
  }

  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
};

const pickOne = <T,>(options: T[], random: () => number) => {
  return options[Math.floor(random() * options.length)];
};

const pickMany = (options: string[], count: number, random: () => number) => {
  const pool = [...options];
  const result: string[] = [];

  while (pool.length > 0 && result.length < count) {
    const index = Math.floor(random() * pool.length);
    result.push(pool.splice(index, 1)[0]);
  }

  return result;
};

const buildEventExtras = (event: {
  id: string;
  title: string;
  category: string;
  location: string;
  description: string;
  organizerName: string;
}) => {
  const random = createSeededRandom(`${event.id}-${event.title}`);
  const durations = ['60 minutes', '75 minutes', '90 minutes', '2 hours'];
  const audienceTypes = ['First-time attendees welcome', 'Best for active seniors', 'Caregivers are invited too', 'Small-group community session'];
  const bringItems = [
    'Bring a water bottle',
    'Wear comfortable clothing',
    'Bring your reading glasses if needed',
    'Arrive 15 minutes early for check-in',
    'Bring a light sweater for indoor comfort',
    'Keep your phone on silent during the session',
  ];
  const highlights = [
    'Guided warm-up and introductions',
    'Light refreshments after the session',
    'Friendly facilitator support throughout',
    'Short break halfway through the event',
    'Interactive activities designed for comfort',
    'Photo corner for community memories',
  ];
  const hostTitles = [
    'Community Wellness Lead',
    'Senior Program Coordinator',
    'Neighborhood Activity Host',
    'Certified Volunteer Facilitator',
  ];
  const hostFocus = [
    'creating safe, welcoming spaces for older adults',
    'running accessible social programs for the local community',
    'helping seniors stay active, connected, and confident',
    'designing calm, inclusive activities with a gentle pace',
  ];

  return {
    duration: pickOne(durations, random),
    seatsLeft: Math.floor(random() * 18) + 6,
    audienceNote: pickOne(audienceTypes, random),
    checklist: pickMany(bringItems, 3, random),
    highlights: pickMany(highlights, 3, random),
    hostTitle: pickOne(hostTitles, random),
    hostBio: `${event.organizerName} focuses on ${pickOne(hostFocus, random)}. This ${event.category.toLowerCase()} session at ${event.location} is structured to feel approachable, social, and easy to join.`,
    extraDescription: `Expect a relaxed format with clear guidance, easy pacing, and time to talk with other attendees. Every part of ${event.title} is planned to help participants feel comfortable from arrival through closing.`,
  };
};

const EventDetails: React.FC = () => {
  const { events, currentUser, joinEvent } = useApp();
  const [joinStatus, setJoinStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const id = getEventIdFromHash();

  const event = events.find(e => e.id === id);
  const eventExtras = event ? buildEventExtras(event) : null;

  if (!event) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-gray-900">Event Not Found</h2>
        <a href="#/find-events" className="mt-4 text-emerald-600 font-bold hover:underline">Return to browse</a>
      </div>
    );
  }

  if (event.isBlocked) {
    return (
       <div className="max-w-2xl mx-auto my-20 bg-white p-12 rounded-[2rem] shadow-xl border border-red-100 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">This Event is Unavailable</h2>
          <p className="text-gray-600">This event has been removed or blocked by administrators due to community guideline violations.</p>
          <a href="#/find-events" className="mt-8 inline-block px-8 py-3 bg-gray-100 text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition-colors">
            Back to Events
          </a>
       </div>
    );
  }

  const handleJoin = async () => {
    if (!currentUser) {
      window.location.hash = '/login';
      return;
    }
    setIsJoining(true);
    const result = await joinEvent(event.id);
    setJoinStatus(result);
    setIsJoining(false);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="pb-20">
      <div className="relative h-[400px] md:h-[500px]">
        <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>
        <div className="absolute top-6 left-6 flex items-center gap-4">
          <a href="#/find-events" className="p-3 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white/40 transition-all">
            <ArrowLeft size={24} />
          </a>
        </div>
        <div className="absolute bottom-12 left-0 right-0 max-w-7xl mx-auto px-4 md:px-8 text-white">
          <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">
            {event.category}
          </span>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg max-w-3xl">{event.title}</h1>
          <div className="flex flex-wrap items-center gap-6 text-emerald-50">
            <div className="flex items-center gap-2"><Users size={20} /> By {event.organizerName}</div>
            <div className="flex items-center gap-2"><Users size={20} /> {event.joinedCount} people attending</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-[-40px] relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-8 bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12">
            <div className="flex items-center gap-3 text-emerald-600 mb-6 font-bold uppercase tracking-widest text-sm">
              <Info size={18} /> About this event
            </div>
            <div className="prose max-w-none text-gray-700 leading-relaxed text-lg">
              {event.description.split('\n').map((para, i) => (
                <p key={i} className="mb-4">{para}</p>
              ))}
              {eventExtras && <p className="mb-4">{eventExtras.extraDescription}</p>}
            </div>

            {eventExtras && (
              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                {eventExtras.highlights.map((highlight) => (
                  <div key={highlight} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-emerald-600">
                        <Sparkles size={18} />
                      </div>
                      <p className="text-base text-gray-700 font-medium">{highlight}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-12 pt-12 border-t border-gray-100">
               <h3 className="text-xl font-bold text-gray-900 mb-6">Event Host</h3>
               <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                 <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-2xl font-bold">
                   {event.organizerName.charAt(0)}
                 </div>
                 <div>
                    <h4 className="font-bold text-gray-900">{event.organizerName}</h4>
                    <p className="text-sm text-gray-500">{eventExtras?.hostTitle || 'Verified Community Partner'}</p>
                    {eventExtras && <p className="text-sm text-gray-600 mt-2 max-w-xl">{eventExtras.hostBio}</p>}
                    <button className="text-emerald-600 text-sm font-bold mt-1 hover:underline">Contact Host</button>
                 </div>
               </div>
            </div>
          </div>

          {/* Sidebar Info & Sticky Actions */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sticky top-24">
              <div className="space-y-6 mb-8">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Date & Time</p>
                    <p className="text-gray-900 font-bold">{event.dateTime}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Location</p>
                    <p className="text-gray-900 font-bold">{event.location}</p>
                  </div>
                </div>
                {eventExtras && (
                  <>
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Clock3 size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Duration</p>
                        <p className="text-gray-900 font-bold">{eventExtras.duration}</p>
                        <p className="text-sm text-gray-500">{eventExtras.audienceNote}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Ticket size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Availability</p>
                        <p className="text-gray-900 font-bold">{eventExtras.seatsLeft} seats left</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {joinStatus?.success ? (
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center mb-6">
                  <Check className="text-emerald-600 mx-auto mb-2" size={32} />
                  <p className="text-emerald-800 font-bold">{joinStatus.message}</p>
                </div>
              ) : (
                <button 
                  onClick={handleJoin}
                  disabled={isJoining || currentUser?.joinedEvents.includes(event.id)}
                  className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                    currentUser?.joinedEvents.includes(event.id) 
                    ? 'bg-gray-100 text-gray-400 cursor-default'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
                  }`}
                >
                  {isJoining ? 'Processing...' : currentUser?.joinedEvents.includes(event.id) ? 'Joined' : 'Join for Free'}
                </button>
              )}

              {!currentUser && (
                <p className="text-center text-sm text-gray-400 mt-4">
                  Login required to secure your ticket.
                </p>
              )}

              <button 
                onClick={handleShare}
                className="w-full mt-4 flex items-center justify-center gap-2 py-4 text-emerald-600 font-bold hover:bg-emerald-50 rounded-2xl border-2 border-emerald-600 transition-colors"
              >
                <Share2 size={20} /> Share Event
              </button>

              {eventExtras && (
                <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-5">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">What to Know</h4>
                  <div className="space-y-2">
                    {eventExtras.checklist.map((item) => (
                      <div key={item} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white">
              <h4 className="text-lg font-bold mb-4">Safety First</h4>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                All SilverLink events follow strict community guidelines. If you feel uncomfortable or notice something wrong, report the event immediately.
              </p>
              <button className="text-red-400 text-sm font-bold hover:underline">Report Event</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
