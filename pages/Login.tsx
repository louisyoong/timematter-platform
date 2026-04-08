import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { UserRole } from '../types';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase, BACKEND_URL, TM_TOKEN_KEY } from '../services/supabase';

type Provider = 'google' | 'facebook';
type View = 'login' | 'forgot';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" />
  </svg>
);

const SOCIAL_LOGIN_MSG = 'This account uses Google or Facebook login. Please sign in with your social account.';

const Login: React.FC = () => {
  const { setCurrentUser } = useApp();
  const [view, setView] = useState<View>('login');

  // Social OAuth
  const [oauthLoading, setOauthLoading] = useState<Provider | null>(null);
  const [oauthError, setOauthError] = useState('');
  const [highlightSocial, setHighlightSocial] = useState(false);

  // Email login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  // ── OAuth handler (same flow as Sign Up) ─────────────────────────────────────
  const handleOAuth = async (provider: Provider) => {
    setOauthError('');
    setOauthLoading(provider);
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) {
      setOauthError(error.message);
      setOauthLoading(null);
    }
    // On success browser redirects — App.tsx onAuthStateChange handles the rest
  };

  // ── Email login handler ───────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError('');
    setHighlightSocial(false);
    setIsSubmitting(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (res.status === 403 && json.is_blocked) {
        setCurrentUser(null);
        window.location.hash = '/blocked';
        return;
      }

      if (!res.ok) {
        const msg: string = json.error || json.message || 'Invalid email or password.';
        setLoginError(msg);
        // Highlight social buttons if user should sign in socially instead
        if (msg.toLowerCase().includes('google') || msg.toLowerCase().includes('facebook')) {
          setHighlightSocial(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }

      if (json.token) {
        localStorage.setItem(TM_TOKEN_KEY, json.token);
      }

      const u = json.user;
      setCurrentUser({
        id: u?.id || '',
        email: u?.email || email,
        name: u?.name || u?.company_name || email,
        role: (u?.role as UserRole) || UserRole.USER,
        isBlocked: false,
        joinedEvents: [],
      });

      window.location.hash = '/';
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Unable to connect to the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Forgot password handler ───────────────────────────────────────────────────
  const handleForgot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setForgotMessage('');
    setForgotSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const json = await res.json();
      setForgotMessage(json.message || 'If that email exists, a reset link has been sent.');
    } catch {
      setForgotMessage('If that email exists, a reset link has been sent.');
    } finally {
      setForgotSubmitting(false);
    }
  };

  const inputCls =
    'w-full py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm';

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-[linear-gradient(180deg,#f4fbf7_0%,#ffffff_100%)]">
      <div className="w-full max-w-md">
        <div className="rounded-[2.5rem] bg-white border border-emerald-100 shadow-2xl shadow-emerald-100 p-8 md:p-10">

          {/* ── Header ── */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 mb-5">
              TimeMatter
            </span>
            {view === 'login' ? (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-1.5">Welcome Back</h1>
                <p className="text-gray-500 text-sm">Sign in to your TimeMatter account</p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-1.5">Forgot Password</h1>
                <p className="text-gray-500 text-sm">Enter your email and we'll send you a reset link.</p>
              </>
            )}
          </div>

          {/* ══ LOGIN VIEW ══════════════════════════════════════════════════════ */}
          {view === 'login' && (
            <>
              {/* Social hint banner */}
              {highlightSocial && (
                <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 text-center">
                  {SOCIAL_LOGIN_MSG}
                </div>
              )}

              {/* ── Section 1: OAuth buttons ── */}
              <div className="space-y-3">
                {oauthError && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 text-center">
                    {oauthError}
                  </div>
                )}

                {([
                  { id: 'google' as Provider, label: 'Continue with Google', Icon: GoogleIcon },
                  { id: 'facebook' as Provider, label: 'Continue with Facebook', Icon: FacebookIcon },
                ]).map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    disabled={oauthLoading !== null}
                    onClick={() => handleOAuth(id)}
                    className={`flex w-full items-center justify-center gap-3 rounded-2xl border py-4 px-6 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-60 ${
                      highlightSocial
                        ? 'border-emerald-400 ring-2 ring-emerald-300 bg-emerald-50/50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {oauthLoading === id ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-600" />
                    ) : (
                      <Icon />
                    )}
                    {oauthLoading === id ? 'Redirecting…' : label}
                  </button>
                ))}
              </div>

              {/* ── Divider ── */}
              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">or</span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>

              {/* ── Section 2: Email + Password ── */}
              <form onSubmit={handleLogin} className="space-y-5">
                {loginError && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 text-center">
                    {loginError}
                  </div>
                )}

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block px-1 text-xs font-bold uppercase tracking-widest text-gray-400">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input
                      type="email"
                      required
                      placeholder="name@email.com"
                      className={`${inputCls} pl-11 pr-4`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => { setView('forgot'); setLoginError(''); setForgotEmail(email); }}
                      className="text-xs font-semibold text-emerald-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      className={`${inputCls} pl-11 pr-12`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-xl shadow-emerald-100 transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? 'Signing in…' : 'Sign In'}
                  {!isSubmitting && <ArrowRight size={20} />}
                </button>
              </form>
            </>
          )}

          {/* ══ FORGOT PASSWORD VIEW ════════════════════════════════════════════ */}
          {view === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-5">
              {forgotMessage ? (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-700 text-center leading-relaxed">
                  {forgotMessage}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block px-1 text-xs font-bold uppercase tracking-widest text-gray-400">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input
                      type="email"
                      required
                      placeholder="name@email.com"
                      className={`${inputCls} pl-11 pr-4`}
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {!forgotMessage && (
                <button
                  type="submit"
                  disabled={forgotSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-xl shadow-emerald-100 transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {forgotSubmitting ? 'Sending…' : 'Send Reset Link'}
                  {!forgotSubmitting && <ArrowRight size={20} />}
                </button>
              )}

              <button
                type="button"
                onClick={() => { setView('login'); setForgotMessage(''); }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 py-3.5 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50"
              >
                <ArrowLeft size={16} />
                Back to Sign In
              </button>
            </form>
          )}

          {/* ── Bottom link (both views) ── */}
          <p className="mt-8 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <a href="#/signup" className="font-bold text-emerald-600 hover:underline">
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
