
import React, { useState } from 'react';
import { Search, MapPin, User as UserIcon, LogOut, Menu, X, PlusCircle } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { UserRole } from '../types';

const Navbar: React.FC = () => {
  const { currentUser, setCurrentUser } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const NavLinks = () => (
    <>
      <a href="#/" className="hover:text-emerald-600 font-medium">Home</a>
      <a href="#/find-events" className="hover:text-emerald-600 font-medium">Find Events</a>
      {(currentUser?.role === UserRole.ORGANIZER || currentUser?.role === UserRole.SUPER_ADMIN) && (
        <a href="#/create-event" className="hover:text-emerald-600 font-medium flex items-center gap-1 text-emerald-700">
          <PlusCircle size={18} /> Create Event
        </a>
      )}
      <a href="#/articles" className="hover:text-emerald-600 font-medium">Articles</a>
      <a href="#/help" className="hover:text-emerald-600 font-medium">Help Center</a>
      {currentUser?.role === UserRole.SUPER_ADMIN && (
        <a href="#/admin" className="text-red-600 font-bold">Admin</a>
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
              <div className="h-4 w-[1px] bg-gray-300 mx-2"></div>
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
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <UserIcon size={16} />
                  </div>
                  <span className="text-sm font-medium hidden md:block">{currentUser.name}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <a href="#/login" className="px-4 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700">Login</a>
                <a href="#/signup" className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-shadow shadow-md">Sign Up</a>
              </div>
            )}
            {/* Mobile Menu Toggle */}
            <button className="lg:hidden p-2 text-gray-500" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
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
                <input type="text" placeholder="Search events..." className="bg-transparent text-sm w-full outline-none" />
             </div>
          </div>
          <NavLinks />
        </div>
      )}
    </nav>
  );
};

export default Navbar;
