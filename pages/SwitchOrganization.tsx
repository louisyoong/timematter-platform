import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { supabase, BACKEND_URL, TM_TOKEN_KEY } from '../services/supabase';
import { UserRole } from '../types';
import {
  Building2, MapPin, FileText, Upload, ArrowRight,
  CheckCircle, Pencil, AlertCircle,
} from 'lucide-react';

type Org = {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  address?: string;
};

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

const inputCls = 'w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm text-gray-700';
const Label: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
  <label className="block px-1 text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
    {children}{required && <span className="ml-1 text-red-400">*</span>}
  </label>
);

const SwitchOrganization: React.FC = () => {
  const { currentUser, setCurrentUser } = useApp();

  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<Org | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ── Load org on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) { setLoading(false); return; }
      try {
        const res = await fetch(`${BACKEND_URL}/api/organizations/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setLoading(false); return; }
        const json = await res.json();
        if (json.has_organization && json.organization) {
          const o: Org = json.organization;
          setOrg(o);
          setName(o.name ?? '');
          setDescription(o.description ?? '');
          setAddress(o.address ?? '');
          setCurrentLogoUrl(o.logo_url ?? '');
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setSaving(true);

    try {
      const token = await getToken();
      if (!token) { setError('Session expired.'); return; }

      const logoBase64 = logo ? await fileToBase64(logo) : null;
      const isCreate = !org;
      const method = isCreate ? 'POST' : 'PATCH';

      const body: Record<string, unknown> = { name, description, address };
      if (logoBase64) body.logo = logoBase64;

      const res = await fetch(`${BACKEND_URL}/api/organizations`, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) { setError(json.error || 'Failed to save organization.'); return; }

      const saved: Org = json.organization;
      setOrg(saved);
      setCurrentLogoUrl(saved.logo_url ?? '');
      setLogo(null);
      setIsEditing(false);

      if (isCreate) {
        // Promote role to ORGANIZER in context
        if (currentUser) {
          setCurrentUser({ ...currentUser, role: UserRole.ORGANIZER });
        }
        window.location.hash = '/create-event';
      } else {
        setSuccess(json.message || 'Organization updated successfully.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const showForm = !org || isEditing;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-gray-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-[linear-gradient(180deg,#f4fbf7_0%,#ffffff_100%)] px-4 py-10 md:py-16">
      <div className="mx-auto w-full max-w-xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {org && !isEditing ? 'Your Organization' : org ? 'Edit Organization' : 'Create Your Organization'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {org && !isEditing
              ? 'Your organization profile on TimeMatter.'
              : 'Set up your organization to start hosting events.'}
          </p>
        </div>

        {/* ── View mode ── */}
        {org && !isEditing && (
          <div className="rounded-[2.5rem] border border-emerald-100 bg-white p-8 shadow-xl shadow-emerald-50">
            {success && (
              <div className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                <CheckCircle size={16} /> {success}
              </div>
            )}

            {/* Logo + name */}
            <div className="flex items-center gap-5 mb-8">
              {currentLogoUrl ? (
                <img src={currentLogoUrl} alt="logo" className="h-20 w-20 rounded-2xl object-cover border border-gray-100 shadow" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Building2 size={32} />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{org.name}</h2>
                {org.address && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-400">
                    <MapPin size={13} /> {org.address}
                  </p>
                )}
              </div>
            </div>

            {org.description && (
              <div className="mb-8 rounded-2xl bg-gray-50 px-5 py-4 text-sm text-gray-600 leading-relaxed">
                {org.description}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setIsEditing(true); setSuccess(''); setError(''); }}
                className="flex items-center gap-2 rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
              >
                <Pencil size={15} /> Edit Organization
              </button>
              <a
                href="#/create-event"
                className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition-all hover:bg-emerald-700"
              >
                Create Event <ArrowRight size={15} />
              </a>
            </div>
          </div>
        )}

        {/* ── Create / Edit form ── */}
        {showForm && (
          <div className="rounded-[2.5rem] border border-emerald-100 bg-white p-8 shadow-xl shadow-emerald-50 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  <AlertCircle size={15} /> {error}
                </div>
              )}

              {/* Org name */}
              <div>
                <Label required>Organization Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={17} />
                  <input
                    type="text"
                    required
                    placeholder="TimeMatter Events Sdn Bhd"
                    className={`${inputCls} pl-11`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <Label>Description</Label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 text-gray-300" size={17} />
                  <textarea
                    rows={4}
                    placeholder="Tell people about your organization…"
                    className={`${inputCls} pl-11`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <Label>Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={17} />
                  <input
                    type="text"
                    placeholder="Kuala Lumpur, Malaysia"
                    className={`${inputCls} pl-11`}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              {/* Logo */}
              <div>
                <Label>Logo</Label>
                <label className="flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-4 transition-colors hover:border-emerald-400 hover:bg-emerald-50">
                  {logo ? (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 shrink-0">
                      <CheckCircle size={20} className="text-emerald-600" />
                    </div>
                  ) : currentLogoUrl ? (
                    <img src={currentLogoUrl} alt="logo" className="h-12 w-12 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 shrink-0">
                      <Upload size={18} className="text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {logo ? logo.name : currentLogoUrl ? 'Click to change logo' : 'Click to upload logo'}
                    </p>
                    <p className="text-xs text-gray-400">JPG or PNG</p>
                  </div>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      if (f && ['image/jpeg', 'image/png'].includes(f.type)) setLogo(f);
                    }}
                  />
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => { setIsEditing(false); setError(''); }}
                    className="flex-1 rounded-2xl border border-gray-200 py-4 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-xl shadow-emerald-100 transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? 'Saving…' : org ? 'Save Changes' : 'Create Organization'}
                  {!saving && <ArrowRight size={18} />}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default SwitchOrganization;
