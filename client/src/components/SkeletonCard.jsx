import React from "react";

const SkeletonCard = () => {
  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Image Placeholder */}
      <div className="aspect-[2/3] w-full animate-shimmer" />

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        <div className="h-4 rounded-md w-3/4 animate-shimmer" />
        <div className="h-3 rounded-md w-full animate-shimmer" />
        <div className="flex items-center justify-between mt-2">
          <div className="h-8 w-24 rounded-lg animate-shimmer" />
          <div className="h-4 w-12 rounded-md animate-shimmer" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
