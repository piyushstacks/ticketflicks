import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { genreMap } from "../lib/genreMap";
import { Calendar } from "lucide-react";

const UpcomingMovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const { imageBaseURL } = useAppContext();
  const [imageError, setImageError] = useState(false);

  // Support both poster (UpcomingMovie model) and poster_path (Movie model)
  const rawPoster = movie?.poster_path || movie?.poster || "";
  const posterSrc = rawPoster.startsWith("http")
    ? rawPoster
    : rawPoster
      ? imageBaseURL + rawPoster
      : null;

  // Support both _id (MongoDB) and id fields
  const movieId = movie?._id || movie?.id;

  // Support both string genres array and numeric genre_ids
  const genreDisplay = (() => {
    if (Array.isArray(movie?.genres) && movie.genres.length > 0 && typeof movie.genres[0] === "string") {
      return movie.genres.slice(0, 2).join(" / ");
    }
    if (Array.isArray(movie?.genre_ids) && movie.genre_ids.length > 0) {
      return movie.genre_ids.slice(0, 2).map((id) => genreMap[id]).filter(Boolean).join(" / ");
    }
    return null;
  })();

  const releaseYear = movie?.release_date ? new Date(movie.release_date).getFullYear() : null;

  return (
    <div className="card card-hover flex flex-col overflow-hidden group">
      {/* Image */}
      <div className="relative overflow-hidden">
        {(imageError || !posterSrc) && (
          <div className="aspect-[2/3] w-full flex items-center justify-center" style={{ backgroundColor: "var(--bg-elevated)" }}>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Poster unavailable</p>
          </div>
        )}
        {posterSrc && (
          <img
            src={posterSrc}
            alt={movie.title}
            onClick={() => { navigate(`/upcoming-movies/${movieId}`); scrollTo(0, 0); }}
            className={`aspect-[2/3] w-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105 ${imageError ? "hidden" : ""}`}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
          <button
            onClick={() => { navigate(`/upcoming-movies/${movieId}`); scrollTo(0, 0); }}
            className="btn-primary px-5 py-2 text-sm translate-y-2 group-hover:translate-y-0 transition-transform duration-300"
          >
            View Details
          </button>
        </div>
        {/* Top gradient overlay for badge legibility */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />

        {/* Coming Soon badge */}
        <div className="absolute top-3 left-3 bg-red-600/90 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg border border-red-500/30">
          Coming Soon
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-1">
        <h3 className="movie-title truncate">{movie.title}</h3>
        <p className="movie-meta flex items-center gap-1">
          {releaseYear && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {releaseYear}
            </span>
          )}
          {genreDisplay && (
            <>
              {" "}-{" "}
              {genreDisplay}
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default UpcomingMovieCard;
