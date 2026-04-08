import React, { useState, useMemo } from 'react';
import { supabase, BACKEND_URL } from '../services/supabase';
import { useApp } from '../store/AppContext';
import { UserRole } from '../types';
import { ArrowRight, Building2, MapPin, Upload } from 'lucide-react';

// ─── Static option lists ─────────────────────────────────────────────────────

const NATIONALITIES = [
  'Afghan', 'Albanian', 'Algerian', 'American', 'Andorran', 'Angolan', 'Argentine',
  'Armenian', 'Australian', 'Austrian', 'Azerbaijani', 'Bahraini', 'Bangladeshi',
  'Belarusian', 'Belgian', 'Bolivian', 'Bosnian', 'Brazilian', 'British', 'Bulgarian',
  'Cambodian', 'Cameroonian', 'Canadian', 'Chilean', 'Chinese', 'Colombian', 'Congolese',
  'Croatian', 'Cuban', 'Czech', 'Danish', 'Dutch', 'Ecuadorian', 'Egyptian', 'Emirati',
  'Estonian', 'Ethiopian', 'Filipino', 'Finnish', 'French', 'Georgian', 'German',
  'Ghanaian', 'Greek', 'Guatemalan', 'Honduran', 'Hungarian', 'Indian', 'Indonesian',
  'Iranian', 'Iraqi', 'Irish', 'Israeli', 'Italian', 'Ivorian', 'Japanese', 'Jordanian',
  'Kazakhstani', 'Kenyan', 'Korean', 'Kuwaiti', 'Kyrgyz', 'Laotian', 'Latvian',
  'Lebanese', 'Libyan', 'Lithuanian', 'Luxembourgish', 'Macedonian', 'Malagasy',
  'Malaysian', 'Maldivian', 'Malian', 'Maltese', 'Mauritanian', 'Mexican', 'Moldovan',
  'Mongolian', 'Montenegrin', 'Moroccan', 'Mozambican', 'Namibian', 'Nepali',
  'New Zealander', 'Nicaraguan', 'Nigerian', 'Norwegian', 'Omani', 'Pakistani',
  'Palestinian', 'Panamanian', 'Paraguayan', 'Peruvian', 'Polish', 'Portuguese',
  'Qatari', 'Romanian', 'Russian', 'Rwandan', 'Saudi', 'Senegalese', 'Serbian',
  'Singaporean', 'Slovak', 'Slovenian', 'Somali', 'South African', 'Spanish',
  'Sri Lankan', 'Sudanese', 'Swedish', 'Swiss', 'Syrian', 'Taiwanese', 'Tajik',
  'Tanzanian', 'Thai', 'Tunisian', 'Turkish', 'Turkmen', 'Ugandan', 'Ukrainian',
  'Uruguayan', 'Uzbek', 'Venezuelan', 'Vietnamese', 'Yemeni', 'Zambian', 'Zimbabwean',
];

const RELIGIONS = [
  'Islam', 'Christianity', 'Catholicism', 'Protestantism', 'Orthodox Christianity',
  'Hinduism', 'Buddhism', 'Sikhism', 'Judaism', 'Taoism', 'Confucianism', 'Shinto',
  'Jainism', 'Zoroastrianism', 'Bahá\'í Faith', 'Animism', 'Indigenous / Folk Religion',
  'Atheism', 'Agnosticism', 'Prefer not to say', 'Other',
];

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const MONTHS = [
  { value: '01', label: 'January' }, { value: '02', label: 'February' },
  { value: '03', label: 'March' },   { value: '04', label: 'April' },
  { value: '05', label: 'May' },     { value: '06', label: 'June' },
  { value: '07', label: 'July' },    { value: '08', label: 'August' },
  { value: '09', label: 'September' },{ value: '10', label: 'October' },
  { value: '11', label: 'November' },{ value: '12', label: 'December' },
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => String(currentYear - i));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

const calcAge = (day: string, month: string, year: string): number | null => {
  if (!day || !month || !year) return null;
  const dob = new Date(Number(year), Number(month) - 1, Number(day));
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age >= 0 ? age : null;
};

// ─── Shared UI components ─────────────────────────────────────────────────────

const selectCls =
  'w-full appearance-none px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm text-gray-700 cursor-pointer';

const inputCls =
  'w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm text-gray-700';

