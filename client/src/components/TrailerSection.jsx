import React, { useEffect, useState } from "react";
import BlurCircle from "./BlurCircle";
import ReactPlayer from "react-player";
import axios from 'axios';

const TrailerSection = ({ id }) => {
  const [trailerUrl, setTrailerUrl] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchMovieTrailer = async () => {
    try {
      setLoading(true);
      
      // Fetch movie details from API
      const response = await axios.get(`/api/public/movies/${id}`);
      
      if (response.data.success && response.data.movie.trailer_path) {
        setTrailerUrl(response.data.movie.trailer_path);
      } else {
        console.log('No trailer available for this movie');
        setTrailerUrl('');
      }
    } catch (error) {
      console.error('Error fetching movie trailer:', error);
      setTrailerUrl('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchMovieTrailer();
    }
  }, [id]);

  return (
    <>
      <p id="trailer" className="text-xl font-medium mt-20">
        Trailer
      </p>

      <BlurCircle />
      <div className="py-20 pt-0 max-md:pb-0 overflow-hidden">
        <div className="relative mt-6">
          {loading ? (
            <p className="text-center text-gray-400 mt-10">
              Loading trailer...
            </p>
          ) : trailerUrl ? (
            <ReactPlayer
              url={trailerUrl}
              controls
              className="mx-auto max-w-full rounded-full"
              width="1280px"
              height="600px"
            />
          ) : (
            <p className="text-center text-gray-400 text-sm mt-10">
              Trailer not available for this movie.
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default TrailerSection;