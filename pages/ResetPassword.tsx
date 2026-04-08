import React, { useState, useMemo } from 'react';
import { Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { BACKEND_URL } from '../services/supabase';

// Parse ?token= from the hash: e.g. #/reset-password?token=xxx
const getTokenFromHash = (): string => {
  const hash = window.location.hash.slice(1); // remove leading #
  const queryIndex = hash.indexOf('?');
  if (queryIndex === -1) return '';
  const params = new URLSearchParams(hash.slice(queryIndex + 1));
  return params.get('token') || '';
};

const ResetPassword: React.FC = () => {
  const token = useMemo(() => getTokenFromHash(), []);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!token) {
      setError('Reset token is missing or invalid. Please request a new reset link.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Failed to reset password. The link may have expired.');
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect to the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls =
    'w-full py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm';

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20 bg-[linear-gradient(180deg,#f4fbf7_0%,#ffffff_100%)]">
      <div className="w-full max-w-md">
        <div className="rounded-[2.5rem] bg-white border border-emerald-100 shadow-2xl shadow-emerald-100 p-8 md:p-10">

          {/* Header */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 mb-5">
              TimeMatter
            </span>
            <h1 className="text-3xl font-bold text-gray-900 mb-1.5">Reset Password</h1>
            <p className="text-gray-500 text-sm">Enter your new password below.</p>
          </div>

          {/* Success state */}
          {success ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-6 text-center">
                <CheckCircle className="text-emerald-600" size={36} />
                <p className="text-sm font-semibold text-emerald-700">
                  Password updated successfully!
                </p>
              </div>
              <a
                href="#/login"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-xl shadow-emerald-100 transition-all hover:bg-emerald-700"
              >
                Go to Sign In
                <ArrowRight size={20} />
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 text-center">
                  {error}
                </div>
              )}

              {!token && !error && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 text-center">
                  No reset token found. Please use the link from your email.
                </div>
              )}

              {/* New password */}
              <div className="space-y-1.5">
                <label className="block px-1 text-xs font-bold uppercase tracking-widest text-gray-400">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="Min. 8 characters"
                    className={`${inputCls} pl-11 pr-12`}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                  >
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label className="block px-1 text-xs font-bold uppercase tracking-widest text-gray-400">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    placeholder="Repeat your password"
                    className={`${inputCls} pl-11 pr-12`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !token}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-xl shadow-emerald-100 transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Resetting…' : 'Reset Password'}
                {!isSubmitting && <ArrowRight size={20} />}
              </button>

              <a
                href="#/login"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 py-3.5 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50"
              >
                <ArrowLeft size={16} />
                Back to Sign In
              </a>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
