import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { MenuIcon, XIcon, UserIcon, MoonIcon, SunIcon, Search } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useAuthContext } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import UniversalSearch from "./UniversalSearch";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, logout } = useAuthContext();
  const { toggleTheme, isDark } = useTheme();

  const navigate = useNavigate();
  const { favoriteMovies } = useAppContext();

  return (
    <div className={`fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 xl:px-36 py-5 ${
      isDark ? '' : 'bg-white border-b border-gray-300'
    }`}>
      <Link
        to="/"
        onClick={() => {
          window.scrollTo(0, 0);
        }}
        className="max-md:flex-1"
      > 
        <img 
          src={assets.logo} 
          alt="Logo" 
          className={`w-36 h-auto transition-all duration-300 ${
            isDark ? '' : 'filter brightness-0 contrast-100'
          }`} 
        />
      </Link>

      <div
        className={`max-md:absolute max-md:top-0 max-md:left-0 max-md:font-medium max-md:text-lg z-10 flex flex-col md:flex-row items-center 
        max-md:justify-center gap-8 min-md:px-8 py-3 max-md:h-screen min-md:rounded-full backdrop-blur ${
          isDark 
            ? 'bg-black/70 md:bg-white/10 md:border border-gray-300/20' 
            : 'bg-white md:bg-gray-50 md:border border-gray-300'
        } overflow-hidden transition-[width] duration-300 ${
         isOpen ? "max-md:w-full" : "max-md:w-0"
       }`}
      >
        <XIcon
          className={`md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer transition-colors ${
            isDark ? 'text-white' : 'text-gray-800'
          }`}
          onClick={() => {
            setIsOpen(!isOpen);
          }}
        />

        <Link
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/"
          className={isDark ? '' : 'text-gray-800 hover:text-primary'}
        >
          Home
        </Link>
        <Link
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/movies"
          className={isDark ? '' : 'text-gray-800 hover:text-primary'}
        >
          Movies
        </Link>
        <Link
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/theatres"
          className={isDark ? '' : 'text-gray-800 hover:text-primary'}
        >
          Theatres
        </Link>
        <Link
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/upcoming-movies"
          className={isDark ? '' : 'text-gray-800 hover:text-primary'}
        >
          Upcoming
        </Link>
        {favoriteMovies.length > 0 && (
          <Link
            onClick={() => {
              scrollTo(0, 0);
              setIsOpen(false);
            }}
            to="/favorite"
            className={isDark ? '' : 'text-gray-800 hover:text-primary'}
          >
            Favorites
          </Link>
        )}
      </div>

      <div className="flex items-center gap-8">
        {/* Search Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className={`p-2 rounded-full transition ${
            isDark 
              ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20' 
              : 'bg-gray-100 border border-gray-300 text-gray-800 hover:bg-gray-200'
          }`}
          title="Search movies, shows, and theatres"
        >
          <Search className="w-5 h-5" />
        </button>

        {!user ? (
          <button
            onClick={() => navigate("/login")}
            className={`px-4 py-1 sm:px-7 sm:py-2 transition rounded-full font-medium cursor-pointer ${
              isDark 
                ? 'bg-primary hover:bg-primary-dull text-white' 
                : 'bg-primary hover:bg-primary-dull text-white'
            }`}
          >
            Login
          </button>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                isDark 
                  ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20' 
                  : 'bg-gray-100 border border-gray-300 text-gray-800 hover:bg-gray-200'
              }`}
            >
              <span className="text-sm font-medium">
                {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5" />}
              </span>
            </button>

            {isProfileOpen && (
              <div className={`absolute right-0 mt-3 w-56 rounded-2xl shadow-xl backdrop-blur-xl py-2 text-sm ${
                isDark 
                  ? 'bg-black/90 border border-white/10 text-white' 
                  : 'bg-white border border-gray-300 text-gray-800 shadow-md'
              }`}>
                <div className={`px-4 py-2 border-b ${
                  isDark ? 'border-white/10' : 'border-gray-300'
                }`}>
                  <p className="font-medium truncate">
                    {user.name || "Account"}
                  </p>
                  <p className={`text-xs truncate ${
                    isDark ? 'text-white/60' : 'text-gray-600'
                  }`}>
                    {user.email}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigate("/my-bookings");
                    setIsProfileOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 transition ${
                    isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                  }`}
                >
                  My Bookings
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate("/profile");
                    setIsProfileOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 transition ${
                    isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                  }`}
                >
                  My Profile
                </button>

                {favoriteMovies.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/favorite");
                      setIsProfileOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 transition ${
                      isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                    }`}
                  >
                    Favorites
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    navigate("/feedback");
                    setIsProfileOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 transition ${
                    isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                  }`}
                >
                  Feedback
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate("/edit-profile");
                    setIsProfileOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 transition ${
                    isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                  }`}
                >
                  Edit Profile
                </button>

                <div className={`border-t mt-1 pt-1 ${
                  isDark ? 'border-white/10' : 'border-gray-300'
                }`}>
                  <button
                    type="button"
                    onClick={() => {
                      toggleTheme();
                    }}
                    className={`w-full text-left px-4 py-2 transition flex items-center gap-2 ${
                      isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                    }`}
                  >
                    {isDark ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
                    {isDark ? 'Light Mode' : 'Dark Mode'}
                  </button>
                </div>

                {user.role === "admin" && (
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/admin");
                      setIsProfileOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 transition ${
                      isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                    }`}
                  >
                    Admin Dashboard
                  </button>
                )}

                {user.role === "manager" && (
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/manager");
                      setIsProfileOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 transition ${
                      isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                    }`}
                  >
                    Manager Dashboard
                  </button>
                )}

                <div className={`border-t mt-1 pt-1 ${
                  isDark ? 'border-white/10' : 'border-gray-300'
                }`}>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setIsProfileOpen(false);
                      navigate("/");
                    }}
                    className={`w-full text-left px-4 py-2 transition ${
                      isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <MenuIcon
        className={`max-md:ml-4 md:hidden w-8 h-8 cursor-pointer transition-colors ${
          isDark ? 'text-white' : 'text-gray-800'
        }`}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
      />

      {/* Universal Search Modal */}
      <UniversalSearch 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </div>
  );
};

export default Navbar;
