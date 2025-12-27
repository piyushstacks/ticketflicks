import { ArrowRight } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import BlurCircle from "./BlurCircle";
import MovieCard from "./MovieCard";
import { useAppContext } from "../context/AppContext";
import useWindowWidth from "../hooks/useWindowWidth";
import SkeletonCard from "./SkeletonCard";
import Loading from "./Loading";
import { dummyShowsData } from "../assets/assets";

const FeaturedSection = () => {
  const navigate = useNavigate();
  const width = useWindowWidth();

  let sliceCount = 4;
  if (width >= 1024 && width < 1536) {
    // lg (≥1024) and xl (<1536)
    sliceCount = 3;
  }

  const { shows, loading } = useAppContext();

  if (loading) {
    return (
      <div className="flex flex-wrap gap-9 mt-8 px-6 md:px-16 lg:px-24 xl:px-44 pt-40">
        {Array.from({ length: sliceCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }
  // Use real shows if available, otherwise fall back to dummy data
  const displayShows = (shows && shows.length > 0) ? shows.slice(0, sliceCount) : dummyShowsData.slice(0, sliceCount);

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-44 overflow-hidden">
      <div className="relative flex items-center justify-between pt-20 pb-10">
        <BlurCircle top="0" right="-80px" />
        <p className="text-gray-300 font-medium text-xl">Now Showing</p>
        <button
          onClick={() => {
            navigate("/movies");
            scrollTo(0, 0);
          }}
          className="group flex items-center gap-2 text-sm text-gray-300 cursor-pointer "
        >
          View All
          <ArrowRight className="group-hover:translate-x-0.75 transition w-4.5 h-4.5" />
        </button>
      </div>

      <div className="flex flex-wrap max-sm:justify-center gap-8 mt-8 ">
        {displayShows.map((show) => (
          <MovieCard key={show._id} movie={show} />
        ))}
      </div>

      <div className="flex justify-center mt-20">
        <button
          onClick={() => {
            navigate("/movies");
            scrollTo(0, 0);
          }}
          className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer"
        >
          Show more
        </button>
      </div>
    </div>
  );
};

export default FeaturedSection;
