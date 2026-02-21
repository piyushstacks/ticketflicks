import React from "react";
import { assets } from "../assets/assets";
import { ArrowRight, CalendarIcon, ClockIcon, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex flex-col items-start justify-center min-h-screen bg-[url('/backgroundImage.png')] bg-cover bg-center overflow-hidden">
      {/* Gradient overlay - always dark for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      <div className="relative z-10 px-4 sm:px-6 md:px-12 lg:px-20 xl:px-36 max-w-3xl pt-24 sm:pt-0">
        <img
          src={assets.marvelLogo}
          alt="Marvel Logo"
          className="h-8 sm:h-9 lg:h-11 opacity-90"
        />

        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mt-4 text-white tracking-tight text-balance leading-tight">
          Thunderbolts
        </h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4">
          <span className="text-sm font-medium text-white/80">
            Action | Adventure | Sci-Fi
          </span>
          <div className="flex items-center gap-1.5 text-sm text-white/70">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Feb 06, 2026</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-white/70">
            <ClockIcon className="w-3.5 h-3.5" />
            <span>02h 06m</span>
          </div>
        </div>

        <p className="max-w-lg mt-4 sm:mt-5 text-white/70 text-sm leading-relaxed">
          After finding themselves ensnared in a death trap, an unconventional team of antiheroes must go on a dangerous mission that will force them to confront the darkest corners of their pasts.
        </p>

        <div className="flex items-center gap-3 mt-8">
          <button
            onClick={() => {
              navigate("/movies");
              scrollTo(0, 0);
            }}
            className="btn-primary px-7 py-3 text-sm"
          >
            Explore Movies
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              navigate("/upcoming-movies");
              scrollTo(0, 0);
            }}
            className="px-6 py-3 text-sm font-medium rounded-xl text-white/90 border border-white/20 hover:bg-white/10 transition-all duration-200 cursor-pointer"
          >
            Upcoming
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40 animate-bounce">
        <ChevronDown className="w-5 h-5" />
      </div>
    </div>
  );
};

export default HeroSection;
