import React from "react";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
} from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0f0b09] text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img
                src="/images/logo.png"
                alt="TimeMatter"
                className="w-8 h-8 rounded object-contain"
              />
              <span className="text-2xl font-bold text-white">TimeMatter</span>
            </div>
            <p className="text-sm leading-relaxed mb-6">
              Empowering the aging society through community engagement,
              wellness programs, and social connectivity.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-amber-700 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="hover:text-amber-700 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="hover:text-amber-700 transition-colors">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#/find-events"
                  className="hover:text-amber-700 transition-colors"
                >
                  Find Events
                </a>
              </li>
              <li>
                <a
                  href="#/articles"
                  className="hover:text-amber-700 transition-colors"
                >
                  Health Articles
                </a>
              </li>
              <li>
                <a
                  href="#/help"
                  className="hover:text-amber-700 transition-colors"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="#/login"
                  className="hover:text-amber-700 transition-colors"
                >
                  Become an Organizer
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-gray-500" />{" "}
                support@timematter.club
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-gray-500" /> +1 (800) 123-4567
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-500" /> 123 Community
                Blvd, Health City
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white font-semibold mb-4">Stay Updated</h3>
            <p className="text-xs mb-4">
              Subscribe to our newsletter for the latest events and health tips.
            </p>
            <form className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="bg-gray-800 border-none rounded-l px-4 py-2 text-sm w-full focus:ring-1 focus:ring-emerald-500 outline-none"
              />
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-r text-sm transition-colors">
                Join
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>© 2026 TimeMatter Platform. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
