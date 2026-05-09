import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  MapPin,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  PlusCircle,
  Building2,
  Ticket,
  Settings,
  ChevronDown,
  Users,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useApp } from "../store/AppContext";
import { UserRole } from "../types";

import { supabase, TM_TOKEN_KEY } from "../services/supabase";

const Navbar: React.FC = () => {
  const { currentUser, setCurrentUser, viewAsAttendee, setViewAsAttendee } =
    useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    localStorage.removeItem(TM_TOKEN_KEY);
    await supabase.auth.signOut();
    setCurrentUser(null);
    window.location.hash = "/login";
  };

  const isOrganizer =
    currentUser?.role === UserRole.ORGANIZER ||
    currentUser?.role === UserRole.ADMIN ||
    currentUser?.role === UserRole.SUPER_ADMIN;

  const handleSwitchToOrg = () => {
    setViewAsAttendee(false);
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    window.location.hash = "/create-event";
  };

  const handleSwitchToAttendee = () => {
    setViewAsAttendee(true);
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const NavLinks = () => (
    <>
      <a href="#/" className="font-medium text-[#2d1912] hover:text-[#2d1912]/60 transition-colors">
        Home
      </a>
      <a href="#/find-events" className="font-medium text-[#2d1912] hover:text-[#2d1912]/60 transition-colors">
        Find Events
      </a>
      <a href="#/articles" className="font-medium text-[#2d1912] hover:text-[#2d1912]/60 transition-colors">
        Articles
      </a>
      {isOrganizer && !viewAsAttendee && (
        <a
          href="#/create-event"
          className="font-semibold flex items-center gap-1.5 text-[#ebdba8] bg-[#2d1912] px-3 py-2 rounded-lg hover:bg-[#4a2b1a] transition-colors"
        >
          <PlusCircle size={16} /> Create Event
        </a>
      )}
    </>
  );

  return (
    <nav className="sticky top-0 z-50 shadow-sm" style={{ backgroundColor: '#ebdba8' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-24 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <a href="#/">
              <img src="/images/logo.png" alt="TimeMatter" className="h-20 w-auto object-contain" />
            </a>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full flex items-center bg-[#d9c990] rounded-full px-4 py-2 border border-transparent focus-within:border-[#2d1912] focus-within:bg-[#f5edcc] transition-all">
              <Search className="text-[#2d1912]/50" size={18} />
              <input
                type="text"
                placeholder="Search events..."
                className="bg-transparent border-none focus:ring-0 w-full ml-2 text-sm text-[#2d1912] placeholder:text-[#2d1912]/40"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="h-4 w-[1px] bg-[#2d1912]/20 mx-2" />
              <MapPin className="text-[#2d1912]/50" size={18} />
              <input
                type="text"
                placeholder="Location"
                className="bg-transparent border-none focus:ring-0 w-32 ml-2 text-sm text-[#2d1912] placeholder:text-[#2d1912]/40"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-6 text-[#2d1912]">
            <NavLinks />
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors hover:bg-[#d9c990]"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#2d1912] flex items-center justify-center text-[#ebdba8] shrink-0">
                      <UserIcon size={16} />
                    </div>
                    <span className="text-sm font-medium hidden md:block max-w-[120px] truncate text-[#2d1912]">
                      {currentUser.name}
                    </span>
                    <ChevronDown
                      size={15}
                      className={`hidden md:block text-[#2d1912]/60 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Dropdown */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-[#d9c990] bg-white shadow-xl overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-gray-50">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Signed in as</p>
                        <p className="mt-0.5 text-sm font-semibold text-gray-800 truncate">{currentUser.name}</p>
                      </div>

                      <div className="py-1.5">
                        {isOrganizer && !viewAsAttendee ? (
                          <button
                            onClick={handleSwitchToAttendee}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#ebdba8] hover:text-[#2d1912] transition-colors"
                          >
                            <UserIcon size={16} className="shrink-0 text-gray-400" />
                            Switch to Attendance
                          </button>
                        ) : (
                          <button
                            onClick={handleSwitchToOrg}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#ebdba8] hover:text-[#2d1912] transition-colors"
                          >
                            <Building2 size={16} className="shrink-0 text-gray-400" />
                            Switch to Organization
                          </button>
                        )}
                        {isOrganizer && !viewAsAttendee && (
                          <a
                            href="#/organizer-events"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#ebdba8] hover:text-[#2d1912] transition-colors"
                          >
                            <PlusCircle size={16} className="shrink-0 text-gray-400" />
                            All My Events
                          </a>
                        )}
                        <a
                          href="#/tickets"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#ebdba8] hover:text-[#2d1912] transition-colors"
                        >
                          <Ticket size={16} className="shrink-0 text-gray-400" />
                          My Tickets
                        </a>
                        <a
                          href="#/account-settings"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#ebdba8] hover:text-[#2d1912] transition-colors"
                        >
                          <Settings size={16} className="shrink-0 text-gray-400" />
                          Account Settings
                        </a>
                      </div>

                      {/* Management (Admin only) */}
                      {currentUser?.role === UserRole.ADMIN && (
                        <div className="border-t border-gray-50 py-1.5">
                          <p className="px-4 pt-1 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            Management
                          </p>
                          <a
                            href="#/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <Users size={16} className="shrink-0 text-gray-400" />
                            All Users
                          </a>
                          <a
                            href="#/admin-events"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <CalendarIcon size={16} className="shrink-0 text-gray-400" />
                            All Events
                          </a>
                        </div>
                      )}

                      {/* Sign out */}
                      <div className="border-t border-gray-50 py-1.5">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={16} className="shrink-0" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <a
                  href="#/login"
                  className="px-4 py-2 text-sm font-semibold text-[#2d1912] hover:text-[#2d1912]/70 transition-colors"
                >
                  Login
                </a>
                <a
                  href="#/signup"
                  className="px-4 py-2 text-sm font-semibold bg-[#2d1912] text-[#ebdba8] rounded-full hover:bg-[#4a2b1a] transition-colors shadow-md"
                >
                  Sign Up
                </a>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 text-[#2d1912]"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-[#d9c990] p-4 flex flex-col gap-4 text-[#2d1912] shadow-xl absolute w-full z-50" style={{ backgroundColor: '#ebdba8' }}>
          <div className="flex flex-col gap-2 p-2 bg-[#d9c990] rounded-lg">
            <div className="flex items-center gap-2 px-2 py-1">
              <Search size={16} className="text-[#2d1912]/50" />
              <input
                type="text"
                placeholder="Search events..."
                className="bg-transparent text-sm w-full outline-none text-[#2d1912] placeholder:text-[#2d1912]/40"
              />
            </div>
          </div>
          <NavLinks />
          {currentUser && (
            <div className="border-t border-[#d9c990] pt-3 flex flex-col gap-1">
              {isOrganizer && !viewAsAttendee ? (
                <button
                  onClick={handleSwitchToAttendee}
                  className="flex items-center gap-3 px-2 py-2.5 text-sm text-[#2d1912] rounded-xl hover:bg-[#d9c990] transition-colors"
                >
                  <UserIcon size={16} className="text-[#2d1912]/50" /> Switch to Attendance
                </button>
              ) : (
                <button
                  onClick={handleSwitchToOrg}
                  className="flex items-center gap-3 px-2 py-2.5 text-sm text-[#2d1912] rounded-xl hover:bg-[#d9c990] transition-colors"
                >
                  <Building2 size={16} className="text-[#2d1912]/50" /> Switch to Organization
                </button>
              )}
              {isOrganizer && !viewAsAttendee && (
                <a
                  href="#/organizer-events"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-2 py-2.5 text-sm text-[#2d1912] rounded-xl hover:bg-[#d9c990] transition-colors"
                >
                  <PlusCircle size={16} className="text-[#2d1912]/50" /> All Events
                </a>
              )}
              <a
                href="#/tickets"
                className="flex items-center gap-3 px-2 py-2.5 text-sm text-[#2d1912] rounded-xl hover:bg-[#d9c990] transition-colors"
              >
                <Ticket size={16} className="text-[#2d1912]/50" /> My Tickets
              </a>
              <a
                href="#/account-settings"
                className="flex items-center gap-3 px-2 py-2.5 text-sm text-[#2d1912] rounded-xl hover:bg-[#d9c990] transition-colors"
              >
                <Settings size={16} className="text-[#2d1912]/50" /> Account Settings
              </a>
              {currentUser?.role === UserRole.ADMIN && (
                <>
                  <p className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-[#2d1912]/50">
                    Management
                  </p>
                  <a
                    href="#/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-2 py-2.5 text-sm text-[#2d1912] rounded-xl hover:bg-red-100 hover:text-red-700 transition-colors"
                  >
                    <Users size={16} className="text-[#2d1912]/50" /> All Users
                  </a>
                  <a
                    href="#/admin-events"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-2 py-2.5 text-sm text-[#2d1912] rounded-xl hover:bg-red-100 hover:text-red-700 transition-colors"
                  >
                    <CalendarIcon size={16} className="text-[#2d1912]/50" /> All Events
                  </a>
                </>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-2 py-2.5 text-sm text-red-600 rounded-xl hover:bg-red-100 transition-colors"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
