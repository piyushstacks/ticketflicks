import React from "react";
import MovieCard from "../components/MovieCard";
import BlurCircle from "../components/BlurCircle";
import { useAppContext } from "../context/AppContext";
import Loading from "../components/Loading";
import { Film } from "lucide-react";

const Movies = () => {
  const { shows, loading } = useAppContext();

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="relative pt-24 pb-20 px-4 sm:px-6 md:px-12 lg:px-20 xl:px-36 overflow-hidden min-h-screen">
      <BlurCircle top="150px" left="0" />
      <BlurCircle bottom="110px" right="100px" />

      <h1 className="font-semibold text-2xl mb-2" style={{ color: "var(--text-primary)" }}>
        Now Showing
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
        Browse all movies currently playing in theatres
      </p>

      {shows.length > 0 ? (
        <div className="movie-grid">
          {shows.map((movie) => (
            <MovieCard movie={movie} key={movie._id} />
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center h-64 rounded-xl"
          style={{ backgroundColor: "var(--bg-secondary)" }}
        >
          <Film className="w-10 h-10 mb-3" style={{ color: "var(--text-muted)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            No shows available right now
          </p>
        </div>
      )}
    </div>
  );
};

export default Movies;
