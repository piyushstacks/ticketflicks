import { StarIcon, Film } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import timeFormat from "../lib/timeFormat";
import { useAppContext } from "../context/AppContext";

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const { imageBaseURL } = useAppContext();

  // Prefer poster_path, then backdrop_path, then null
  const rawPath = movie?.poster_path || movie?.backdrop_path || null;
  const imageSrc = rawPath
    ? rawPath.startsWith("http")
      ? rawPath
      : imageBaseURL + rawPath
    : null; // null → show gradient placeholder

  const releaseYear = movie?.release_date
    ? new Date(movie.release_date).getFullYear()
    : null;

  return (
    <div
      className="card card-hover flex flex-col overflow-hidden group cursor-pointer"
      onClick={() => {
        navigate(`/movies/${movie._id}`);
        window.scrollTo(0, 0);
      }}
    >
      {/* Image / Placeholder */}
      <div className="relative overflow-hidden aspect-[2/3] w-full">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              // If the image fails to load, swap to placeholder
              e.currentTarget.style.display = "none";
              e.currentTarget.nextSibling?.style?.removeProperty("display");
            }}
          />
        ) : null}
        {/* Gradient placeholder — shown when no image, or image fails */}
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-3"
          style={{
            display: imageSrc ? "none" : "flex",
            background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%)",
          }}
        >
          <Film className="w-12 h-12 opacity-40 text-purple-300" />
          <span className="text-xs font-semibold text-purple-200 opacity-60 text-center px-3 leading-tight">
            {movie.title}
          </span>
        </div>

        {/* Book Now overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/select-show/${movie._id}`);
              window.scrollTo(0, 0);
            }}
            className="btn-primary px-6 py-2 text-sm translate-y-0 sm:translate-y-2 sm:group-hover:translate-y-0 transition-transform duration-300"
          >
            Book Now
          </button>
        </div>

        {/* Year badge */}
        {releaseYear && (
          <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-xs font-medium bg-black/50 text-[var(--text-primary)] backdrop-blur-sm">
            {releaseYear}
          </div>
        )}

        {/* Rating badge */}
        {movie.vote_average != null && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-black/50 text-[var(--text-primary)] backdrop-blur-sm">
            <StarIcon className="w-3 h-3 text-amber fill-amber" />
            {Number(movie.vote_average).toFixed(1)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-1 flex-1">
        <h3 className="movie-title truncate">{movie.title}</h3>
        <p className="movie-meta">
          {movie.genres?.slice(0, 2).map((g) => g.name).join(" / ") ||
           movie.genre_ids?.slice(0, 2).join(" / ") ||
           "Drama"}
          <span className="mx-1.5">-</span>
          {timeFormat(movie.runtime || movie.duration_min)}
        </p>
      </div>
    </div>
  );
};

export default MovieCard;
