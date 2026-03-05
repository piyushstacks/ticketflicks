import React, { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import Loading from "../components/Loading";
import { useParams } from "react-router-dom";
import BlurCircle from "../components/BlurCircle";
import { genreMap } from "../lib/genreMap";
import { PlayCircleIcon, CalendarIcon, Film } from "lucide-react";
import TrailerSection from "../components/TrailerSection";

const UpcomingMovieDetails = () => {
  const { upcomingMovies, imageBaseURL, loading } = useAppContext();
  const { id } = useParams();
  const [upcomingMovie, setUpcomingMovie] = useState(null);

  useEffect(() => {
    if (!upcomingMovies || upcomingMovies.length === 0) return;
    // Match by _id or id (both may exist depending on how data is returned)
    const movie = upcomingMovies.find(
      (m) => String(m._id || m.id) === String(id)
    );
    if (movie) {
      setUpcomingMovie(movie);
    }
  }, [id, upcomingMovies]);

  if (loading) return <Loading />;

  if (!upcomingMovie) {
    return (
      <div className="flex justify-center items-center h-[90vh]">
        <p className="text-gray-400 text-lg">Movie not found.</p>
      </div>
    );
  }

  // Support both poster_path (mapped) and poster (raw UpcomingMovie field)
  const rawPoster = upcomingMovie.poster_path || upcomingMovie.poster || "";
  const posterSrc = rawPoster.startsWith("http")
    ? rawPoster
    : rawPoster ? imageBaseURL + rawPoster : null;

  // Support both string genres[] and numeric genre_ids[]
  const genreDisplay = (() => {
    if (Array.isArray(upcomingMovie.genres) && upcomingMovie.genres.length > 0 && typeof upcomingMovie.genres[0] === "string") {
      return upcomingMovie.genres.join(" | ");
    }
    if (Array.isArray(upcomingMovie.genre_ids) && upcomingMovie.genre_ids.length > 0) {
      return upcomingMovie.genre_ids.map((gid) => genreMap[gid]).filter(Boolean).join(" | ");
    }
    return "N/A";
  })();

  // Description can be in overview (mapped) or description (raw)
  const description = upcomingMovie.overview || upcomingMovie.description || "";

  return (
    <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50 pb-20">
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        {/* Poster */}
        {posterSrc ? (
          <img
            src={posterSrc}
            alt={upcomingMovie.title}
            className="max-md:mx-auto rounded-xl h-104 max-w-70 object-cover shadow-2xl"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="max-md:mx-auto rounded-xl h-104 max-w-70 w-full flex items-center justify-center bg-gray-800">
            <Film className="w-16 h-16 text-gray-600" />
          </div>
        )}

        {/* Info */}
        <div className="relative flex flex-col gap-3">
          <BlurCircle top="-100px" left="-100px" />
          
          {/* Coming Soon badge */}
          <span className="inline-flex items-center gap-1 bg-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full w-fit">
            <CalendarIcon className="w-3 h-3" />
            Coming Soon
          </span>

          <h1 className="text-4xl font-semibold max-w-xl text-balance text-[var(--text-primary)]">
            {upcomingMovie.title}
          </h1>

          <p className="text-[var(--text-secondary)] mt-2 text-md leading-relaxed max-w-2xl">
            {description}
          </p>

          <p>
            <span className="text-primary font-medium">Release Date</span>
            {" "}:{" "}
            <span className="text-[var(--text-primary)]">
              {upcomingMovie.release_date
                ? new Date(upcomingMovie.release_date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "TBA"}
            </span>
          </p>

          <p>
            <span className="text-primary font-medium">Genres</span>
            {" "}:{" "}
            <span className="text-[var(--text-primary)]">{genreDisplay}</span>
          </p>

          <div className="flex items-center flex-wrap gap-4 mt-4">
            <a
              href="#trailer"
              className="flex items-center gap-2 px-7 py-3 text-sm bg-[var(--bg-elevated)] hover:bg-[var(--bg-card-hover)] transition rounded-md font-medium cursor-pointer active:scale-95 border border-[var(--border)] text-[var(--text-primary)]"
            >
              <PlayCircleIcon className="w-5 h-5" />
              Watch Trailer
            </a>
          </div>
        </div>
      </div>

      <TrailerSection url={upcomingMovie.trailer} />
    </div>
  );
};

export default UpcomingMovieDetails;
