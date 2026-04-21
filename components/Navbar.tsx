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
      <a href="#/" className="hover:text-emerald-600 font-medium">
        Home
      </a>
      <a href="#/find-events" className="hover:text-emerald-600 font-medium">
        Find Events
      </a>

      <a href="#/articles" className="hover:text-emerald-600 font-medium">
        Articles
      </a>

      {isOrganizer && !viewAsAttendee && (
        <a
          href="#/create-event"
          className="hover:text-emerald-500 font-medium flex items-center gap-1 text-emerald-700 bg-emerald-100 p-2 rounded-lg"
        >
          <PlusCircle size={18} /> Create Event
        </a>
      )}
      {currentUser?.role === UserRole.ADMIN && (
        <a href="#/admin" className="font-bold text-red-600">
          All Users
        </a>
      )}
    </>
  );

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent hidden sm:block">
              TimeMatter
            </span>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full flex items-center bg-gray-100 rounded-full px-4 py-2 border border-transparent focus-within:border-emerald-500 focus-within:bg-white transition-all">
              <Search className="text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search events..."
                className="bg-transparent border-none focus:ring-0 w-full ml-2 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="h-4 w-[1px] bg-gray-300 mx-2" />
              <MapPin className="text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Location"
                className="bg-transparent border-none focus:ring-0 w-32 ml-2 text-sm"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-6 text-gray-600">
            <NavLinks />
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                {/* User menu trigger */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors hover:bg-gray-100"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                      <UserIcon size={16} />
                    </div>
                    <span className="text-sm font-medium hidden md:block max-w-[120px] truncate">
                      {currentUser.name}
                    </span>
                    <ChevronDown
                      size={15}
                      className={`hidden md:block text-gray-400 transition-transform duration-200 ${
                        isUserMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden z-50">
                      {/* User info header */}
                      <div className="px-4 py-3 border-b border-gray-50">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                          Signed in as
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-gray-800 truncate">
                          {currentUser.name}
                        </p>
                      </div>

                      {/* Menu items */}
                      <div className="py-1.5">
                        {isOrganizer && !viewAsAttendee ? (
                          <button
                            onClick={handleSwitchToAttendee}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                          >
                            <UserIcon
                              size={16}
                              className="shrink-0 text-gray-400"
                            />
                            Switch to Attendance
                          </button>
                        ) : (
                          <button
                            onClick={handleSwitchToOrg}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                          >
                            <Building2
                              size={16}
                              className="shrink-0 text-gray-400"
                            />
                            Switch to Organization
                          </button>
                        )}
                        {isOrganizer && !viewAsAttendee && (
                          <a
                            href="#/organizer-events"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                          >
                            <PlusCircle
                              size={16}
                              className="shrink-0 text-gray-400"
                            />
                            All Events
                          </a>
                        )}
                        <a
                          href="#/tickets"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                        >
                          <Ticket
                            size={16}
                            className="shrink-0 text-gray-400"
                          />
                          My Tickets
                        </a>
                        <a
                          href="#/account-settings"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                        >
                          <Settings
                            size={16}
                            className="shrink-0 text-gray-400"
                          />
                          Account Settings
                        </a>
                      </div>

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
                  className="px-4 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Login
                </a>
                <a
                  href="#/signup"
                  className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-shadow shadow-md"
                >
                  Sign Up
                </a>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 text-gray-500"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t p-4 flex flex-col gap-4 text-gray-600 shadow-xl absolute w-full z-50 animate-in slide-in-from-top">
          <div className="flex flex-col gap-2 p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 px-2 py-1">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search events..."
                className="bg-transparent text-sm w-full outline-none"
              />
            </div>
          </div>
          <NavLinks />
          {currentUser && (
            <div className="border-t border-gray-100 pt-3 flex flex-col gap-1">
              {isOrganizer && !viewAsAttendee ? (
                <button
                  onClick={handleSwitchToAttendee}
                  className="flex items-center gap-3 px-2 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-emerald-50"
                >
                  <UserIcon size={16} className="text-gray-400" /> Switch to
                  Attendance
                </button>
              ) : (
                <button
                  onClick={handleSwitchToOrg}
                  className="flex items-center gap-3 px-2 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-emerald-50"
                >
                  <Building2 size={16} className="text-gray-400" /> Switch to
                  Organization
                </button>
              )}
              {isOrganizer && !viewAsAttendee && (
                <a
                  href="#/organizer-events"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-2 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-emerald-50"
                >
                  <PlusCircle size={16} className="text-gray-400" /> All Events
                </a>
              )}
              <a
                href="#/tickets"
                className="flex items-center gap-3 px-2 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-emerald-50"
              >
                <Ticket size={16} className="text-gray-400" /> My Tickets
              </a>
              <a
                href="#/account-settings"
                className="flex items-center gap-3 px-2 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-emerald-50"
              >
                <Settings size={16} className="text-gray-400" /> Account
                Settings
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-2 py-2.5 text-sm text-red-500 rounded-xl hover:bg-red-50"
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
