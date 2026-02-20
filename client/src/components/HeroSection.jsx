import React from "react";
import { assets } from "../assets/assets";
import { ArrowRight, CalendarIcon, ClockIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";

const HeroSection = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  return (
    <div
      className="flex flex-col items-start justify-center gap-4 px-6 md:px-16 lg:px-36 
        bg-[url('/backgroundImage.png')] bg-cover bg-center h-screen relative"
    >
      {/* Dynamic gradient overlay for better text readability in both themes */}
      <div className={`absolute inset-0 ${
        isDark 
          ? 'bg-gradient-to-r from-black/80 via-black/50 to-transparent' 
          : 'bg-gradient-to-r from-gray-900/70 via-gray-800/40 to-transparent'
      }`}></div>
      <div className="relative z-10">
      <img
        src={assets.marvelLogo}
        alt="Marvel Logo"
        className="max-h-11 lg:h-11 mt-20"
      />

      <h1 className="text-5xl mt-2 md:text-[70px] md:leading-18 font-semibold max-w-110">
        Thunderbolts <br />
      </h1>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 max-w-full">
        <span className={`block ${isDark ? 'text-gray-300' : 'text-gray-200'}`}>
          Action | Adventure | Sci-Fi
        </span>

        <div className="flex items-center gap-1 max-md:w-full">
          <CalendarIcon className="w-4 h-4" />
          <span className={isDark ? 'text-gray-300' : 'text-gray-200'}>Feb 06, 2026</span>
        </div>

        <div className="flex items-center gap-1 max-md:w-full">
          <ClockIcon className="w-4 h-4" />
          <span className={isDark ? 'text-gray-300' : 'text-gray-200'}>02h 06m</span>
        </div>
      </div>

      <p className={`max-w-md mt-2 ${isDark ? 'text-gray-300' : 'text-gray-200'}`}>
        After finding themselves ensnared in a death trap, an unconventional team of antiheroes must go on a dangerous mission that will force them to confront the darkest corners of their pasts.
      </p>
      <button
        onClick={() => {
          navigate("/movies");
          scrollTo(0, 0);
        }}
        className="flex items-center gap-1 px-6 py-3 mt-3 text-sm 
        bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer text-white"
      >
        Explore Movies<ArrowRight className="w-5 h-5" />
      </button>
      </div>
    </div>
  );
};

export default HeroSection;
