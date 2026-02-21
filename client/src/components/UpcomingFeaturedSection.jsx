import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import BlurCircle from "./BlurCircle";
import { ArrowRight } from "lucide-react";
import UpcomingMovieCard from "./UpcomingMovieCard";
import useWindowWidth from "../hooks/useWindowWidth";
import SkeletonCard from "./SkeletonCard";

const UpcomingFeaturedSection = () => {
  const navigate = useNavigate();
  const width = useWindowWidth();

  let sliceCount = 4;
  if (width >= 1024 && width < 1536) {
    sliceCount = 3;
  }
  const { upcomingMovies, loading } = useAppContext();

  if (loading) {
    return (
      <div className="px-4 sm:px-6 md:px-12 lg:px-20 xl:px-36 pt-20">
        <div className="movie-grid">
          {Array.from({ length: sliceCount }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!upcomingMovies || upcomingMovies.length === 0) {
    return null;
  }

  return (
    <section className="px-4 sm:px-6 md:px-12 lg:px-20 xl:px-36 overflow-hidden">
      <div className="relative flex items-center justify-between pt-20 pb-8">
        <BlurCircle top="130px" left="50px" />
        <h2 className="font-semibold text-xl" style={{ color: "var(--text-primary)" }}>
          Upcoming Movies
        </h2>
        <button
          onClick={() => { navigate("/upcoming-movies"); scrollTo(0, 0); }}
          className="group flex items-center gap-2 text-sm font-medium cursor-pointer transition-colors duration-200 hover:text-accent"
          style={{ color: "var(--text-secondary)" }}
        >
          View All
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      <div className="movie-grid">
        {upcomingMovies.slice(0, sliceCount).map((movie) => (
          <UpcomingMovieCard key={movie.id} movie={movie} />
        ))}
      </div>

      <div className="flex justify-center mt-12">
        <button
          onClick={() => { navigate("/upcoming-movies"); scrollTo(0, 0); }}
          className="btn-secondary px-8 py-2.5 text-sm"
        >
          Show more
        </button>
      </div>
    </section>
  );
};

export default UpcomingFeaturedSection;
