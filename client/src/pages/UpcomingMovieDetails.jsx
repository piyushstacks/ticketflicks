import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import Loading from "../components/Loading";
import { useParams } from "react-router-dom";
import BlurCircle from "../components/BlurCircle";
import { useEffect } from "react";
import { genreMap } from "../lib/genreMap";
import { PlayCircleIcon } from "lucide-react";
import TrailerSection from "../components/TrailerSection";

const UpcomingMovieDetails = () => {
  const { upcomingMovies, imageBaseURL, loading } = useAppContext();

  const { id } = useParams();

  const [upcomingMovie, setUpcomingMovie] = useState();

  const fetchUpcomingMovie = async () => {
    const movie = upcomingMovies.find((movie) => String(movie.id) === String(id));

    if (movie) {
      setUpcomingMovie(movie);
    } else {
      // Debug: Check if movie exists with different ID format
      console.log("Looking for movie with ID:", id, "type:", typeof id);
      console.log("Available movie IDs:", upcomingMovies.map(m => ({id: m.id, type: typeof m.id})));
    }
  };

  useEffect(() => {
    fetchUpcomingMovie();
  }, [id, upcomingMovies]);

  if (loading) {
    return <Loading />;
  }

  if (!upcomingMovie) {
    return (
      <div className="flex justify-center items-center h-[90vh]">
        <p className="text-gray-400 text-lg">Movie not found.</p>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50">
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        <img
          src={upcomingMovie.poster_path?.startsWith("http") 
            ? upcomingMovie.poster_path 
            : imageBaseURL + upcomingMovie.poster_path}
          alt={upcomingMovie.title}
          className="max-md:mx-auto rounded-xl h-104 max-w-70 object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            console.error('Failed to load poster image:', upcomingMovie.poster_path);
          }}
        />

        <div className="relative flex flex-col gap-3">
          <BlurCircle top="-100px" left="-100px" />
          <p className="text-primary">ENGLISH</p>
          <h1 className="text-4xl font-semibold max-w-96 text-balance">
            {upcomingMovie.title}
          </h1>

          <p className="text-gray-400 mt-2 text-md leading-tight max-w-2xl">
            {upcomingMovie.overview}
          </p>
          <p>
            <span className="text-primary">Releasing Date</span> :{" "}
            {upcomingMovie.release_date ? new Date(upcomingMovie.release_date).toLocaleDateString() : "N/A"}
          </p>
          <p>
            <span className="text-primary">Genres</span> :{" "}
            {upcomingMovie.genre_ids
              ?.slice(0, 2)
              .map((id) => genreMap[id])
              .join(" | ")}
          </p>

          <div className="flex items-center flex-wrap gap-4 mt-4">
            <a
              href="#trailer"
              className="flex items-center gap-2 px-7 py-3 text-sm bg-gray-800 hover:bg-gray-900 transition 
              rounded-md font-medium cursor-pointer active:scale-95"
            >
              <PlayCircleIcon className="w-5 h-5" />
              Watch Trailer
            </a>
          </div>
        </div>
      </div>
      <TrailerSection id={id} />
    </div>
  );
};

export default UpcomingMovieDetails;
