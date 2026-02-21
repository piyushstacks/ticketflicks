import React from "react";
import BlurCircle from "../components/BlurCircle";
import { useAppContext } from "../context/AppContext";
import UpcomingMovieCard from "../components/UpcomingMovieCard";
import Loading from "../components/Loading";
import { Film } from "lucide-react";

const Upcoming = () => {
  const { upcomingMovies, loading } = useAppContext();

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="relative pt-24 pb-20 px-4 sm:px-6 md:px-12 lg:px-20 xl:px-36 overflow-hidden min-h-screen">
      <BlurCircle top="100px" />
      <BlurCircle bottom="0" right="100px" />

      <h1 className="font-semibold text-2xl mb-2" style={{ color: "var(--text-primary)" }}>
        Upcoming Movies
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
        Movies releasing soon in theatres
      </p>

      {upcomingMovies.length > 0 ? (
        <div className="movie-grid">
          {upcomingMovies.map((movie) => (
            <UpcomingMovieCard movie={movie} key={movie.id} />
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center h-64 rounded-xl"
          style={{ backgroundColor: "var(--bg-secondary)" }}
        >
          <Film className="w-10 h-10 mb-3" style={{ color: "var(--text-muted)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            No upcoming movies available
          </p>
        </div>
      )}
    </div>
  );
};

export default Upcoming;
