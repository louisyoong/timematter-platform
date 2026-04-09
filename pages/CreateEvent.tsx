import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { UserRole } from '../types';
import { supabase, BACKEND_URL, TM_TOKEN_KEY } from '../services/supabase';
import { ImagePlus, CalendarClock, MapPin, AlignLeft, ArrowRight, CheckCircle } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

const getToken = async (): Promise<string | null> => {
  const jwt = localStorage.getItem(TM_TOKEN_KEY);
  if (jwt) return jwt;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
};

// ─── Shared UI ────────────────────────────────────────────────────────────────

const inputCls = 'w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm text-gray-700';

const Label: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
  <label className="block px-1 text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
    {children}{required && <span className="ml-1 text-red-400">*</span>}
  </label>
);

type ParkingOption = 'free' | 'paid' | 'none';
type AgeRestriction = 'all' | 'restricted';
type EventCategory = 'health' | 'social' | 'sport' | 'creative' | 'education';

const PARKING_OPTIONS: { value: ParkingOption; label: string }[] = [
  { value: 'free', label: 'Free Parking' },
  { value: 'paid', label: 'Paid Parking' },
  { value: 'none', label: 'No Parking' },
];

const EVENT_CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: 'health', label: 'Health' },
  { value: 'social', label: 'Social' },
  { value: 'sport', label: 'Sport' },
  { value: 'creative', label: 'Creative' },
  { value: 'education', label: 'Education' },
];

// ─── Main component ───────────────────────────────────────────────────────────

