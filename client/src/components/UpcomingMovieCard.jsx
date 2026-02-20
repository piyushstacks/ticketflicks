import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { genreMap } from "../lib/genreMap";
import { StarIcon } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";

const UpcomingMovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { imageBaseURL } = useAppContext();
  const [imageError, setImageError] = useState(false);
  
  // Debug: Log movie data
  console.log('UpcomingMovieCard movie data:', {
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    imageBaseURL
  });
  
  // Use poster_path for movie cards, fallback to backdrop_path if poster not available
  const posterSrc = movie?.poster_path?.startsWith("http")
    ? movie.poster_path
    : movie.poster_path 
      ? imageBaseURL + movie.poster_path
      : movie?.backdrop_path?.startsWith("http")
        ? movie.backdrop_path
        : imageBaseURL + movie.backdrop_path;

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div
      className={`flex flex-col justify-between p-3 rounded-2xl 
    hover:-translate-y-1 transition duration-300 w-74 lg:w-62 xl:w-66 ${
        isDark ? 'bg-gray-800' : 'bg-white border border-gray-300 shadow-md'
      }`}
    >
      <div className="relative">
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
            <p className="text-white text-sm">Failed to load image</p>
          </div>
        )}
        <img
          src={posterSrc}
          alt={movie.title}
          onClick={() => {
            navigate(`/upcoming-movies/${movie.id}`);
            scrollTo(0, 0);
          }}
          className={`rounded-lg h-52 w-full object-cover cursor-pointer ${
            imageError ? 'opacity-50' : ''
          }`}
          onError={handleImageError}
          loading="lazy"
        />
      </div>
      <p className={`font-semibold mt-2 ${
        isDark ? 'text-white' : 'text-gray-900'
      }`}>{movie.title}</p>
      <p className={`text-sm mt-2 ${
        isDark ? 'text-gray-400' : 'text-gray-700'
      }`}>
        {new Date(movie.release_date).getFullYear()} ●{" "}
        {movie.genre_ids
          ?.slice(0, 2)
          .map((id) => genreMap[id])
          .join(" | ")}
      </p>
      <div className="flex items-center justify-center mt-4 pb-3 w-full">
        <button
          onClick={() => {
            navigate(`/upcoming-movies/${movie.id}`);
            scrollTo(0, 0);
          }}
          className="px-2 py-2 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer text-white"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default UpcomingMovieCard;