const Label: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
  <label className="block px-1 text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
    {children}{required && <span className="ml-1 text-red-400">*</span>}
  </label>
);

const ImageUpload: React.FC<{
  label: string;
  required?: boolean;
  value: File | null;
  onChange: (f: File | null) => void;
  onError: (msg: string) => void;
}> = ({ label, required, value, onChange, onError }) => (
  <div>
    <Label required={required}>{label}</Label>
    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-5 px-3 text-sm text-gray-400 transition-colors hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600">
      <Upload size={18} />
      {value
        ? <span className="max-w-full truncate text-center text-xs font-semibold text-emerald-700">{value.name}</span>
        : <span className="text-xs text-center">Click to upload<br />JPG / PNG</span>}
      <input
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          if (!file) { onChange(null); return; }
          if (!['image/jpeg', 'image/png'].includes(file.type)) {
            onError(`${label} must be a JPG or PNG file.`);
            return;
          }
          onChange(file);
        }}
      />
    </label>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

type CompanyForm = { company_name: string; company_address: string };
const initialCompany: CompanyForm = { company_name: '', company_address: '' };

const CompleteProfile: React.FC = () => {
  const { setCurrentUser } = useApp();
  const [isCompany, setIsCompany] = useState(false);
  const [name, setName] = useState('');

  // Individual fields
  const [title, setTitle] = useState('');
  const [gender, setGender] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [nationality, setNationality] = useState('');
  const [religion, setReligion] = useState('');
  const [address, setAddress] = useState('');

  // Company fields
  const [company, setCompany] = useState<CompanyForm>(initialCompany);

  // Files
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [companyDoc, setCompanyDoc] = useState<File | null>(null);

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-calculate age from DOB dropdowns
  const computedAge = useMemo(() => calcAge(dobDay, dobMonth, dobYear), [dobDay, dobMonth, dobYear]);
  const dateOfBirth = dobDay && dobMonth && dobYear ? `${dobDay}/${dobMonth}/${dobYear}` : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isCompany) {
      if (!dateOfBirth) { setError('Please select a complete date of birth.'); return; }
      if (computedAge === null || computedAge < 1) { setError('Date of birth is invalid.'); return; }
      if (!idFront || !idBack) { setError('Identity card front and back images are required.'); return; }
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('Session expired. Please sign in again.'); window.location.hash = '/signup'; return; }

      const profilePhotoBase64 = profilePhoto ? await fileToBase64(profilePhoto) : null;
      let payload: Record<string, unknown>;

      if (isCompany) {
        payload = {
          isCompany: true,
          name: name || undefined,
          company_name: company.company_name,
          company_address: company.company_address || undefined,
          companyInfo: companyDoc ? await fileToBase64(companyDoc) : null,
          profilePhoto: profilePhotoBase64,
        };
      } else {
        payload = {
          isCompany: false,
          name: name || undefined,
          title: title || undefined,
          gender: gender || undefined,
          dateOfBirth,
          age: computedAge,
          nationality: nationality || undefined,
          religion: religion || undefined,
          address: address || undefined,
          profilePhoto: profilePhotoBase64,
          identityCardFront: await fileToBase64(idFront!),
          identityCardBack: await fileToBase64(idBack!),
        };
      }

      const res = await fetch(`${BACKEND_URL}/api/auth/complete-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) { setError(json.error || 'Failed to save profile.'); return; }

      const u = json.user;
      setCurrentUser({
        id: u?.id || session.user.id,
        email: u?.email || session.user.email || '',
        name: u?.name || u?.company_name || session.user.email || '',
        role: (u?.role as UserRole) || UserRole.USER,
        isBlocked: Boolean(u?.is_blocked),
        joinedEvents: u?.joinedEvents || [],
      });
      window.location.hash = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] bg-[linear-gradient(180deg,#f4fbf7_0%,#ffffff_100%)] px-4 py-10 md:py-16">
      <div className="mx-auto w-full max-w-5xl">

        {/* Page header */}
        <div className="mb-8 text-center">
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
            TimeMatter
          </span>
          <h1 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">Complete Your Profile</h1>
          <p className="mt-2 text-sm text-gray-500">This information is collected once to verify your identity.</p>
        </div>

        <div className="rounded-[2.5rem] border border-emerald-100 bg-white p-6 shadow-2xl shadow-emerald-100 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">

            {error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            {/* ── Company toggle ── */}
            <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
              <Building2 size={20} className="shrink-0 text-gray-400" />
              <span className="flex-1 text-sm font-medium text-gray-700">This is a company account</span>
              <button
                type="button"
                role="switch"
                aria-checked={isCompany}
                onClick={() => setIsCompany((v) => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                  isCompany ? 'bg-emerald-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${isCompany ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div>
              <Label>Full Name</Label>
              <input
                type="text"
                placeholder="Enter your full name"
                className={inputCls}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {isCompany ? (
              /* ══ COMPANY FIELDS ══════════════════════════════════════════ */
              <div className="space-y-6">
                {/* Company name — full width */}
                <div>
                  <Label required>Company Name</Label>
                  <input
                    type="text"
                    required
                    placeholder="Acme Sdn Bhd"
                    className={inputCls}
                    value={company.company_name}
                    onChange={(e) => setCompany((p) => ({ ...p, company_name: e.target.value }))}
                  />
                </div>

                {/* Company address — full width */}
                <div>
                  <Label>Company Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 text-gray-300" size={18} />
                    <textarea
                      rows={3}
                      placeholder="Enter company address"
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm text-gray-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      value={company.company_address}
                      onChange={(e) => setCompany((p) => ({ ...p, company_address: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Documents — side by side on sm+ */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <ImageUpload label="Company Document / Info" value={companyDoc} onChange={setCompanyDoc} onError={setError} />
                  <ImageUpload label="Profile Photo" value={profilePhoto} onChange={setProfilePhoto} onError={setError} />
                </div>
              </div>

            ) : (
              /* ══ INDIVIDUAL FIELDS ═══════════════════════════════════════ */
              <div className="space-y-6">

                {/* Row 1: Title + Gender */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Title</Label>
                    <select className={selectCls} value={title} onChange={(e) => setTitle(e.target.value)}>
                      <option value="">Select title</option>
                      {['Mr', 'Mrs', 'Ms', 'Dr'].map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <select className={selectCls} value={gender} onChange={(e) => setGender(e.target.value)}>
                      <option value="">Select gender</option>
                      {['Male', 'Female', 'Other'].map((g) => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                {/* Row 2: Date of Birth (3 dropdowns) + computed Age */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label required>Date of Birth</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {/* Day */}
                      <select className={selectCls} value={dobDay} onChange={(e) => setDobDay(e.target.value)}>
                        <option value="">DD</option>
                        {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      {/* Month */}
                      <select className={selectCls} value={dobMonth} onChange={(e) => setDobMonth(e.target.value)}>
                        <option value="">MM</option>
                        {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                      {/* Year */}
                      <select className={selectCls} value={dobYear} onChange={(e) => setDobYear(e.target.value)}>
                        <option value="">YYYY</option>
                        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Age — read-only, auto-filled */}
                  <div>
                    <Label required>Age</Label>
                    <div className={`${inputCls} flex items-center justify-between`}>
                      <span className={computedAge !== null ? 'text-gray-900 font-semibold' : 'text-gray-400'}>
                        {computedAge !== null ? `${computedAge} years old` : 'Auto-calculated from DOB'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 3: Nationality + Religion */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Nationality</Label>
                    <select className={selectCls} value={nationality} onChange={(e) => setNationality(e.target.value)}>
                      <option value="">Select nationality</option>
                      {NATIONALITIES.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Religion</Label>
                    <select className={selectCls} value={religion} onChange={(e) => setReligion(e.target.value)}>
                      <option value="">Select religion</option>
                      {RELIGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                {/* Row 4: Address — full width */}
                <div>
                  <Label>Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 text-gray-300" size={18} />
                    <textarea
                      rows={3}
                      placeholder="Enter your address"
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm text-gray-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                </div>

                {/* Row 5: Images — 3 equal columns on md+, 1 col on mobile */}
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  <ImageUpload label="Profile Photo" value={profilePhoto} onChange={setProfilePhoto} onError={setError} />
                  <ImageUpload label="ID Card Front" required value={idFront} onChange={setIdFront} onError={setError} />
                  <ImageUpload label="ID Card Back" required value={idBack} onChange={setIdBack} onError={setError} />
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-xl shadow-emerald-100 transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Saving…' : 'Complete Profile'}
              {!isSubmitting && <ArrowRight size={20} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
