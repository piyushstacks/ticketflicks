import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { assets } from "../assets/assets";
import { MenuIcon, XIcon, UserIcon, MoonIcon, SunIcon, Search, LogOut, Ticket, Heart, MessageSquare, Settings, LayoutDashboard } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useAuthContext } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import UniversalSearch from "./UniversalSearch";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuthContext();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { favoriteMovies } = useAppContext();
  const profileRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/movies", label: "Movies" },
    { to: "/theatres", label: "Theatres" },
    { to: "/upcoming-movies", label: "Upcoming" },
  ];

  const isActiveLink = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "backdrop-blur-xl shadow-lg"
            : "backdrop-blur-sm"
        }`}
        style={{
          backgroundColor: scrolled
            ? `color-mix(in srgb, var(--bg-primary) 85%, transparent)`
            : `color-mix(in srgb, var(--bg-primary) 60%, transparent)`,
          borderBottom: `1px solid ${scrolled ? "var(--border)" : "transparent"}`,
        }}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 md:px-12 lg:px-20 xl:px-36 py-3">
          {/* Logo */}
          <Link
            to="/"
            onClick={() => window.scrollTo(0, 0)}
            className="flex-shrink-0"
          >
            <img
              src={assets.logo}
              alt="TicketFlicks"
              className="w-32 h-auto transition-all duration-300"
              style={{ filter: "var(--logo-filter, none)" }}
            />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => window.scrollTo(0, 0)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActiveLink(link.to)
                    ? "text-accent bg-[var(--color-accent-soft)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {favoriteMovies.length > 0 && (
              <Link
                to="/favorite"
                onClick={() => window.scrollTo(0, 0)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActiveLink("/favorite")
                    ? "text-accent bg-[var(--color-accent-soft)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                }`}
              >
                Favorites
              </Link>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all duration-200"
              title="Search"
              aria-label="Search movies, shows, and theatres"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>

            {/* Theme Toggle - Always visible */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all duration-200"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle theme"
            >
              {isDark ? <SunIcon className="w-[18px] h-[18px]" /> : <MoonIcon className="w-[18px] h-[18px]" />}
            </button>

            {/* Auth / Profile */}
            {!user ? (
              <button
                onClick={() => navigate("/login")}
                className="btn-primary ml-1 px-5 py-2 text-sm"
              >
                Login
              </button>
            ) : (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 text-sm font-semibold ml-1"
                  style={{
                    backgroundColor: isProfileOpen ? "var(--color-accent)" : "var(--bg-elevated)",
                    color: isProfileOpen ? "#fff" : "var(--text-primary)",
                    border: `1px solid ${isProfileOpen ? "var(--color-accent)" : "var(--border)"}`,
                  }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </button>

                {isProfileOpen && (
                  <div
                    className="absolute right-0 mt-2 w-60 rounded-xl overflow-hidden animate-slideDown"
                    style={{
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      boxShadow: "0 16px 48px var(--shadow-color)",
                    }}
                  >
                    {/* User info */}
                    <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                      <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                        {user.name || "Account"}
                      </p>
                      <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {user.email}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <ProfileMenuItem icon={<Ticket className="w-4 h-4" />} label="My Bookings" onClick={() => navigate("/my-bookings")} />
                      <ProfileMenuItem icon={<UserIcon className="w-4 h-4" />} label="My Profile" onClick={() => navigate("/profile")} />
                      {favoriteMovies.length > 0 && (
                        <ProfileMenuItem icon={<Heart className="w-4 h-4" />} label="Favorites" onClick={() => navigate("/favorite")} />
                      )}
                      <ProfileMenuItem icon={<MessageSquare className="w-4 h-4" />} label="Feedback" onClick={() => navigate("/feedback")} />
                      <ProfileMenuItem icon={<Settings className="w-4 h-4" />} label="Edit Profile" onClick={() => navigate("/edit-profile")} />
                    </div>

                    {/* Admin / Manager */}
                    {(user.role === "admin" || user.role === "manager") && (
                      <div style={{ borderTop: "1px solid var(--border)" }} className="py-1">
                        <ProfileMenuItem
                          icon={<LayoutDashboard className="w-4 h-4" />}
                          label={user.role === "admin" ? "Admin Dashboard" : "Manager Dashboard"}
                          onClick={() => navigate(user.role === "admin" ? "/admin" : "/manager")}
                        />
                      </div>
                    )}

                    {/* Logout */}
                    <div style={{ borderTop: "1px solid var(--border)" }} className="py-1">
                      <button
                        type="button"
                        onClick={() => { logout(); setIsProfileOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-3 transition-all duration-200 text-red-500 hover:bg-red-500/10"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all duration-200 ml-1"
              aria-label="Toggle navigation menu"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ backgroundColor: "var(--overlay)" }}
            onClick={() => setIsOpen(false)}
          />
          {/* Panel */}
          <div
            className="absolute top-0 right-0 h-full w-72 animate-fadeIn"
            style={{
              backgroundColor: "var(--bg-card)",
              borderLeft: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Menu</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-all"
                aria-label="Close menu"
              >
                <XIcon className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>

            <div className="flex flex-col p-3 gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => { window.scrollTo(0, 0); setIsOpen(false); }}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActiveLink(link.to)
                      ? "text-accent bg-[var(--color-accent-soft)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {favoriteMovies.length > 0 && (
                <Link
                  to="/favorite"
                  onClick={() => { window.scrollTo(0, 0); setIsOpen(false); }}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActiveLink("/favorite")
                      ? "text-accent bg-[var(--color-accent-soft)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                  }`}
                >
                  Favorites
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {isSearchOpen && (
        <UniversalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      )}
    </>
  );
};

const ProfileMenuItem = ({ icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-all duration-200 hover:bg-[var(--bg-elevated)]"
    style={{ color: "var(--text-secondary)" }}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default Navbar;
