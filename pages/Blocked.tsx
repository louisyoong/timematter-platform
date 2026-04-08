import React, { useState } from 'react';
import { ShieldX } from 'lucide-react';
import { supabase, TM_TOKEN_KEY } from '../services/supabase';
import { useApp } from '../store/AppContext';

const Blocked: React.FC = () => {
  const { setCurrentUser } = useApp();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    localStorage.removeItem(TM_TOKEN_KEY);
    await supabase.auth.signOut();
    setCurrentUser(null);
    window.location.hash = '/login';
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20 bg-red-50/40">
      <div className="w-full max-w-md rounded-[2.5rem] bg-white border border-red-100 shadow-2xl shadow-red-100 p-10 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <ShieldX className="text-red-600" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Account Blocked</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          Your account has been suspended. Please contact support if you believe this is a mistake.
        </p>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full rounded-2xl bg-red-600 py-4 font-bold text-white shadow-lg shadow-red-100 transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {signingOut ? 'Signing out…' : 'Sign Out'}
        </button>
      </div>
    </div>
  );
};

export default Blocked;
