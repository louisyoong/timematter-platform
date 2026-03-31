import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { UserRole } from '../types';
import {
  ArrowRight,
  CalendarDays,
  FileBadge2,
  Lock,
  Mail,
  MapPin,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

type FormState = {
  ages: string;
  title: 'Mr' | 'Ms' | '';
  gender: string;
  dateOfBirth: string;
  nationality: string;
  religion: string;
  address: string;
  email: string;
  password: string;
  confirmPassword: string;
  isCompany: boolean;
};

type FileState = {
  identityCardFront: File | null;
  identityCardBack: File | null;
  profilePhoto: File | null;
};

const initialFormState: FormState = {
  ages: '',
  title: '',
  gender: '',
  dateOfBirth: '',
  nationality: '',
  religion: '',
  address: '',
  email: '',
  password: '',
  confirmPassword: '',
  isCompany: false,
};

const initialFileState: FileState = {
  identityCardFront: null,
  identityCardBack: null,
  profilePhoto: null,
};

const SignUp: React.FC = () => {
  const { setCurrentUser, setUsers } = useApp();
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [files, setFiles] = useState<FileState>(initialFileState);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof FormState, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateFile = (file: File, allowedTypes: string[]) => allowedTypes.includes(file.type);

  const handleFileChange = (
    field: keyof FileState,
    selectedFile: File | null,
    allowedTypes: string[],
    errorMessage: string
  ) => {
    setError('');
    if (!selectedFile) {
      setFiles((prev) => ({ ...prev, [field]: null }));
      return;
    }

    if (!validateFile(selectedFile, allowedTypes)) {
      setError(errorMessage);
      return;
    }

    setFiles((prev) => ({ ...prev, [field]: selectedFile }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Password and confirm password must match.');
      return;
    }

    if (!files.identityCardFront || !files.identityCardBack) {
      setError('Identity card front and back images are required.');
      return;
    }

    const payload = new FormData();
    payload.append('identityCardFront', files.identityCardFront);
    payload.append('identityCardBack', files.identityCardBack);
    if (files.profilePhoto) payload.append('profilePhoto', files.profilePhoto);

    payload.append('ages', formData.ages);
    payload.append('title', formData.title);
    payload.append('gender', formData.gender);
    payload.append('dateOfBirth', formData.dateOfBirth);
    payload.append('nationality', formData.nationality);
    payload.append('religion', formData.religion);
    payload.append('address', formData.address);
    payload.append('email', formData.email);
    payload.append('password', formData.password);
    payload.append('confirmPassword', formData.confirmPassword);
    payload.append('isCompany', 'false');
    payload.append('role', UserRole.USER);

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: payload,
      });

      const raw = await response.text();
      const data = raw ? (() => {
        try {
          return JSON.parse(raw);
        } catch {
          return { message: raw };
        }
      })() : null;

      if (!response.ok) {
        setError(data?.message || 'Sign up failed.');
        return;
      }

      const signedUpUser = {
        id: data?.user?.id || Math.random().toString(36).slice(2, 11),
        email: data?.user?.email || formData.email,
        name: data?.user?.name || formData.email,
        role: data?.user?.role || UserRole.USER,
        isBlocked: Boolean(data?.user?.isBlocked),
        joinedEvents: data?.user?.joinedEvents || [],
      };

      setUsers((prev) => [...prev, signedUpUser]);
      setCurrentUser(signedUpUser);
      setSuccess(data?.message || 'Account created successfully.');
      setFormData(initialFormState);
      setFiles(initialFileState);
      window.location.hash = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect to sign up API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName =
    'w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all';

  const iconInputClassName = `w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all`;

  return (
    <div className="min-h-[80vh] bg-[linear-gradient(180deg,#f4fbf7_0%,#ffffff_100%)] px-4 py-12 md:py-20">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.35fr]">
        <section className="rounded-[2.5rem] bg-emerald-700 p-8 text-white shadow-2xl shadow-emerald-200 md:p-10">
          <div className="mb-10">
            <span className="inline-flex items-center rounded-full bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-50">
              SilverLink Sign Up
            </span>
          </div>
          <h1 className="max-w-sm text-4xl font-bold leading-tight">Create your SilverLink account.</h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-emerald-50/85">
            Upload the required identity card images, complete your personal details, and submit the form to the sign up API.
          </p>

          <div className="mt-10 space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm font-semibold">Required files</p>
              <p className="mt-2 text-sm text-emerald-50/80">Identity card front and back are required in JPG or JPEG. Profile photo is optional in JPG or JPEG.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
              <p className="text-sm font-semibold">Submission payload</p>
              <p className="mt-2 text-sm text-emerald-50/80">The form sends `isCompany=false` and defaults `role` to `USER`.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2.5rem] border border-emerald-100 bg-white p-6 shadow-2xl shadow-emerald-100 md:p-10">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
            <p className="mt-2 text-sm text-gray-500">Complete the form below and we will send the data to the sign up API.</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-6">
            {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}
            {success && <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{success}</div>}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="px-2 text-xs font-bold uppercase tracking-widest text-gray-400">Identity Card Front (JPG, JPEG)</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,image/jpeg"
                  required
                  className={inputClassName}
                  onChange={(e) =>
                    handleFileChange(
                      'identityCardFront',
                      e.target.files?.[0] || null,
                      ['image/jpeg'],
                      'Identity card front must be a JPG or JPEG file.'
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="px-2 text-xs font-bold uppercase tracking-widest text-gray-400">Identity Card Back (JPG, JPEG)</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,image/jpeg"
                  required
                  className={inputClassName}
                  onChange={(e) =>
                    handleFileChange(
                      'identityCardBack',
                      e.target.files?.[0] || null,
                      ['image/jpeg'],
                      'Identity card back must be a JPG or JPEG file.'
                    )
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="px-2 text-xs font-bold uppercase tracking-widest text-gray-400">Ages</label>
                <div className="relative">
                  <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Enter age"
                    className={iconInputClassName}
                    value={formData.ages}
                    onChange={(e) => updateField('ages', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="px-2 text-xs font-bold uppercase tracking-widest text-gray-400">Profile Photo (JPG, JPEG)</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,image/jpeg"
                  className={inputClassName}
                  onChange={(e) =>
                    handleFileChange(
                      'profilePhoto',
                      e.target.files?.[0] || null,
                      ['image/jpeg'],
                      'Profile photo must be a JPG or JPEG file.'
                    )
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="px-2 text-xs font-bold uppercase tracking-widest text-gray-400">Mr / Ms</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <select
                    required
                    className={iconInputClassName}
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value as FormState['title'])}
                  >
                    <option value="">Select title</option>
                    <option value="Mr">Mr</option>
                    <option value="Ms">Ms</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="px-2 text-xs font-bold uppercase tracking-widest text-gray-400">Gender</label>
                <div className="relative">
                  <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <select
                    required
                    className={iconInputClassName}
                    value={formData.gender}
                    onChange={(e) => updateField('gender', e.target.value)}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="px-2 text-xs font-bold uppercase tracking-widest text-gray-400">Date of Birth (DD/MM/YYYY)</label>
                <div className="relative">
                  <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input
                    type="text"
                    required
                    placeholder="21/01/1980"
                    pattern="^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/[0-9]{2,4}$"
                    className={iconInputClassName}
                    value={formData.dateOfBirth}
                    onChange={(e) => updateField('dateOfBirth', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="px-2 text-xs font-bold uppercase tracking-widest text-gray-400">Nationality</label>
                <div className="relative">
                  <FileBadge2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input
                    type="text"
                    required
                    placeholder="Enter nationality"
                    className={iconInputClassName}
                    value={formData.nationality}
                    onChange={(e) => updateField('nationality', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="px-2 text-xs font-bold uppercase tracking-widest text-gray-400">Religion</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input
                    type="text"
                    required
                    placeholder="Enter religion"
                    className={iconInputClassName}
                    value={formData.religion}
                    onChange={(e) => updateField('religion', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="px-2 text-xs font-bold uppercase tracking-widest text-gray-400">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-5 text-gray-300" size={20} />
                  <textarea
                    required
                    rows={1}
                    placeholder="Enter address"
                    className="w-full rounded-2xl border border-gray-100 bg-gray-50 py-4 pl-12 pr-4 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="px-2 text-xs font-bold uppercase tracking-widest text-gray-400">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input
                    type="email"
                    required
                    placeholder="name@email.com"
                    className={iconInputClassName}
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="px-2 text-xs font-bold uppercase tracking-widest text-gray-400">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    className={iconInputClassName}
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="px-2 text-xs font-bold uppercase tracking-widest text-gray-400">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input
                  type="password"
                  required
                  placeholder="Confirm password"
                  className={iconInputClassName}
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-5 font-bold text-white shadow-xl shadow-emerald-100 transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Submitting...' : 'Create Account'}
              {!isSubmitting && <ArrowRight size={20} />}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default SignUp;
