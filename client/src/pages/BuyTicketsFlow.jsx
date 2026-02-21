import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import DateTimePicker from "../components/DateTimePicker";
import Loading from "../components/Loading";
import { ArrowLeft } from "lucide-react";

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
        // The API returns { success: true, movie, dateTime }
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
     <div className="min-h-screen bg-dark-gradient">
      {/* Back Button & Movie Header */}
      {movie && (
        <div className="relative h-64 md:h-96 overflow-hidden glass-card shadow-xl mb-8">
          {/* Background Image with Overlay */}
          <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{
              backgroundImage: `url(${imageBaseURL + (movie.backdrop_path || movie.poster_path || "")})`,
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-gray-950" />

          {/* Back Button */}
          <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 md:left-16 z-10 flex items-center gap-2 btn-secondary px-4 py-2 font-medium text-sm shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {/* Movie Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-6 md:px-16 lg:px-40 pb-8 z-10">
          <h1 className="text-4xl md:text-5xl font-bold movie-title mb-2 text-balance">
              {movie.title}
            </h1>
            <p className="text-gray-300 text-sm md:text-base">
                {movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : "N/A"} <span className="mx-2">•</span>
                {movie.release_date
                  ? new Date(movie.release_date).toLocaleDateString()
                  : "N/A"}
            </p>
          </div>
        </div>
      )}

      {/* Date & Time Picker Section */}
    <DateTimePicker movieId={id} />
    </div>
  );
};

export default BuyTicketsFlow;