const CreateEvent: React.FC = () => {
  const { currentUser, setCurrentUser } = useApp();

  // Gate state — USER gets auto-promoted to ORGANIZER
  const [gateLoading, setGateLoading] = useState(false);
  const [gateError, setGateError] = useState('');
  const [ready, setReady] = useState(false);

  // Form state
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory | ''>('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [parkingInfo, setParkingInfo] = useState<ParkingOption>('free');
  const [ageRestriction, setAgeRestriction] = useState<AgeRestriction>('all');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [createdStatus, setCreatedStatus] = useState<'draft' | 'published'>('draft');

  // ── Gate: ensure user is ORGANIZER or ADMIN before showing the form ──────────
  useEffect(() => {
    const isAuthorized =
      currentUser?.role === UserRole.ORGANIZER ||
      currentUser?.role === UserRole.ADMIN ||
      currentUser?.role === UserRole.SUPER_ADMIN;

    if (isAuthorized) { setReady(true); return; }

    // USER → auto-register as organizer using their name
    if (currentUser?.role === UserRole.USER) {
      (async () => {
        setGateLoading(true);
        setGateError('');
        try {
          const token = await getToken();
          if (!token) { setGateError('Session expired.'); return; }

          const res = await fetch(`${BACKEND_URL}/api/organizations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name: currentUser.name }),
          });
          const json = await res.json();

          if (!res.ok) { setGateError(json.error || 'Failed to register as organizer.'); return; }

          setCurrentUser({ ...currentUser, role: UserRole.ORGANIZER });
          setReady(true);
        } catch (err) {
          setGateError(err instanceof Error ? err.message : 'Unable to connect.');
        } finally {
          setGateLoading(false);
        }
      })();
    }
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Success screen ────────────────────────────────────────────────────────────
  if (createdId) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="text-emerald-600" size={40} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">
          {createdStatus === 'published' ? 'Event Published!' : 'Draft Saved!'}
        </h2>
        <p className="text-sm text-gray-500">Your event has been created successfully.</p>
        <div className="flex gap-3 mt-2 flex-wrap justify-center">
          <a
            href={`#/events/${createdId}`}
            className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
          >
            View Event
          </a>
          <button
            onClick={() => {
              setCreatedId(null);
              setTitle(''); setCategory(''); setDescription(''); setLocation('');
              setEventDate(''); setBannerFile(null); setBannerPreview('');
            }}
            className="rounded-2xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
          >
            Create Another
          </button>
        </div>
      </div>
    );
  }

  // ── Gate loading / error ──────────────────────────────────────────────────────
  if (gateLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-400">
        Setting up your organizer account…
      </div>
    );
  }

  if (gateError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm font-medium text-red-500">{gateError}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-2xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!ready) return null;

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (status: 'draft' | 'published') => {
    setError('');
    setSubmitting(true);

    try {
      const token = await getToken();
      if (!token) { setError('Session expired.'); return; }

      if (!title.trim()) { setError('Event title is required.'); return; }
      if (!category) { setError('Category is required.'); return; }
      if (!eventDate) { setError('Event date is required.'); return; }

      const bannerImage = bannerFile ? await fileToBase64(bannerFile) : undefined;

      const body: Record<string, unknown> = {
        title: title.trim(),
        category,
        description,
        eventDate,
        location,
        parkingInfo,
        ageRestriction,
        status,
      };

      if (bannerImage) body.bannerImage = bannerImage;
      if (ageRestriction === 'restricted') {
        if (ageMin) body.ageMin = Number(ageMin);
        if (ageMax) body.ageMax = Number(ageMax);
      }

      const res = await fetch(`${BACKEND_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) { setError(json.error || 'Failed to create event.'); return; }

      setCreatedStatus(status);
      setCreatedId(json.event?.id ?? 'new');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render form ──────────────────────────────────────────────────────────────
  return (
    <div className="bg-[linear-gradient(180deg,#f4fbf7_0%,#ffffff_100%)] px-4 py-10 md:py-14">
      <div className="mx-auto w-full max-w-2xl space-y-5">

        <div className="mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Create Event</h1>
          <p className="mt-1 text-sm text-gray-500">Fill in the details to set up your event.</p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {/* ── 1. Banner ── */}
        <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
          <Label>Event Banner</Label>
          <label className="group relative flex h-52 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:border-emerald-400 hover:bg-emerald-50/40">
            {bannerPreview ? (
              <>
                <img src={bannerPreview} alt="preview" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-gray-700">Change image</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-emerald-500 transition-colors">
                <ImagePlus size={38} />
                <span className="text-sm font-medium">Click to upload banner</span>
                <span className="text-xs">JPG or PNG · recommended 1200 × 600</span>
              </div>
            )}
            <input
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                if (!f) return;
                if (!['image/jpeg', 'image/png'].includes(f.type)) {
                  setError('Banner must be a JPG or PNG file.'); return;
                }
                setError('');
                setBannerFile(f);
                setBannerPreview(URL.createObjectURL(f));
              }}
            />
          </label>
        </div>

        {/* ── 2. Core details ── */}
        <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm space-y-5">
          {/* Title */}
          <div>
            <Label required>Event Title</Label>
            <input
              type="text"
              required
              placeholder="Enter event title"
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label required>Category</Label>
            <select
              required
              className={inputCls}
              value={category}
              onChange={(e) => setCategory(e.target.value as EventCategory)}
            >
              <option value="">Select category</option>
              {EVENT_CATEGORIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date + Location */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label required>Date & Time</Label>
              <div className="relative">
                <CalendarClock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={17} />
                <input
                  type="datetime-local"
                  required
                  className={`${inputCls} pl-11`}
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={17} />
                <input
                  type="text"
                  placeholder="Enter venue or address"
                  className={`${inputCls} pl-11`}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label>Event Information Overview</Label>
            <div className="relative">
              <AlignLeft className="absolute left-4 top-4 text-gray-300" size={17} />
              <textarea
                rows={5}
                placeholder="Describe your event…"
                className={`${inputCls} pl-11`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── 3. Parking ── */}
        <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
          <Label>Parking</Label>
          <div className="flex flex-wrap gap-3">
            {PARKING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setParkingInfo(opt.value)}
                className={`rounded-2xl border-2 px-5 py-2.5 text-sm font-semibold transition-all ${
                  parkingInfo === opt.value
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 4. Age restriction ── */}
        <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
          <Label>Age Requirement</Label>
          <div className="flex flex-wrap gap-3 mb-4">
            {([
              { value: 'all' as AgeRestriction, label: 'All Ages Allowed' },
              { value: 'restricted' as AgeRestriction, label: 'Age Restricted' },
            ]).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAgeRestriction(opt.value)}
                className={`rounded-2xl border-2 px-5 py-2.5 text-sm font-semibold transition-all ${
                  ageRestriction === opt.value
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {ageRestriction === 'restricted' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>From</Label>
                <input
                  type="number"
                  min="0" max="120"
                  placeholder="e.g. 18"
                  className={inputCls}
                  value={ageMin}
                  onChange={(e) => setAgeMin(e.target.value)}
                />
              </div>
              <div>
                <Label>To</Label>
                <input
                  type="number"
                  min="0" max="120"
                  placeholder="e.g. 60"
                  className={inputCls}
                  value={ageMax}
                  onChange={(e) => setAgeMax(e.target.value)}
                />
              </div>
              {ageMin && ageMax && (
                <p className="col-span-2 px-1 text-xs font-semibold text-emerald-600">
                  Ages {ageMin} – {ageMax}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Submit buttons ── */}
        <div className="grid gap-3 sm:grid-cols-2 pb-8">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('draft')}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-emerald-600 py-4 font-bold text-emerald-700 transition-all hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save as Draft'}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('published')}
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-xl shadow-emerald-100 transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? 'Publishing…' : 'Publish Event'}
            {!submitting && <ArrowRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
