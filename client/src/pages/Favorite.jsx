import React, { useState } from "react";
import MovieCard from "../components/MovieCard";
import BlurCircle from "../components/BlurCircle";
import { useAppContext } from "../context/AppContext";
import Loading from "../components/Loading";
import { MapPin, Heart } from "lucide-react";

const Favorite = () => {
  const { favoriteMovies, loading } = useAppContext();
  const [selectedMovieId, setSelectedMovieId] = useState(null);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="relative pt-24 pb-20 px-4 sm:px-6 md:px-12 lg:px-20 xl:px-36 overflow-hidden min-h-screen">
      <BlurCircle top="150px" left="0" />
      <BlurCircle bottom="110px" right="100px" />

      <h1 className="font-semibold text-2xl mb-2" style={{ color: "var(--text-primary)" }}>
        Your Favorites
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
        Movies you have liked
      </p>

      {favoriteMovies.length > 0 ? (
        <div className="movie-grid">
          {favoriteMovies.map((movie) => (
            <div key={movie._id} className="relative">
              <div
                onClick={() =>
                  setSelectedMovieId(selectedMovieId === movie._id ? null : movie._id)
                }
                className="cursor-pointer"
              >
                <MovieCard movie={movie} />
              </div>

              {selectedMovieId === movie._id && movie.theatres && (
                <div
                  className="absolute top-full left-0 right-0 mt-2 rounded-xl p-4 z-10 min-w-max animate-fadeIn"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    boxShadow: "0 16px 48px var(--shadow-color)",
                  }}
                >
                  <h3 className="font-semibold text-xs mb-3" style={{ color: "var(--text-primary)" }}>
                    Theatres Showing This Movie
                  </h3>
                  <div className="flex flex-col gap-2">
                    {movie.theatres.map((theatre) => (
                      <div
                        key={theatre.id}
                        className="rounded-lg p-3 transition-colors"
                        style={{ backgroundColor: "var(--color-accent-soft)" }}
                      >
                        <p className="font-medium text-sm text-accent">{theatre.name}</p>
                        <div className="flex items-start gap-1 text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                          <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                          <div>
                            <p>{theatre.location}</p>
                            {theatre.distance && <p>{theatre.distance}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center h-64 rounded-xl"
          style={{ backgroundColor: "var(--bg-secondary)" }}
        >
          <Heart className="w-10 h-10 mb-3" style={{ color: "var(--text-muted)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            No favorites yet
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Heart a movie to save it here
          </p>
        </div>
      )}
    </div>
  );
};

export default Favorite;
