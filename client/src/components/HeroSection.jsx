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
      {/* Strong gradient overlay ensuring text visibility in both modes */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/35"></div>
      <div className="relative z-10 max-w-2xl">
      <img
        src={assets.marvelLogo}
        alt="Marvel Logo"
        className="max-h-11 lg:h-11 mt-20"
      />

      <h1 className="text-5xl mt-4 md:text-7xl md:leading-tight font-bold max-w-110 text-white drop-shadow-lg">
        Thunderbolts <br />
      </h1>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 max-w-full mt-3">
        <span className="block text-gray-100 font-medium drop-shadow-md">
          Action | Adventure | Sci-Fi
        </span>

        <div className="flex items-center gap-1 max-md:w-full text-gray-100 drop-shadow-md">
          <CalendarIcon className="w-4 h-4" />
          <span>Feb 06, 2026</span>
        </div>

        <div className="flex items-center gap-1 max-md:w-full text-gray-100 drop-shadow-md">
          <ClockIcon className="w-4 h-4" />
          <span>02h 06m</span>
        </div>
      </div>

      <p className="max-w-md mt-4 text-gray-100 text-base leading-relaxed drop-shadow-md">
        After finding themselves ensnared in a death trap, an unconventional team of antiheroes must go on a dangerous mission that will force them to confront the darkest corners of their pasts.
      </p>
      <button
        onClick={() => {
          navigate("/movies");
          scrollTo(0, 0);
        }}
        className="flex items-center gap-2 px-8 py-3 mt-6 text-sm 
        bg-primary hover:bg-primary-dull transition duration-200 rounded-full font-semibold cursor-pointer text-white shadow-lg hover:shadow-xl hover:-translate-y-1"
      >
        Explore Movies<ArrowRight className="w-5 h-5" />
      </button>
      </div>
    </div>
  );
};

export default HeroSection;
