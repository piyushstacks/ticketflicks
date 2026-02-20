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
      className={`flex flex-col justify-between p-3 rounded-2xl 
    hover:-translate-y-1 transition duration-300 w-74 lg:w-62 xl:w-66 ${
        isDark ? 'bg-gray-800' : 'bg-white border border-gray-300 shadow-md'
      }`}
    >
      <img
        src={backdropSrc}
        alt={movie.title}
        onClick={() => {
          navigate(`/movies/${movie._id}`);
          scrollTo(0, 0);
        }}
        className="rounded-lg h-52 w-full object-cover cursor-pointer"
      />

      <p className={`font-semibold mt-2 truncate ${
        isDark ? 'text-white' : 'text-gray-900'
      }`}>{movie.title}</p>

      <p className={`text-sm mt-2 break-all ${
        isDark ? 'text-gray-400' : 'text-gray-700'
      }`}>
        {new Date(movie.release_date).getFullYear()} ●{" "}
        {movie.genres
          .slice(0, 2)
          .map((genre) => genre.name)
          .join(" | ")}{" "}
        <span className="whitespace-nowrap">● {timeFormat(movie.runtime)}</span>
      </p>

      <div className="flex items-center justify-between mt-4 pb-3">
        <button
          onClick={() => {
            navigate(`/select-show/${movie._id}`);
            scrollTo(0, 0);
          }}
          className="px-4 py-2 text-xs bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer text-white"
        >
          Book Tickets
        </button>
        <p className={`flex items-center gap-1 text-sm mt-1 pr-1 ${
          isDark ? 'text-gray-400' : 'text-gray-700'
        }`}>
          <StarIcon className="w-4 h-4 text-primary fill-primary" />
          {movie.vote_average.toFixed(1)}
        </p>
      </div>
    </div>
  );
};

export default MovieCard;
