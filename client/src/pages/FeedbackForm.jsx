import React, { useMemo, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { StarIcon, MessageSquare, User } from "lucide-react";
import toast from "react-hot-toast";
import ButtonLoader from "../components/ButtonLoader";
import { useFormValidation } from "../hooks/useFormValidation.js";
import { errorId } from "../lib/validation.js";

const FeedbackForm = () => {
  const { axios, user, getAuthHeaders } = useAppContext();
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const formId = "feedback";
  const schema = useMemo(
    () => ({
      rating: validateRating,
      message: validateMessage,
    }),
    []
  );

  const { values, errors, touched, getInputProps, setFieldValue, touchField, validateForm, reset } = useFormValidation({
    formId,
    initialValues: { rating: 0, message: "" },
    schema,
  });

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
    const { isValid } = validateForm();
    if (!isValid) return;

    setLoading(true);
    try {
      const { data } = await axios.post(
        "/api/user/submit-feedback",
        { rating: values.rating, message: values.message, userId: user.id },
        { headers: getAuthHeaders() }
      );
      reset({ rating: 0, message: "" });
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
              <div className="flex gap-2 sm:gap-3" role="radiogroup" aria-label="Rating (1 to 5 stars)">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    size={28}
                    role="radio"
                    aria-checked={(hoverRating || values.rating) === star}
                    tabIndex={0}
                    onClick={() => { setFieldValue("rating", star, { touch: true }); touchField("rating"); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setFieldValue("rating", star, { touch: true });
                        touchField("rating");
                      }
                    }}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className={`cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 ${
                      (hoverRating || values.rating) >= star
                        ? "text-amber-400 fill-amber-400"
                        : ""
                    }`}
                    style={{
                      color: (hoverRating || values.rating) >= star ? undefined : "var(--text-muted)",
                    }}
                    title={`Rate ${star} star${star > 1 ? "s" : ""}`}
                  />
                ))}
              </div>
              {touched.rating && errors.rating && (
                <p id={errorId(formId, "rating")} className="field-error-text" role="alert">
                  {errors.rating}
                </p>
              )}
            </div>

            {/* Message */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor={`${formId}-message`} style={{ color: "var(--text-secondary)" }}>
                Your Feedback
              </label>
              <textarea
                rows={5}
                placeholder="Share your experience with us..."
                className="input-field resize-none"
                {...getInputProps("message")}
                title="Tell us about your experience with TicketFlicks"
              />
              {touched.message && errors.message && (
                <p id={errorId(formId, "message")} className="field-error-text" role="alert">
                  {errors.message}
                </p>
              )}
              {!errors.message && <p className="field-help-text">Optional, max 500 characters</p>}
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

const validateRating = (value) => {
  const n = typeof value === "number" ? value : Number(value);
  if (!n) return "Rating is required";
  if (Number.isNaN(n)) return "Rating must be a number";
  if (n < 1 || n > 5) return "Rating must be between 1 and 5";
  return "";
};

const validateMessage = (value) => {
  const v = (value || "").toString();
  if (v.length > 500) return "Feedback must be at most 500 characters";
  return "";
};
