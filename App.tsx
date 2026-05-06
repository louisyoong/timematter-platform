
import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import FindEvents from './pages/FindEvents';
import CreateEvent from './pages/CreateEvent';
import EventDetails from './pages/EventDetails';
import Articles from './pages/Articles';
import HelpCenter from './pages/HelpCenter';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import CompleteProfile from './pages/CompleteProfile';
import AdminDashboard from './pages/AdminDashboard';
import Blocked from './pages/Blocked';
import ResetPassword from './pages/ResetPassword';
import AccountSettings from './pages/AccountSettings';
import SwitchOrganization from './pages/SwitchOrganization';
import OrganizerEvents from './pages/OrganizerEvents';
import MyTickets from './pages/MyTickets';
import AdminEvents from './pages/AdminEvents';
import CheckInAttendee from './pages/CheckInAttendee';
import { supabase, BACKEND_URL, TM_TOKEN_KEY } from './services/supabase';
import { UserRole } from './types';

const AppContent: React.FC = () => {
  const { setCurrentUser } = useApp();
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/');
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Auth route guard — runs on mount and on every session change (including OAuth redirect)
  useEffect(() => {
    const checkAuth = async (accessToken: string, userId: string, userEmail: string) => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const json = await res.json();

        // Blocked account
        if (res.status === 403 && json.is_blocked) {
          setCurrentUser(null);
          if (window.location.hash.replace('#', '') !== '/blocked') {
            window.location.hash = '/blocked';
          }
          return;
        }

        if (!res.ok) return;

        // Profile incomplete → collect profile
        if (json.profile_complete === false) {
          if (window.location.hash.replace('#', '') !== '/complete-profile') {
            window.location.hash = '/complete-profile';
          }
          return;
        }

        // Profile complete → hydrate user in context and redirect away from auth-only pages
        const u = json.user;
        setCurrentUser({
          id: u?.id || userId,
          email: u?.email || userEmail,
          name: u?.name || u?.company_name || userEmail,
          role: (u?.role as UserRole) || UserRole.USER,
          isBlocked: Boolean(u?.is_blocked),
          joinedEvents: u?.joinedEvents || [],
        });

        const authOnlyRoutes = ['/signup', '/login', '/complete-profile', '/blocked'];
        const hash = window.location.hash.replace('#', '').split('?')[0];
        if (authOnlyRoutes.includes(hash)) {
          window.location.hash = '/';
        }
      } catch {
        // Backend unreachable — don't block navigation
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        checkAuth(session.access_token, session.user.id, session.user.email ?? '');
      } else {
        // Only clear user if there's also no JWT from email login
        if (!localStorage.getItem(TM_TOKEN_KEY)) {
          setCurrentUser(null);
        }
      }
    });

    // On mount: prefer JWT from email login, fall back to Supabase session
    const savedToken = localStorage.getItem(TM_TOKEN_KEY);
    if (savedToken) {
      checkAuth(savedToken, '', '');
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) checkAuth(session.access_token, session.user.id, session.user.email ?? '');
      });
    }

    return () => subscription.unsubscribe();
  }, [setCurrentUser]);

  const renderPage = () => {
    const hash = currentHash.replace('#', '');

    if (hash === '/' || hash === '') return <Home />;
    if (hash === '/find-events') return <FindEvents />;
    if (hash.startsWith('/create-event')) return <CreateEvent />;
    if (hash === '/articles') return <Articles />;
    if (hash === '/help') return <HelpCenter />;
    if (hash === '/login') return <Login />;
    if (hash === '/signup') return <SignUp />;
    if (hash === '/complete-profile') return <CompleteProfile />;
    if (hash === '/blocked') return <Blocked />;
    if (hash === '/admin') return <AdminDashboard />;
    if (hash.startsWith('/reset-password')) return <ResetPassword />;
    if (hash === '/account-settings') return <AccountSettings />;
    if (hash === '/switch-organization') return <SwitchOrganization />;
    if (hash === '/organizer-events') return <OrganizerEvents />;
    if (hash === '/tickets') return <MyTickets />;
    if (hash === '/admin-events') return <AdminEvents />;
    if (hash.startsWith('/checkin/')) return <CheckInAttendee />;
    if (hash.startsWith('/event/')) return <EventDetails />;

    const eventMatch = hash.match(/\/event\/(.+)/);
    if (eventMatch) return <EventDetails />;

    return <Home />;
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-emerald-200 selection:text-emerald-900">
      <Navbar />
      <main className="flex-1">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default App;
