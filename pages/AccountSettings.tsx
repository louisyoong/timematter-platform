import React, { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { supabase, BACKEND_URL, TM_TOKEN_KEY } from '../services/supabase';
import {
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  Save,
  Upload,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

// ─── Static lists (same as CompleteProfile) ───────────────────────────────────

const NATIONALITIES = [
  'Afghan','Albanian','Algerian','American','Andorran','Angolan','Argentine',
  'Armenian','Australian','Austrian','Azerbaijani','Bahraini','Bangladeshi',
  'Belarusian','Belgian','Bolivian','Bosnian','Brazilian','British','Bulgarian',
  'Cambodian','Cameroonian','Canadian','Chilean','Chinese','Colombian','Congolese',
  'Croatian','Cuban','Czech','Danish','Dutch','Ecuadorian','Egyptian','Emirati',
  'Estonian','Ethiopian','Filipino','Finnish','French','Georgian','German',
  'Ghanaian','Greek','Guatemalan','Honduran','Hungarian','Indian','Indonesian',
  'Iranian','Iraqi','Irish','Israeli','Italian','Ivorian','Japanese','Jordanian',
  'Kazakhstani','Kenyan','Korean','Kuwaiti','Kyrgyz','Laotian','Latvian',
  'Lebanese','Libyan','Lithuanian','Luxembourgish','Macedonian','Malagasy',
  'Malaysian','Maldivian','Malian','Maltese','Mauritanian','Mexican','Moldovan',
  'Mongolian','Montenegrin','Moroccan','Mozambican','Namibian','Nepali',
  'New Zealander','Nicaraguan','Nigerian','Norwegian','Omani','Pakistani',
  'Palestinian','Panamanian','Paraguayan','Peruvian','Polish','Portuguese',
  'Qatari','Romanian','Russian','Rwandan','Saudi','Senegalese','Serbian',
  'Singaporean','Slovak','Slovenian','Somali','South African','Spanish',
  'Sri Lankan','Sudanese','Swedish','Swiss','Syrian','Taiwanese','Tajik',
  'Tanzanian','Thai','Tunisian','Turkish','Turkmen','Ugandan','Ukrainian',
  'Uruguayan','Uzbek','Venezuelan','Vietnamese','Yemeni','Zambian','Zimbabwean',
];

const RELIGIONS = [
  'Islam','Christianity','Catholicism','Protestantism','Orthodox Christianity',
  'Hinduism','Buddhism','Sikhism','Judaism','Taoism','Confucianism','Shinto',
  'Jainism','Zoroastrianism',"Bahá'í Faith",'Animism','Indigenous / Folk Religion',
  'Atheism','Agnosticism','Prefer not to say','Other',
];

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const MONTHS = [
  { value: '01', label: 'January' },{ value: '02', label: 'February' },
  { value: '03', label: 'March' },  { value: '04', label: 'April' },
  { value: '05', label: 'May' },    { value: '06', label: 'June' },
  { value: '07', label: 'July' },   { value: '08', label: 'August' },
  { value: '09', label: 'September' },{ value: '10', label: 'October' },
  { value: '11', label: 'November' },{ value: '12', label: 'December' },
];
const CUR_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => String(CUR_YEAR - i));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

const parseDob = (dob: string) => {
  if (!dob) return { day: '', month: '', year: '' };
  // API returns yyyy-mm-dd
  if (dob.includes('-')) {
    const [year, month, day] = dob.split('-');
    return {
      day: day?.padStart(2, '0') ?? '',
      month: month?.padStart(2, '0') ?? '',
      year: year ?? '',
    };
  }
  // fallback: dd/mm/yyyy
  const [day, month, year] = dob.split('/');
  return { day: day ?? '', month: month ?? '', year: year ?? '' };
};

const calcAge = (day: string, month: string, year: string): number | null => {
  if (!day || !month || !year) return null;
  const dob = new Date(Number(year), Number(month) - 1, Number(day));
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age >= 0 ? age : null;
};

const getToken = async (): Promise<string | null> => {
  const jwt = localStorage.getItem(TM_TOKEN_KEY);
  if (jwt) return jwt;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
};

// ─── Shared UI ────────────────────────────────────────────────────────────────

const inputCls = 'w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm text-gray-700';
const selectCls = 'w-full appearance-none px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm text-gray-700 cursor-pointer';
const errorInputCls = 'w-full px-4 py-3.5 bg-red-50 border border-red-300 rounded-2xl outline-none focus:ring-2 focus:ring-red-400 transition-all text-sm text-gray-700';

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block px-1 text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
    {children}
  </label>
);

