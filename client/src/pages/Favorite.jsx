import React, { useState } from "react";
import MovieCard from "../components/MovieCard";
import BlurCircle from "../components/BlurCircle";
import { useAppContext } from "../context/AppContext";
import Loading from "../components/Loading";
import { MapPin } from "lucide-react";

const Favorite = () => {
  const { favoriteMovies, loading, imageBaseURL } = useAppContext();
  const [selectedMovieId, setSelectedMovieId] = useState(null);

  if (loading) {
    return <Loading />;
  }

  return favoriteMovies.length > 0 ? (
    <div className="relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]">
      <BlurCircle top="150px" left="0" />
      <BlurCircle bottom="110px" right="100px" />

      <h1 className="font-medium text-xl my-4">Your Favorite Movies</h1>
      <div className="flex flex-wrap max-sm:justify-center gap-9">
        {favoriteMovies.map((movie) => (
          <div key={movie._id} className="relative">
            <div
              onClick={() =>
                setSelectedMovieId(
                  selectedMovieId === movie._id ? null : movie._id
                )
              }
              className="cursor-pointer"
            >
              <MovieCard movie={movie} />
            </div>

            {/* Theatres dropdown */}
            {selectedMovieId === movie._id && movie.theatres && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/10 backdrop-blur-md border border-primary/30 rounded-lg p-4 z-10 min-w-max shadow-lg">
                <h3 className="font-semibold text-sm text-white mb-3">
                  Theatres Showing This Movie
                </h3>
                <div className="space-y-2">
                  {movie.theatres.map((theatre) => (
                    <div
                      key={theatre.id}
                      className="bg-primary/10 rounded p-3 hover:bg-primary/20 transition-colors"
                    >
                      <p className="font-medium text-white text-sm">
                        {theatre.name}
                      </p>
                      <div className="flex items-start gap-1 text-xs text-gray-300 mt-1">
                        <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                        <div>
                          <p>{theatre.location}</p>
                          <p className="text-gray-400">{theatre.distance}</p>
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
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold text-center">No movies available</h1>
    </div>
  );
};

export default Favorite;
