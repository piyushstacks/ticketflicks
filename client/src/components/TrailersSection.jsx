import React, { useEffect, useMemo, useState } from "react";
import BlurCircle from "./BlurCircle";
import ReactPlayer from "react-player";
import { PlayCircleIcon } from "lucide-react";
import { useAppContext } from "../context/AppContext";

const TrailersSection = () => {
  const { shows, loading } = useAppContext();

  const trailersData = useMemo(() => {
    if (!shows || loading) return [];
    return shows
      .filter((movie) => movie && (movie.trailer_path || movie.trailer_link))
      .map((movie) => {
        const videoUrl = movie.trailer_path || movie.trailer_link;
        // Try to extract YouTube ID for thumbnail
        let ytId = null;
        if (videoUrl && videoUrl.includes('youtube.com/watch?v=')) {
          ytId = videoUrl.split('v=')[1]?.split('&')[0];
        } else if (videoUrl && videoUrl.includes('youtu.be/')) {
          ytId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
        }
        
        return {
          id: movie._id || movie.id,
          title: movie.title,
          videoUrl,
          image: ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : movie.backdrop_path || movie.poster_path,
        };
      });
  }, [shows, loading]);

  const [currentTrailer, setCurrentTrailer] = useState(null);

  useEffect(() => {
    if (trailersData.length > 0 && !currentTrailer) {
      setCurrentTrailer(trailersData[0]);
    }
  }, [trailersData, currentTrailer]);

  const thumbnailTrailers = useMemo(() => {
    if (!currentTrailer) return [];
    return trailersData.filter((item) => item.id !== currentTrailer.id).slice(0, 4);
  }, [currentTrailer, trailersData]);

  if (loading) {
    return (
      <section className="px-4 sm:px-6 md:px-12 lg:px-20 xl:px-36 py-20 max-md:pb-0 overflow-hidden">
        <h2 className="font-semibold text-xl" style={{ color: "var(--text-primary)" }}>
          Trailers
        </h2>
        <div className="relative mt-6 flex items-center justify-center h-64 rounded-xl" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading trailers...</p>
        </div>
      </section>
    );
  }

  if (!trailersData || trailersData.length === 0 || !currentTrailer) {
    return null;
  }

  return (
    <section className="px-4 sm:px-6 md:px-12 lg:px-20 xl:px-36 py-20 max-md:pb-0 overflow-hidden">
      <h2 className="font-semibold text-xl" style={{ color: "var(--text-primary)" }}>
        Trailers
      </h2>

      <div className="relative mt-6">
        <BlurCircle top="-10px" />
        <div className="w-full max-w-4xl mx-auto rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
            <ReactPlayer
              url={currentTrailer.videoUrl}
              controls={true}
              className="absolute inset-0"
              width="100%"
              height="100%"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 max-w-3xl mx-auto">
        {thumbnailTrailers.map((t) => (
          <button
            key={t.id}
            className="relative group rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
            style={{ border: "1px solid var(--border)" }}
            onClick={() => setCurrentTrailer(t)}
          >
            <img
              src={t.image}
              alt={`${t.title} thumbnail`}
              onError={(e) => (e.target.src = "/fallback-thumbnail.jpg")}
              className="w-full h-full object-cover brightness-75 group-hover:brightness-100 transition-all duration-200"
            />
            <PlayCircleIcon
              strokeWidth={1.5}
              className="absolute top-1/2 left-1/2 w-6 md:w-8 h-6 md:h-8 -translate-x-1/2 -translate-y-1/2 text-white/80 group-hover:text-white group-hover:scale-110 transition-all"
            />
          </button>
        ))}
      </div>
    </section>
  );
};

export default TrailersSection;
