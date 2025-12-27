import React, { useEffect, useMemo, useState } from "react";
import BlurCircle from "./BlurCircle";
import ReactPlayer from "react-player";
import { PlayCircleIcon } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { dummyTrailers } from "../assets/assets";

const TrailersSection = () => {
  const { upcomingMovies, trailer } = useAppContext();

  const trailersData = useMemo(() => {
    // Map upcomingMovies -> trailer entries (only those that have a key)
    const real = upcomingMovies
      .map((movie) => {
        const trailerInfo = trailer[movie.id];

        if (trailerInfo && trailerInfo.key) {
          return {
            id: movie.id,
            title: movie.title,
            videoUrl: trailerInfo.url,
            image: `https://i.ytimg.com/vi/${trailerInfo.key}/hqdefault.jpg`,
          };
        }
        return null;
      })
      .filter(Boolean);

    // If no real trailers available, fall back to dummyTrailers from assets
    if (real.length > 0) return real;

    return dummyTrailers.map((t, i) => ({
      id: `dummy-${i}`,
      title: t.title || `Trailer ${i + 1}`,
      videoUrl: t.videoUrl,
      image: t.image,
    }));
  }, [upcomingMovies, trailer]);

  const [currentTrailer, setCurrentTrailer] = useState(null);

  // Set default trailer once data is available
  useEffect(() => {
    if (trailersData && trailersData.length > 0) {
      // If currentTrailer is not set or no longer present in data, pick the first
      if (!currentTrailer || !trailersData.some((t) => t.id === currentTrailer.id)) {
        setCurrentTrailer(trailersData[0]);
      }
    }
  }, [trailersData, currentTrailer]);

  const thumbnailTrailers = useMemo(() => {
    if (!currentTrailer) return [];
    return trailersData.filter((item) => item.id !== currentTrailer.id).slice(0, 4);
  }, [currentTrailer, trailersData]);

  // If there's no trailer to show (extremely unlikely since dummy exists), render nothing
  if (!trailersData || trailersData.length === 0 || !currentTrailer) {
    return null;
  }

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-44 py-20 max-md:pb-0 overflow-hidden">
      <p className="text-gray-300 font-medium text-xl max-w-[960px]">
        Trailers
      </p>

      <div className="relative mt-6">
        <BlurCircle top="-10px" />
        <ReactPlayer
          url={currentTrailer.videoUrl}
          controls={true}
          className="mx-auto max-w-full"
          width="960px"
          height="540px"
        />
      </div>

      <div className="group grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-8 max-w-3xl mx-auto">
        {thumbnailTrailers.map((trailer) => (
          <div
            key={trailer.id}
            className="relative group-hover:opacity-50 hover:-translate-y-1 duration-300 transition cursor-pointer"
            onClick={() => setCurrentTrailer(trailer)}
          >
            <img
              src={trailer.image}
              alt={`${trailer.title} thumbnail`}
              onError={(e) => (e.target.src = "/fallback-thumbnail.jpg")}
              className="rounded-lg w-full h-full object-cover brightness-75"
            />
            <PlayCircleIcon
              strokeWidth={1.6}
              className="absolute top-1/2 left-1/2 w-5 md:w-8 h-5 md:h-12 transform -translate-x-1/2 -translate-y-1/2 text-white"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrailersSection;
