import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import DateTimePicker from "../components/DateTimePicker";
import Loading from "../components/Loading";
import { ArrowLeft, Clock, Calendar } from "lucide-react";

const BuyTicketsFlow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { axios, imageBaseURL } = useAppContext();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMovie = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/show/${id}`);

      if (data.success) {
        if (data.movie) {
          setMovie(data.movie);
        } else if (data.show) {
          setMovie(data.show.movie);
        }
      }
    } catch (error) {
      console.error("Error fetching movie:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovie();
  }, [id]);

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Movie Hero Banner */}
      {movie && (
        <div className="relative h-56 sm:h-64 md:h-80 lg:h-96 overflow-hidden">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${imageBaseURL + (movie.backdrop_path || movie.poster_path || "")})`,
              filter: "brightness(0.35) saturate(1.2)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, transparent 0%, var(--bg-primary) 100%)`,
            }}
          />

          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 sm:top-6 sm:left-6 md:left-12 lg:left-20 xl:left-36 z-10 flex items-center gap-2 btn-secondary px-3 py-2 sm:px-4 text-sm shadow-md backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Movie Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 md:px-12 lg:px-20 xl:px-36 pb-6 sm:pb-8 z-10">
            <h1
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 text-balance leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {movie.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
              {movie.runtime && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                </span>
              )}
              {movie.release_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(movie.release_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
              {movie.genre_ids?.length > 0 && (
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: "var(--color-accent-soft)",
                    color: "var(--color-accent)",
                  }}
                >
                  {movie.genre_ids.length} genres
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Date & Time Picker Section */}
      <DateTimePicker movieId={id} />
    </div>
  );
};

export default BuyTicketsFlow;
