import { StarIcon } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import timeFormat from "../lib/timeFormat";
import { useAppContext } from "../context/AppContext";

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const { imageBaseURL } = useAppContext();

  const backdropSrc = movie?.backdrop_path?.startsWith("http")
    ? movie.backdrop_path
    : imageBaseURL + movie.backdrop_path;

  return (
    <div
      className="card card-hover flex flex-col overflow-hidden group"
      onClick={() => {
        navigate(`/movies/${movie._id}`);
        window.scrollTo(0, 0);
      }}
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={backdropSrc}
          alt={movie.title}
          onClick={() => {
            navigate(`/movies/${movie._id}`);
            window.scrollTo(0, 0);
          }}
          className="aspect-[2/3] w-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* Overlay on hover / always visible on touch */}
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
        <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-xs font-medium bg-black/50 text-white backdrop-blur-sm">
          {new Date(movie.release_date).getFullYear()}
        </div>
        {/* Rating badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-black/50 text-white backdrop-blur-sm">
          <StarIcon className="w-3 h-3 text-amber fill-amber" />
          {movie.vote_average?.toFixed(1)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-1 flex-1">
        <h3 className="movie-title truncate">{movie.title}</h3>
        <p className="movie-meta">
          {movie.genres?.slice(0, 2).map((genre) => genre.name).join(" / ") || 
           movie.genre_ids?.slice(0, 2).join(" / ") || 
           "Action / Drama"}
          <span className="mx-1.5">-</span>
          {timeFormat(movie.runtime || movie.duration_min)}
        </p>
      </div>
    </div>
  );
};

export default MovieCard;
