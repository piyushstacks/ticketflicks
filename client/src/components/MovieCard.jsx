import { StarIcon } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import timeFormat from "../lib/timeFormat";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext.jsx";

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const { imageBaseURL } = useAppContext();
  const { isDark } = useTheme();

  const backdropSrc = movie?.backdrop_path?.startsWith("http")
    ? movie.backdrop_path
    : imageBaseURL + movie.backdrop_path;

  return (
    <div
      className={`movie-card glass-card card-hover flex flex-col justify-between shadow-lg transition-all duration-300 w-full max-w-xs mx-auto mb-6 ${isDark ? '' : ''}`}
      style={{ minHeight: 340 }}
    >
      <div className="relative">
        <img
          src={backdropSrc}
          alt={movie.title}
          onClick={() => {
            navigate(`/movies/${movie._id}`);
            scrollTo(0, 0);
          }}
          className="rounded-xl h-56 w-full object-cover cursor-pointer shadow-md transition-transform duration-200 hover:scale-105"
        />
        <div className="absolute top-3 left-3 bg-black bg-opacity-60 px-2 py-1 rounded text-xs text-white font-semibold shadow-sm">
          {new Date(movie.release_date).getFullYear()}
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black bg-opacity-60 px-2 py-1 rounded text-xs text-white font-semibold shadow-sm">
          <StarIcon size={16} className="text-yellow-400" />
          {movie.vote_average?.toFixed(1)}
        </div>
      </div>
      <div className="mt-3">
        <p className="movie-title truncate mb-1">{movie.title}</p>
        <p className="movie-meta mb-2">
          {movie.genres.slice(0, 2).map((genre) => genre.name).join(" | ")}
          <span className="mx-2">•</span>
          <span>{timeFormat(movie.runtime)}</span>
        </p>
      </div>
      <div className="flex items-center justify-between mt-2">
        <button
          onClick={() => {
            navigate(`/select-show/${movie._id}`);
            scrollTo(0, 0);
          }}
          className="btn-primary px-5 py-2 text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-accent transition"
        >
          Book Now
        </button>
        <p className="movie-meta pr-1">
          <StarIcon className="w-4 h-4 text-primary fill-primary" />
          {movie.vote_average.toFixed(1)}
        </p>
      </div>
    </div>
  );
};

export default MovieCard;
