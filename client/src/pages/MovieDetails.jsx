import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BlurCircle from "../components/BlurCircle";
import { Heart, PlayCircleIcon, StarIcon } from "lucide-react";
import timeFormat from "../lib/timeFormat";
import MovieCard from "../components/MovieCard";
import Loading from "../components/Loading";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import TrailerSection from "../components/TrailerSection";
import TwitterReviews from "../components/TwitterReviews";
import useWindowWidth from "../hooks/useWindowWidth";

const MovieDetails = () => {
  const navigate = useNavigate();
  const width = useWindowWidth();

  let sliceCount = 4;
  if (width >= 1024 && width < 1536) sliceCount = 3;

  const { id } = useParams();
  const [show, setShow] = useState(null);

  const {
    shows: allShows,
    axios,
    getToken,
    user,
    fetchFavoriteMovies,
    favoriteMovies,
    imageBaseURL,
  } = useAppContext();

  const getShow = async () => {
    try {
      // Route param `id` is a MOVIE id (because route is /movies/:id)
      // Fetch movie details directly.
      const { data } = await axios.get(`/api/show/movies/${id}`);
      if (data?.success && data?.movie) {
        setShow({ movie: data.movie, dateTime: {} });
        return;
      }

      // Fallback: derive movie from any active show for this movie.
      const fallback = await axios.get(`/api/show/shows/movie/${id}`);
      if (fallback?.data?.success) {
        const anyShow = Array.isArray(fallback.data.shows)
          ? fallback.data.shows[0]
          : null;
        const movieFromShow = anyShow?.movie_id || anyShow?.movie;
        if (movieFromShow) {
          setShow({ movie: movieFromShow, dateTime: {} });
          return;
        }
      }

      setShow(null);
    } catch (error) {
      console.error(error);
      setShow(null);
    }
  };

  const handleFavorite = async () => {
    try {
      if (!user) return toast.error("Please login to proceed");
      const { data } = await axios.post(
        "/api/user/update-favorite",
        { movieId: id },
        { headers: { Authorization: `Bearer ${await getToken()}` } },
      );
      if (data.success) {
        await fetchFavoriteMovies();
        toast.success(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const isFavorite = favoriteMovies.some((movie) => movie._id === id);

  const FavoriteButton = ({ className = "", iconSize = "w-5 h-5" }) => (
    <button
      onClick={handleFavorite}
      className={`p-2.5 rounded-xl transition cursor-pointer active:scale-95 ${className}`}
      style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)" }}
    >
      <Heart className={`${iconSize} ${isFavorite ? "fill-accent text-accent" : ""}`} style={{ color: isFavorite ? undefined : "var(--text-secondary)" }} />
    </button>
  );

  useEffect(() => {
    getShow();
  }, [id]);

  return show && show.movie ? (
    <div className="px-4 sm:px-6 md:px-12 lg:px-20 xl:px-36 pt-24 md:pt-32 pb-20">
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto mb-16">
        <img
          src={
            (show.movie.poster_path || "").startsWith("http")
              ? show.movie.poster_path
              : imageBaseURL + (show.movie.poster_path || "")
          }
          alt={show.movie.title || "Movie Poster"}
          className="max-md:mx-auto rounded-xl h-[420px] max-w-[280px] object-cover"
          style={{ border: "1px solid var(--border)" }}
        />

        <div className="relative flex flex-col gap-3 flex-1">
          <BlurCircle top="-100px" left="-100px" />
          <span className="text-accent text-sm font-semibold uppercase tracking-wider">English</span>
          <div className="flex items-center gap-3 w-full">
            <h1 className="text-3xl md:text-4xl font-bold text-balance" style={{ color: "var(--text-primary)" }}>
              {show.movie.title}
            </h1>
            <FavoriteButton className="lg:hidden ml-auto" iconSize="w-6 h-6" />
          </div>

          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            <StarIcon className="w-4 h-4 text-accent fill-accent" />
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
              {typeof show.movie.vote_average === "number" && !isNaN(show.movie.vote_average) ? show.movie.vote_average.toFixed(1) : "N/A"}
            </span>
            User Rating
          </div>

          <p className="mt-2 text-sm leading-relaxed max-w-2xl" style={{ color: "var(--text-secondary)" }}>
            {show.movie.overview}
          </p>

          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {show.movie.runtime ? timeFormat(show.movie.runtime) : "N/A"} -{" "}
            {Array.isArray(show.movie.genres) ? show.movie.genres.map((g) => g.name).join(" / ") : "N/A"} -{" "}
            {show.movie.release_date ? new Date(show.movie.release_date).toLocaleDateString() : "N/A"}
          </p>

          <div className="flex items-center flex-wrap gap-3 mt-4">
            <a
              href="#trailer"
              className="btn-secondary px-6 py-2.5 text-sm"
            >
              <PlayCircleIcon className="w-4 h-4" />
              Watch Trailer
            </a>
            <button
              onClick={() => {
                navigate(`/select-show/${id}`);
                window.scrollTo(0, 0);
              }}
              className="btn-primary px-8 py-2.5 text-sm"
            >
              Book Tickets
            </button>
            <FavoriteButton className="max-md:hidden" />
          </div>
        </div>
      </div>

      {/* Cast */}
      {show.movie.casts && show.movie.casts.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Movie Cast</h2>
          <div className="overflow-x-auto pb-4 no-scrollbar">
            <div className="flex items-start gap-5 w-max">
              {show.movie.casts.slice(0, 16).map((cast, index) => (
                <div key={index} className="flex flex-col items-center text-center w-20">
                  <img
                    src={imageBaseURL + cast.profile_path}
                    alt={cast.name}
                    className="rounded-full h-16 w-16 object-cover"
                    style={{ border: "2px solid var(--border)" }}
                    loading="lazy"
                  />
                  <p className="text-xs mt-2 font-medium leading-tight" style={{ color: "var(--text-secondary)" }}>{cast.name}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div id="trailer">
        <TrailerSection id={id} />
      </div>

      {show.movie.reviews && show.movie.reviews.length > 0 && (
        <TwitterReviews reviews={show.movie.reviews} />
      )}

      {/* Related */}
      <h2 className="text-lg font-semibold mt-20 mb-6" style={{ color: "var(--text-primary)" }}>You May Also Like</h2>
      <div className="movie-grid">
        {(Array.isArray(allShows) ? allShows : [])
          .filter((movie) => movie._id !== id)
          .slice(0, sliceCount)
          .map((movie, index) => (
            <MovieCard key={index} movie={movie} />
          ))}
      </div>
      <div className="flex justify-center mt-12">
        <button
          onClick={() => {
            navigate("/movies");
            window.scrollTo(0, 0);
          }}
          className="btn-secondary px-8 py-2.5 text-sm"
        >
          Show More
        </button>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default MovieDetails;
