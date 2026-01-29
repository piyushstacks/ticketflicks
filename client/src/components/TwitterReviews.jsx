import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, ExternalLink, Twitter, RefreshCw } from "lucide-react";

// Component to embed a single Twitter/X post using blockquote method
const TwitterEmbed = ({ url }) => {
  const containerRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading, loaded, error

  // Extract tweet ID from URL
  const getTweetId = (url) => {
    const match = url.match(/status\/(\d+)/);
    return match ? match[1] : null;
  };

  // Extract username from URL
  const getUsername = (url) => {
    const match = url.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status/);
    return match ? match[1] : null;
  };

  const tweetId = getTweetId(url);
  const username = getUsername(url);

  useEffect(() => {
    if (!tweetId || !containerRef.current) {
      setStatus("error");
      return;
    }

    let isMounted = true;

    const renderTweet = async () => {
      try {
        // Create the blockquote element that Twitter will transform
        const blockquote = document.createElement("blockquote");
        blockquote.className = "twitter-tweet";
        blockquote.setAttribute("data-theme", "dark");
        blockquote.setAttribute("data-dnt", "true");

        // Add a link to the tweet (required for the widget)
        const link = document.createElement("a");
        link.href = url.replace("x.com", "twitter.com"); // Ensure twitter.com domain
        blockquote.appendChild(link);

        // Clear and append
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
          containerRef.current.appendChild(blockquote);
        }

        // Load or reload Twitter widgets
        if (window.twttr && window.twttr.widgets) {
          await window.twttr.widgets.load(containerRef.current);
          if (isMounted) {
            // Check if tweet was rendered (blockquote should be replaced)
            const iframe = containerRef.current.querySelector("iframe");
            if (iframe) {
              setStatus("loaded");
            } else {
              // Widget loaded but tweet might not have rendered
              setTimeout(() => {
                if (isMounted) {
                  const iframeCheck =
                    containerRef.current?.querySelector("iframe");
                  setStatus(iframeCheck ? "loaded" : "error");
                }
              }, 2000);
            }
          }
        } else {
          // Load Twitter widget script
          const script = document.createElement("script");
          script.src = "https://platform.twitter.com/widgets.js";
          script.async = true;
          script.charset = "utf-8";

          script.onload = () => {
            if (window.twttr && window.twttr.widgets && isMounted) {
              window.twttr.widgets.load(containerRef.current).then(() => {
                if (isMounted) {
                  setTimeout(() => {
                    const iframe =
                      containerRef.current?.querySelector("iframe");
                    setStatus(iframe ? "loaded" : "error");
                  }, 1000);
                }
              });
            }
          };

          script.onerror = () => {
            if (isMounted) setStatus("error");
          };

          // Only add if not already present
          if (!document.getElementById("twitter-wjs")) {
            script.id = "twitter-wjs";
            document.head.appendChild(script);
          } else {
            // Script exists, just trigger load
            if (window.twttr && window.twttr.widgets) {
              window.twttr.widgets.load(containerRef.current).then(() => {
                if (isMounted) {
                  setTimeout(() => {
                    const iframe =
                      containerRef.current?.querySelector("iframe");
                    setStatus(iframe ? "loaded" : "error");
                  }, 1000);
                }
              });
            }
          }
        }
      } catch (err) {
        console.error("Error rendering tweet:", err);
        if (isMounted) setStatus("error");
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(renderTweet, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [url, tweetId]);

  // Error or fallback state - show a nice card with link
  if (status === "error") {
    return (
      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl p-5 border border-gray-700 hover:border-blue-500/50 transition-all">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-blue-500/20 rounded-full">
            <Twitter className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-gray-300 font-medium">@{username || "user"}</p>
            <p className="text-gray-500 text-xs">Twitter/X Post</p>
          </div>
        </div>
        <p className="text-gray-400 text-sm mb-4 leading-relaxed">
          This tweet cannot be embedded directly. Click below to view it on
          Twitter/X.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-medium w-full justify-center"
        >
          <ExternalLink className="w-4 h-4" />
          View on Twitter/X
        </a>
      </div>
    );
  }

  return (
    <div className="twitter-embed-container min-h-[250px] relative">
      {/* Loading State */}
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800/50 rounded-xl border border-gray-700">
          <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mb-3" />
          <span className="text-gray-400 text-sm">Loading tweet...</span>
        </div>
      )}

      {/* Tweet Container */}
      <div
        ref={containerRef}
        className={`twitter-embed transition-opacity duration-300 ${
          status === "loading" ? "opacity-0" : "opacity-100"
        }`}
      />
    </div>
  );
};

// Main component to display all Twitter reviews
const TwitterReviews = ({ reviews = [] }) => {
  const [visibleCount, setVisibleCount] = useState(3);

  // Filter out invalid URLs
  const validReviews = reviews.filter((url) => {
    if (!url || url.trim() === "") return false;
    const twitterRegex =
      /^https?:\/\/(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/\d+/;
    return twitterRegex.test(url);
  });

  if (validReviews.length === 0) {
    return null;
  }

  const showMore = () => {
    setVisibleCount((prev) => Math.min(prev + 3, validReviews.length));
  };

  return (
    <div className="mt-16">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary/20 rounded-lg">
          <MessageCircle className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">What People Say</h2>
          <p className="text-gray-400 text-sm">Reviews from Twitter/X</p>
        </div>
        <span className="ml-auto px-3 py-1 bg-blue-600/20 text-blue-400 text-sm rounded-full font-medium">
          {validReviews.length}{" "}
          {validReviews.length === 1 ? "review" : "reviews"}
        </span>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {validReviews.slice(0, visibleCount).map((url, index) => (
          <div
            key={`review-${index}-${url.slice(-10)}`}
            className="transform transition-all duration-300 hover:scale-[1.01]"
          >
            <TwitterEmbed url={url} />
          </div>
        ))}
      </div>

      {/* Show More Button */}
      {visibleCount < validReviews.length && (
        <div className="flex justify-center mt-10">
          <button
            onClick={showMore}
            className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-3 font-medium"
          >
            <span>Show More Reviews</span>
            <span className="px-2 py-0.5 bg-gray-700 rounded text-sm">
              {validReviews.length - visibleCount} more
            </span>
          </button>
        </div>
      )}

      {/* Attribution */}
      <p className="text-center text-gray-500 text-xs mt-8">
        Reviews sourced from Twitter/X posts • Click on any tweet to view the
        full conversation
      </p>
    </div>
  );
};

export default TwitterReviews;
