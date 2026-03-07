import React from "react";
import BlurCircle from "./BlurCircle";
import ReactPlayer from "react-player";

const TrailerSection = ({ url }) => {
  return (
    <>
      <p id="trailer" className="text-xl font-medium mt-20">
        Trailer
      </p>

      <BlurCircle />
      <div className="py-20 pt-0 max-md:pb-0 overflow-hidden">
        <div className="relative mt-6">
          {url ? (
            <ReactPlayer
              url={url}
              controls
              className="mx-auto max-w-full rounded-2xl overflow-hidden"
              width="100%"
              height="60vh"
              style={{ maxHeight: "600px" }}
            />
          ) : (
            <div className="flex items-center justify-center bg-black/40 rounded-2xl h-[400px]">
              <p className="text-center text-[var(--text-muted)] text-sm">
                Trailer not available for this movie.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TrailerSection;