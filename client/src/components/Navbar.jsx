import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { MenuIcon, XIcon, UserIcon } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useAuthContext } from "../context/AuthContext.jsx";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout } = useAuthContext();

  const navigate = useNavigate();
  const { favoriteMovies } = useAppContext();

  return (
    <div className="fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 xl:px-36 py-5">
      <Link
        to="/"
        onClick={() => {
          window.scrollTo(0, 0);
        }}
        className="max-md:flex-1"
      > 
        <img src={assets.logo} alt="Logo" className="w-36 h-auto" />
      </Link>

      <div
        className={`max-md:absolute max-md:top-0 max-md:left-0 max-md:font-medium max-md:text-lg z-10 flex flex-col md:flex-row items-center 
        max-md:justify-center gap-8 min-md:px-8 py-3 max-md:h-screen min-md:rounded-full backdrop-blur bg-black/70 md:bg-white/10 md:border
       border-gray-300/20 overflow-hidden transition-[width] duration-300 ${
         isOpen ? "max-md:w-full" : "max-md:w-0"
       }`}
      >
        <XIcon
          className="md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer"
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
        >
          Home
        </Link>
        <Link
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/movies"
        >
          Movies
        </Link>
        <Link
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/theatres"
        >
          Theatres
        </Link>
        <Link
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/upcoming-movies"
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
          >
            Favorites
          </Link>
        )}
      </div>

      <div className="flex items-center gap-8">
        {!user ? (
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-1 sm:px-7 sm:py-2 bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer"
          >
            Login
          </button>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition"
            >
              <span className="text-sm font-medium">
                {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5" />}
              </span>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-black/90 border border-white/10 shadow-xl backdrop-blur-xl py-2 text-sm text-white">
                <div className="px-4 py-2 border-b border-white/10">
                  <p className="font-medium truncate">
                    {user.name || "Account"}
                  </p>
                  <p className="text-xs text-white/60 truncate">
                    {user.email}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigate("/my-bookings");
                    setIsProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-white/10 transition"
                >
                  My Bookings
                </button>

                {favoriteMovies.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/favorite");
                      setIsProfileOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-white/10 transition"
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
                  className="w-full text-left px-4 py-2 hover:bg-white/10 transition"
                >
                  Feedback
                </button>

                {user.role === "admin" && (
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/admin");
                      setIsProfileOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-white/10 transition"
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
                    className="w-full text-left px-4 py-2 hover:bg-white/10 transition"
                  >
                    Manager Dashboard
                  </button>
                )}

                <div className="border-t border-white/10 mt-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setIsProfileOpen(false);
                      navigate("/");
                    }}
                    className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 transition"
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
        className="max-md:ml-4 md:hidden w-8 h-8 cursor-pointer "
        onClick={() => {
          setIsOpen(!isOpen);
        }}
      />
    </div>
  );
};

export default Navbar;
