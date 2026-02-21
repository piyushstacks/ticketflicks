import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { StarIcon, MessageSquare, User } from "lucide-react";
import toast from "react-hot-toast";
import ButtonLoader from "../components/ButtonLoader";

const FeedbackForm = () => {
  const { axios, user, getAuthHeaders } = useAppContext();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-20 pt-24"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <div className="card p-8 text-center max-w-md w-full">
          <MessageSquare className="w-10 h-10 mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
          <h1 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            Share Your Experience
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Please log in to submit feedback.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return toast.error("Please provide a rating.");

    setLoading(true);
    try {
      const { data } = await axios.post(
        "/api/user/submit-feedback",
        { rating, message, userId: user.id },
        { headers: getAuthHeaders() }
      );
      setRating(0);
      setMessage("");
      toast.success(data.message);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error(error.response?.data?.message || "Unable to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-20 pt-24"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div className="w-full max-w-lg">
        <div className="card p-6 sm:p-8">
          <h1
            className="text-xl sm:text-2xl font-bold mb-6 text-center"
            style={{ color: "var(--text-primary)" }}
          >
            Share Your Experience
          </h1>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <input
                  type="text"
                  readOnly
                  className="input-field pl-10 cursor-not-allowed opacity-60"
                  value={user.name || "Guest User"}
                  title="Your account username"
                />
              </div>
            </div>

            {/* Rating */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Rating
              </label>
              <div className="flex gap-2 sm:gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    size={28}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className={`cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 ${
                      (hoverRating || rating) >= star
                        ? "text-amber-400 fill-amber-400"
                        : ""
                    }`}
                    style={{
                      color: (hoverRating || rating) >= star ? undefined : "var(--text-muted)",
                    }}
                    title={`Rate ${star} star${star > 1 ? "s" : ""}`}
                  />
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Your Feedback
              </label>
              <textarea
                rows={5}
                placeholder="Share your experience with us..."
                className="input-field resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                title="Tell us about your experience with TicketFlicks"
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 text-sm flex items-center justify-center"
              disabled={loading}
            >
              {loading ? <ButtonLoader /> : "Submit Feedback"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackForm;