const Toast: React.FC<{ type: 'success' | 'error'; message: string }> = ({ type, message }) => (
  <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${
    type === 'success'
      ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
      : 'border-red-100 bg-red-50 text-red-600'
  }`}>
    {type === 'success'
      ? <CheckCircle size={16} className="mt-0.5 shrink-0" />
      : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
    {message}
  </div>
);

const ImageUploadField: React.FC<{
  label: string;
  current?: string;
  value: File | null;
  onChange: (f: File | null) => void;
  onError: (msg: string) => void;
}> = ({ label, current, value, onChange, onError }) => (
  <div>
    <Label>{label}</Label>
    <label className="flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-4 transition-colors hover:border-emerald-400 hover:bg-emerald-50">
      {current && !value ? (
        <img src={current} alt="current" className="h-12 w-12 rounded-full object-cover shrink-0" />
      ) : value ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 shrink-0">
          <CheckCircle size={20} className="text-emerald-600" />
        </div>
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 shrink-0">
          <Upload size={18} className="text-gray-400" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-700 truncate">
          {value ? value.name : current ? 'Click to change' : 'Click to upload'}
        </p>
        <p className="text-xs text-gray-400">JPG or PNG</p>
      </div>
      <input
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
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

// ─── Tab type ──────────────────────────────────────────────────���──────────────

type Tab = 'profile' | 'password';

// ─── Main component ───────────────────────────────────────────────────────────

const AccountSettings: React.FC = () => {
  const { currentUser, setCurrentUser } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // ── Derive account type from context (fall back to individual) ───────────────
  // We'll re-fetch from /api/auth/me to get full profile data on mount
  const [accountType, setAccountType] = useState<'individual' | 'company'>('individual');
  const [profileLoaded, setProfileLoaded] = useState(false);

  // ── Individual fields ────────────────────────────────────────────────────────
  const [name, setName] = useState(currentUser?.name ?? '');
  const [title, setTitle] = useState('');
  const [gender, setGender] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [nationality, setNationality] = useState('');
  const [religion, setReligion] = useState('');
  const [address, setAddress] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState('');

  // ── Company fields ───────────────────────────────────────────────────────────
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyDoc, setCompanyDoc] = useState<File | null>(null);

  const [fallbackAge, setFallbackAge] = useState<number | null>(null);

  // ── Profile form state ───────────────────────────────────────────────────────
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileError, setProfileError] = useState('');

  // ── Password form state ──────────────────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentPwError, setCurrentPwError] = useState(false);
  const [isSocialAccount, setIsSocialAccount] = useState(false);

  // Computed age from DOB pickers
  const computedAge = useMemo(() => calcAge(dobDay, dobMonth, dobYear), [dobDay, dobMonth, dobYear]);

  // ── Load full profile on mount ───────────────────────────────────────────────
  React.useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        const u = json.user;
        if (!u) return;

        setAccountType(u.account_type === 'company' ? 'company' : 'individual');
        setName(u.name ?? currentUser?.name ?? '');
        setCurrentPhotoUrl(u.profile_photo_url ?? '');

        if (u.account_type === 'company') {
          setCompanyName(u.company_name ?? '');
          setCompanyAddress(u.company_address ?? '');
        } else {
          setTitle(u.title ?? '');
          setGender(u.gender ?? '');
          const { day, month, year } = parseDob(u.dob ?? '');
          setDobDay(day);
          setDobMonth(month);
          setDobYear(year);
          if (u.age != null) setFallbackAge(u.age);
          setNationality(u.nationality ?? '');
          setReligion(u.religion ?? '');
          setAddress(u.address ?? '');
        }
        setProfileLoaded(true);
      } catch {
        setProfileLoaded(true);
      }
    })();
  }, []);// eslint-disable-line react-hooks/exhaustive-deps

  // ── Profile submit ───────────────────────────────────────────────────────────
  const handleProfileSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileError('');
    setProfileSaving(true);

    try {
      const token = await getToken();
      if (!token) { setProfileError('Session expired.'); return; }

      const payload: Record<string, unknown> = {};

      // Only include fields that have a value (user might leave some blank)
      if (name.trim()) payload.name = name.trim();

      if (profilePhoto) payload.profilePhoto = await fileToBase64(profilePhoto);

      if (accountType === 'company') {
        if (companyName.trim()) payload.company_name = companyName.trim();
        if (companyAddress.trim()) payload.company_address = companyAddress.trim();
        if (companyDoc) payload.companyInfo = await fileToBase64(companyDoc);
      } else {
        if (title) payload.title = title;
        if (gender) payload.gender = gender;
        if (dobDay && dobMonth && dobYear) {
          payload.dateOfBirth = `${dobDay}/${dobMonth}/${dobYear}`;
          if (computedAge !== null) payload.age = computedAge;
        }
        if (nationality) payload.nationality = nationality;
        if (religion) payload.religion = religion;
        if (address.trim()) payload.address = address.trim();
      }

      if (Object.keys(payload).length === 0) {
        setProfileError('No changes to save.');
        return;
      }

      const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        setProfileMsg({ type: 'error', text: json.error || 'Failed to update profile.' });
        return;
      }

      // Sync name into global context
      if (json.user?.name && currentUser) {
        setCurrentUser({ ...currentUser, name: json.user.name });
      }
      if (json.user?.profile_photo_url) setCurrentPhotoUrl(json.user.profile_photo_url);
      setProfilePhoto(null);
      setCompanyDoc(null);
      setProfileMsg({ type: 'success', text: json.message || 'Profile updated successfully.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err instanceof Error ? err.message : 'Something went wrong.' });
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Password submit ──────────────────────────────────────────────────────────
  const handlePasswordSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPwMsg(null);
    setCurrentPwError(false);

    if (newPw !== confirmPw) {
      setPwMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setPwSaving(true);
    try {
      const token = await getToken();
      if (!token) { setPwMsg({ type: 'error', text: 'Session expired.' }); return; }

      const res = await fetch(`${BACKEND_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const json = await res.json();

      if (!res.ok) {
        const msg: string = json.error || 'Failed to change password.';
        if (msg.toLowerCase().includes('current password')) setCurrentPwError(true);
        if (msg.toLowerCase().includes('google') || msg.toLowerCase().includes('facebook')) {
          setIsSocialAccount(true);
        }
        setPwMsg({ type: 'error', text: msg });
        return;
      }

      setPwMsg({ type: 'success', text: json.message || 'Password changed successfully.' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      setPwMsg({ type: 'error', text: err instanceof Error ? err.message : 'Something went wrong.' });
    } finally {
      setPwSaving(false);
    }
  };

  const tabCls = (t: Tab) =>
    `px-5 py-2.5 text-sm font-semibold rounded-xl transition-all ${
      activeTab === t
        ? 'bg-emerald-600 text-white shadow'
        : 'text-gray-500 hover:bg-gray-100'
    }`;

  return (
    <div className="min-h-[80vh] bg-[linear-gradient(180deg,#f4fbf7_0%,#ffffff_100%)] px-4 py-10 md:py-16">
      <div className="mx-auto w-full max-w-2xl">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your profile and security settings.</p>
        </div>

        {/* Tab switcher */}
        <div className="mb-6 flex gap-2 rounded-2xl bg-gray-100 p-1.5 w-fit">
          <button type="button" className={tabCls('profile')} onClick={() => setActiveTab('profile')}>
            <span className="flex items-center gap-2"><UserIcon size={15} /> Edit Profile</span>
          </button>
          <button type="button" className={tabCls('password')} onClick={() => setActiveTab('password')}>
            <span className="flex items-center gap-2"><Lock size={15} /> Change Password</span>
          </button>
        </div>

        {/* ══ EDIT PROFILE TAB ════════════════════════════════════════════════ */}
        {activeTab === 'profile' && (
          <div className="rounded-[2.5rem] border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-50 sm:p-10">
            {!profileLoaded ? (
              <div className="py-16 text-center text-sm text-gray-400">Loading profile…</div>
            ) : (
              <form onSubmit={handleProfileSave} className="space-y-6">
                {profileMsg && <Toast type={profileMsg.type} message={profileMsg.text} />}
                {profileError && <Toast type="error" message={profileError} />}

                {/* Full Name — always shown */}
                <div>
                  <Label>Full Name</Label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    className={inputCls}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {accountType === 'company' ? (
                  /* ── Company fields ── */
                  <>
                    <div>
                      <Label>Company Name</Label>
                      <input type="text" placeholder="Acme Sdn Bhd" className={inputCls}
                        value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                    </div>
                    <div>
                      <Label>Company Address</Label>
                      <textarea rows={3} placeholder="Company address" className={inputCls}
                        value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <ImageUploadField label="Company Document" current="" value={companyDoc}
                        onChange={setCompanyDoc} onError={(m) => setProfileError(m)} />
                      <ImageUploadField label="Profile Photo" current={currentPhotoUrl}
                        value={profilePhoto} onChange={setProfilePhoto} onError={(m) => setProfileError(m)} />
                    </div>
                  </>
                ) : (
                  /* ── Individual fields ── */
                  <>
                    {/* Title + Gender */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Title</Label>
                        <select className={selectCls} value={title} onChange={(e) => setTitle(e.target.value)}>
                          <option value="">Select title</option>
                          {['Mr','Mrs','Ms','Dr'].map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label>Gender</Label>
                        <select className={selectCls} value={gender} onChange={(e) => setGender(e.target.value)}>
                          <option value="">Select gender</option>
                          {['Male','Female','Other'].map((g) => <option key={g}>{g}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* DOB + Age */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Date of Birth</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <select className={selectCls} value={dobDay} onChange={(e) => setDobDay(e.target.value)}>
                            <option value="">DD</option>
                            {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                          </select>
                          <select className={selectCls} value={dobMonth} onChange={(e) => setDobMonth(e.target.value)}>
                            <option value="">MM</option>
                            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                          </select>
                          <select className={selectCls} value={dobYear} onChange={(e) => setDobYear(e.target.value)}>
                            <option value="">YYYY</option>
                            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label>Age</Label>
                        <div className={`${inputCls} flex items-center`}>
                          {(() => {
                            const age = computedAge ?? fallbackAge;
                            return (
                              <span className={age !== null ? 'text-gray-900 font-semibold' : 'text-gray-400'}>
                                {age !== null ? `${age} years old` : 'Auto-calculated from DOB'}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Nationality + Religion */}
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

                    {/* Address */}
                    <div>
                      <Label>Address</Label>
                      <textarea rows={3} placeholder="Your address" className={inputCls}
                        value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div>

                    {/* Profile photo */}
                    <ImageUploadField label="Profile Photo" current={currentPhotoUrl}
                      value={profilePhoto} onChange={setProfilePhoto} onError={(m) => setProfileError(m)} />
                  </>
                )}

                <button
                  type="submit"
                  disabled={profileSaving}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-xl shadow-emerald-100 transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Save size={18} />
                  {profileSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ══ CHANGE PASSWORD TAB ══════════════════════════════════════════════ */}
        {activeTab === 'password' && (
          <div className="rounded-[2.5rem] border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-50 sm:p-10">

            {isSocialAccount ? (
              /* Social account — no password to change */
              <div className="space-y-5 py-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                  <AlertCircle className="text-amber-500" size={28} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">No password set</p>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed max-w-sm mx-auto">
                    Your account was created with Google or Facebook login and does not have a password.
                    Use <strong>Forgot Password</strong> on the login page to create one.
                  </p>
                </div>
                <a
                  href="#/login"
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Go to Login
                </a>
              </div>
            ) : (
              <form onSubmit={handlePasswordSave} className="space-y-5">
                {pwMsg && <Toast type={pwMsg.type} message={pwMsg.text} />}

                {/* Current password */}
                <div className="space-y-1.5">
                  <Label>Current Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={17} />
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      required
                      placeholder="Your current password"
                      className={`${currentPwError ? errorInputCls : inputCls} pl-11 pr-12`}
                      value={currentPw}
                      onChange={(e) => { setCurrentPw(e.target.value); setCurrentPwError(false); }}
                    />
                    <button type="button" onClick={() => setShowCurrent((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors">
                      {showCurrent ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {currentPwError && (
                    <p className="px-1 text-xs text-red-500 font-medium">Current password is incorrect.</p>
                  )}
                </div>

                {/* New password */}
                <div className="space-y-1.5">
                  <Label>New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={17} />
                    <input
                      type={showNew ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Min. 6 characters"
                      className={`${inputCls} pl-11 pr-12`}
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowNew((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors">
                      {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <Label>Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={17} />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      placeholder="Repeat new password"
                      className={`${confirmPw && confirmPw !== newPw ? errorInputCls : inputCls} pl-11 pr-12`}
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors">
                      {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {confirmPw && confirmPw !== newPw && (
                    <p className="px-1 text-xs text-red-500 font-medium">Passwords do not match.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={pwSaving || (!!confirmPw && confirmPw !== newPw)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-xl shadow-emerald-100 transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Lock size={18} />
                  {pwSaving ? 'Changing…' : 'Change Password'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSettings;
