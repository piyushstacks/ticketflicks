import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { genreMap } from "../lib/genreMap";

const UpcomingMovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const { imageBaseURL } = useAppContext();
  const [imageError, setImageError] = useState(false);

  const posterSrc = movie?.poster_path?.startsWith("http")
    ? movie.poster_path
    : movie.poster_path
      ? imageBaseURL + movie.poster_path
      : movie?.backdrop_path?.startsWith("http")
        ? movie.backdrop_path
        : imageBaseURL + movie.backdrop_path;

  return (
    <div className="card card-hover flex flex-col overflow-hidden group">
      {/* Image */}
      <div className="relative overflow-hidden">
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center z-10" style={{ backgroundColor: "var(--bg-elevated)" }}>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Image unavailable</p>
          </div>
        )}
        <img
          src={posterSrc}
          alt={movie.title}
          onClick={() => { navigate(`/upcoming-movies/${movie.id}`); scrollTo(0, 0); }}
          className={`aspect-[2/3] w-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105 ${imageError ? "opacity-30" : ""}`}
          onError={() => setImageError(true)}
          loading="lazy"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
          <button
            onClick={() => { navigate(`/upcoming-movies/${movie.id}`); scrollTo(0, 0); }}
            className="btn-primary px-5 py-2 text-sm translate-y-2 group-hover:translate-y-0 transition-transform duration-300"
          >
            View Details
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-1">
        <h3 className="movie-title truncate">{movie.title}</h3>
        <p className="movie-meta">
          {new Date(movie.release_date).getFullYear()}
          {movie.genre_ids?.length > 0 && (
            <>
              {" "}-{" "}
              {movie.genre_ids.slice(0, 2).map((id) => genreMap[id]).join(" / ")}
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default UpcomingMovieCard;
