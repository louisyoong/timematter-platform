import React, { useState } from 'react';
import { supabase } from '../services/supabase';

type Provider = 'google' | 'facebook';

const providerConfig: { id: Provider; label: string; icon: React.ReactNode }[] = [
  {
    id: 'google',
    label: 'Continue with Google',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
    ),
  },
  {
    id: 'facebook',
    label: 'Continue with Facebook',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
          fill="#1877F2"
        />
      </svg>
    ),
  },
];

const SignUp: React.FC = () => {
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);
  const [error, setError] = useState('');

  const handleOAuth = async (provider: Provider) => {
    setError('');
    setLoadingProvider(provider);

    const redirectTo = `${window.location.origin}${window.location.pathname}`;

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoadingProvider(null);
    }
    // On success the browser is redirected — no cleanup needed
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20 bg-[linear-gradient(180deg,#f4fbf7_0%,#ffffff_100%)]">
      <div className="w-full max-w-md">
        <div className="rounded-[2.5rem] bg-white border border-emerald-100 shadow-2xl shadow-emerald-100 p-8 md:p-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 mb-6">
              TimeMatter
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome</h1>
            <p className="text-gray-500 text-sm">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 text-center">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {providerConfig.map(({ id, label, icon }) => (
              <button
                key={id}
                type="button"
                disabled={loadingProvider !== null}
                onClick={() => handleOAuth(id)}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white py-4 px-6 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-300 hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingProvider === id ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-600" />
                ) : (
                  icon
                )}
                {loadingProvider === id ? 'Redirecting…' : label}
              </button>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-gray-400 leading-relaxed">
            By continuing, you agree to TimeMatter's Terms of Service and Privacy Policy.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <a href="#/login" className="font-bold text-emerald-600 hover:underline">
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
