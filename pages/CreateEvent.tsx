import React, { useState, useEffect } from "react";
import { useApp } from "../store/AppContext";
import { UserRole } from "../types";
import { supabase, BACKEND_URL, TM_TOKEN_KEY } from "../services/supabase";
import {
  ImagePlus,
  CalendarClock,
  MapPin,
  AlignLeft,
  ArrowRight,
  CheckCircle,
  PencilLine,
} from "lucide-react";

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
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
};

const getEditId = (): string | null => {
  const search = window.location.hash.split("?")[1] ?? "";
  return new URLSearchParams(search).get("id");
};

const toDatetimeLocal = (iso: string): string => {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().slice(0, 16);
  } catch {
    return "";
  }
};

const inputCls =
  "w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm text-gray-700";

const Label: React.FC<{ children: React.ReactNode; required?: boolean }> = ({
  children,
  required,
}) => (
  <label className="block px-1 text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
    {children}
    {required && <span className="ml-1 text-red-400">*</span>}
  </label>
);

type ParkingOption = "free" | "paid" | "none";
type AgeRestriction = "all" | "restricted";
type EventCategory = "health" | "social" | "sport" | "creative" | "education";

const PARKING_OPTIONS: { value: ParkingOption; label: string }[] = [
  { value: "free", label: "Free Parking" },
  { value: "paid", label: "Paid Parking" },
  { value: "none", label: "No Parking" },
];

const EVENT_CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: "health", label: "Health" },
  { value: "social", label: "Social" },
  { value: "sport", label: "Sport" },
  { value: "creative", label: "Creative" },
  { value: "education", label: "Education" },
];

