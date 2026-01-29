import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { StarIcon } from "lucide-react";
import toast from "react-hot-toast";
import ButtonLoader from "../components/ButtonLoader";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";

const FeedbackForm = () => {
  const { axios, user, getAuthHeaders } = useAppContext();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="relative my-40 mb-60 w-full max-md:w-[85%] max-w-xl mx-auto border bg-primary/10 border-primary/20 rounded-lg p-8">
        <BlurCircle bottom="-100px" />
        <BlurCircle top="-100px" right="0px" />
        <h1 className="text-center text-2xl font-semibold underline text-primary mb-6">
          Share Your Experience
        </h1>
        <p className="text-center text-gray-400">
          Please log in to submit feedback.
        </p>
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
        {
          rating,
          message,
          userId: user.id,
        },
        {
          headers: getAuthHeaders(),
        }
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
    <div className="relative my-40 mb-60 w-full max-md:w-[85%] max-w-xl mx-auto border bg-primary/10 border-primary/20 rounded-lg p-8">
      <BlurCircle bottom="-100px" />
      <BlurCircle top="-100px" right="0px" />
      <h1 className="text-center text-2xl font-semibold underline text-primary mb-6">
        Share Your Experience
      </h1>

      <form className="space-y-6 text-white mt-10" onSubmit={handleSubmit}>
        <div className="flex justify-between items-center max-md:block">
          <label className="text-lg max-md:mb-10 font-medium text-white/80">Username:</label>
          <div className="relative group w-[80%] max-md:w-full max-md:mt-2">
            <input
              type="text"
              readOnly
              className="w-full px-4 py-2 bg-white/10 rounded-md text-white border border-white/20 cursor-not-allowed transition-all duration-200"
              value={user.name || "Guest User"}
              title="Your account username"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <label className="text-lg font-medium text-white/80">Rating:</label>
          <div className="flex gap-3 min-md:ml-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                size={28}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className={`cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 ${
                  (hoverRating || rating) >= star
                    ? "text-yellow-400 fill-amber-300"
                    : "text-white/30"
                }`}
                title={`Rate ${star} star${star > 1 ? "s" : ""}`}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="text-lg font-medium text-white/80">Your Feedback:</label>
          <div className="relative group">
            <textarea
              rows={5}
              placeholder="Share your experience with us..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white resize-none mt-2 transition-all duration-200 hover:bg-white/15 focus:outline-none focus:border-primary/80"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              title="Tell us about your experience with TicketFlicks"
            ></textarea>
            <div className="absolute right-3 bottom-3 w-5 h-5 text-white/40">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 text-lg bg-primary/70 hover:bg-primary-dull flex items-center justify-center transition-all duration-200 rounded-md border border-primary/90 font-medium active:scale-95 hover:shadow-lg hover:shadow-primary/20"
          title={loading ? "Submitting your feedback..." : "Submit your feedback to help us improve"}
        >
          {loading ? <ButtonLoader /> : <>Submit Feedback</>}
        </button>
      </form>
    </div>
  );
};

export default FeedbackForm;