const CreateEvent: React.FC = () => {
  const { currentUser, setCurrentUser } = useApp();

  const editId = getEditId();
  const isEditMode = Boolean(editId);

  // Gate state
  const [gateLoading, setGateLoading] = useState(false);
  const [gateError, setGateError] = useState("");
  const [ready, setReady] = useState(false);

  // Form state
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<EventCategory | "">("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [parkingInfo, setParkingInfo] = useState<ParkingOption>("free");
  const [ageRestriction, setAgeRestriction] = useState<AgeRestriction>("all");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedStatus, setSavedStatus] = useState<"draft" | "published">(
    "draft"
  );
  const [prefillLoading, setPrefillLoading] = useState(false);

  // ── Gate: ensure ORGANIZER / ADMIN, auto-promote USER ────────────────────────
  useEffect(() => {
    const isAuthorized =
      currentUser?.role === UserRole.ORGANIZER ||
      currentUser?.role === UserRole.ADMIN ||
      currentUser?.role === UserRole.SUPER_ADMIN;

    if (isAuthorized) {
      setReady(true);
      return;
    }

    if (currentUser?.role === UserRole.USER) {
      (async () => {
        setGateLoading(true);
        setGateError("");
        try {
          const token = await getToken();
          if (!token) {
            setGateError("Session expired.");
            return;
          }

          const res = await fetch(`${BACKEND_URL}/api/organizations`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ name: currentUser.name }),
          });
          const json = await res.json();
          if (!res.ok) {
            setGateError(json.error || "Failed to register as organizer.");
            return;
          }

          setCurrentUser({ ...currentUser, role: UserRole.ORGANIZER });
          setReady(true);
        } catch (err) {
          setGateError(
            err instanceof Error ? err.message : "Unable to connect."
          );
        } finally {
          setGateLoading(false);
        }
      })();
    }
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pre-fill form when editing a draft ──────────────────────────────────────
  useEffect(() => {
    if (!ready || !editId) return;
    (async () => {
      setPrefillLoading(true);
      try {
        const token = await getToken();
        const res = await fetch(`${BACKEND_URL}/api/events/${editId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const json = await res.json();
        const e = json.event ?? json;

        setTitle(e.title ?? "");
        setCategory((e.category as EventCategory) ?? "");
        setEventDate(toDatetimeLocal(e.event_date ?? ""));
        setLocation(e.location ?? "");
        setDescription(e.description ?? "");
        setParkingInfo((e.parking_info as ParkingOption) ?? "free");
        setAgeRestriction((e.age_restriction as AgeRestriction) ?? "all");
        setAgeMin(e.age_min ? String(e.age_min) : "");
        setAgeMax(e.age_max ? String(e.age_max) : "");
        if (e.banner_image_url) setBannerPreview(e.banner_image_url);
      } finally {
        setPrefillLoading(false);
      }
    })();
  }, [ready, editId]);

  // ── Success screen ───────────────────────────────────────────────────────────
  if (savedId) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="text-emerald-600" size={40} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">
          {savedStatus === "published" ? "Event Published!" : "Draft Saved!"}
        </h2>
        <p className="text-sm text-gray-500">
          {savedStatus === "published"
            ? "Your event is now live and visible to everyone."
            : "Your draft has been saved. You can continue editing it anytime."}
        </p>
        <div className="flex gap-3 mt-2 flex-wrap justify-center">
          {savedStatus === "published" ? (
            <a
              href={`#/event/${savedId}`}
              className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
            >
              View Event
            </a>
          ) : (
            <a
              href={`#/create-event?id=${savedId}`}
              onClick={() => setSavedId(null)}
              className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
            >
              <PencilLine size={16} /> Continue Editing
            </a>
          )}
          <button
            onClick={() => {
              setSavedId(null);
              setTitle("");
              setCategory("");
              setDescription("");
              setLocation("");
              setEventDate("");
              setBannerFile(null);
              setBannerPreview("");
              setParkingInfo("free");
              setAgeRestriction("all");
              setAgeMin("");
              setAgeMax("");
              window.location.hash = "/create-event";
            }}
            className="rounded-2xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
          >
            Create Another
          </button>
        </div>
      </div>
    );
  }

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

  if (!ready || prefillLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-400">
        {prefillLoading ? "Loading draft…" : null}
      </div>
    );
  }

  // ── Submit (POST for new, PATCH for edit) ────────────────────────────────────
  const handleSubmit = async (status: "draft" | "published") => {
    setError("");
    setSubmitting(true);

    try {
      const token = await getToken();
      if (!token) {
        setError("Session expired.");
        return;
      }

      if (status === "published") {
        if (!title.trim()) {
          setError("Event title is required.");
          setSubmitting(false);
          return;
        }
        if (!category) {
          setError("Category is required.");
          setSubmitting(false);
          return;
        }
        if (!eventDate) {
          setError("Event date is required.");
          setSubmitting(false);
          return;
        }
      }

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

      if (bannerFile) body.bannerImage = await fileToBase64(bannerFile);
      if (ageRestriction === "restricted") {
        if (ageMin) body.ageMin = Number(ageMin);
        if (ageMax) body.ageMax = Number(ageMax);
      }

      const url = isEditMode
        ? `${BACKEND_URL}/api/events/${editId}`
        : `${BACKEND_URL}/api/events`;
      const method = isEditMode ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to save event.");
        return;
      }

      setSavedStatus(status);
      setSavedId(String(json.event?.id ?? editId ?? "new"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render form ─────────────────────────────────────────────────────────────
  return (
    <div className="bg-[linear-gradient(180deg,#f4fbf7_0%,#ffffff_100%)] px-4 py-10 md:py-14">
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <div className="mb-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? "Edit Event" : "Create Event"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isEditMode
                ? "Update your draft and publish when ready."
                : "Fill in the details to set up your event."}
            </p>
          </div>
          {isEditMode && (
            <span className="shrink-0 mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
              <PencilLine size={12} /> Draft
            </span>
          )}
        </div>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {/* ── 1. Banner ── */}
        <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
          <Label>Event Banner</Label>
          <label className="group relative flex h-52 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:border-amber-400 hover:bg-amber-50/40">
            {bannerPreview ? (
              <>
                <img
                  src={bannerPreview}
                  alt="preview"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-gray-700">
                    Change image
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-amber-500 transition-colors">
                <ImagePlus size={38} />
                <span className="text-sm font-medium">
                  Click to upload banner
                </span>
                <span className="text-xs">
                  JPG or PNG · recommended 1200 × 600
                </span>
              </div>
            )}
            <input
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                if (!f) return;
                if (!["image/jpeg", "image/png"].includes(f.type)) {
                  setError("Banner must be a JPG or PNG file.");
                  return;
                }
                setError("");
                setBannerFile(f);
                setBannerPreview(URL.createObjectURL(f));
              }}
            />
          </label>
        </div>

        {/* ── 2. Core details ── */}
        <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm space-y-5">
          <div>
            <Label required>Event Title</Label>
            <input
              type="text"
              placeholder="Enter event title"
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label required>Category</Label>
            <select
              className={inputCls}
              value={category}
              onChange={(e) => setCategory(e.target.value as EventCategory)}
            >
              <option value="">Select category</option>
              {EVENT_CATEGORIES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label required>Date & Time</Label>
              <div className="relative">
                <CalendarClock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                  size={17}
                />
                <input
                  type="datetime-local"
                  className={`${inputCls} pl-11`}
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <div className="relative">
                <MapPin
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                  size={17}
                />
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

          <div>
            <Label>Event Information Overview</Label>
            <div className="relative">
              <AlignLeft
                className="absolute left-4 top-4 text-gray-300"
                size={17}
              />
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
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
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
            {[
              { value: "all" as AgeRestriction, label: "All Ages Allowed" },
              {
                value: "restricted" as AgeRestriction,
                label: "Age Restricted",
              },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAgeRestriction(opt.value)}
                className={`rounded-2xl border-2 px-5 py-2.5 text-sm font-semibold transition-all ${
                  ageRestriction === opt.value
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {ageRestriction === "restricted" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>From</Label>
                <input
                  type="number"
                  min="0"
                  max="120"
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
                  min="0"
                  max="120"
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
            onClick={() => handleSubmit("draft")}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-[#2d1912] py-4 font-bold text-[#2d1912] transition-all hover:bg-[#2d1912] hover:text-[#ffffff] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Save as Draft"}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit("published")}
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-xl shadow-amber-100 transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Publishing…" : "Publish Event"}
            {!submitting && <ArrowRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
