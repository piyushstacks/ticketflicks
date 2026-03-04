import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { MessageCircle, Heart, User, Send, CornerDownRight } from 'lucide-react';
import toast from 'react-hot-toast';

const UserReviews = ({ movieId }) => {
  const { axios, getToken, user } = useAppContext();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState({});

  useEffect(() => {
    fetchReviews();
  }, [movieId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/reviews/${movieId}`);
      if (data.success) {
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReplies = async (reviewId) => {
    try {
      const { data } = await axios.get(`/api/reviews/replies/${reviewId}`);
      if (data.success) {
        setReplies(prev => ({ ...prev, [reviewId]: data.replies }));
      }
    } catch (error) {
      console.error('Error loading replies:', error);
    }
  };

  const handlePostReview = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Please login to post a review');
    if (!newReview.trim()) return toast.error('Review cannot be empty');

    try {
      const token = await getToken();
      const { data } = await axios.post(
        `/api/reviews/${movieId}`,
        { review: newReview },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        setNewReview('');
        fetchReviews();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post review');
    }
  };

  const handlePostReply = async (reviewId) => {
    if (!user) return toast.error('Please login to reply');
    if (!replyText.trim()) return toast.error('Reply cannot be empty');

    try {
      const token = await getToken();
      const { data } = await axios.post(
        `/api/reviews/${movieId}`,
        { review: replyText, parent_review_id: reviewId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success('Reply posted');
        setReplyText('');
        setReplyingTo(null);
        fetchReviews();
        loadReplies(reviewId);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post reply');
    }
  };

  const handleLike = async (reviewId) => {
    if (!user) return toast.error('Please login to like');

    try {
      const token = await getToken();
      const { data } = await axios.post(
        `/api/reviews/${reviewId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        // Optimistically update UI
        setReviews(reviews.map(r => {
          if (r._id === reviewId) {
            const isLiked = !r.likes?.includes(user.id);
            const newLikes = isLiked 
              ? [...(r.likes || []), user.id] 
              : (r.likes || []).filter(id => id !== user.id);
            return { ...r, likes: newLikes };
          }
          return r;
        }));

        // Also update replies if needed
        const newReplies = { ...replies };
        Object.keys(newReplies).forEach(key => {
          newReplies[key] = newReplies[key].map(r => {
            if (r._id === reviewId) {
              const isLiked = !r.likes?.includes(user.id);
              const newLikes = isLiked 
                ? [...(r.likes || []), user.id] 
                : (r.likes || []).filter(id => id !== user.id);
              return { ...r, likes: newLikes };
            }
            return r;
          });
        });
        setReplies(newReplies);
      }
    } catch (error) {
      toast.error('Failed to like');
    }
  };

  const renderReviewItem = (review, isReply = false) => {
    const isLiked = review.likes?.includes(user?.id);
    const likeCount = review.likes?.length || 0;
    
    return (
      <div key={review._id} className={`flex gap-4 p-4 ${isReply ? 'ml-12 mt-2 border-l border-border bg-bg-elevated rounded-xl' : 'border-b border-border'}`}>
        <div className="w-10 h-10 rounded-full bg-border flex items-center justify-center shrink-0">
          <User className="w-6 h-6 text-text-muted" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-text-primary truncate">
              {review.user_id?.name || 'Anonymous User'}
            </span>
            <span className="text-sm text-text-muted">
              · {new Date(review.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-text-primary whitespace-pre-wrap break-words">{review.review}</p>
          
          <div className="flex items-center gap-6 mt-3 text-text-muted">
            <button 
              onClick={() => handleLike(review._id)}
              className="flex items-center gap-2 hover:text-accent transition group"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-accent text-accent' : 'group-hover:fill-accent/20'}`} />
              <span className={`text-sm ${isLiked ? 'text-accent' : ''}`}>{likeCount > 0 ? likeCount : ''}</span>
            </button>
            
            {!isReply && (
              <button 
                onClick={() => {
                  if (replyingTo === review._id) setReplyingTo(null);
                  else {
                    setReplyingTo(review._id);
                    if (!replies[review._id] && review.replyCount > 0) {
                      loadReplies(review._id);
                    }
                  }
                }}
                className="flex items-center gap-2 hover:text-blue-500 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">{review.replyCount > 0 ? review.replyCount : ''}</span>
              </button>
            )}
          </div>

          {/* Reply Input */}
          {replyingTo === review._id && (
            <div className="mt-4 flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Post your reply"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="input-field py-2"
                />
              </div>
              <button 
                onClick={() => handlePostReply(review._id)}
                className="btn-primary py-2 px-4"
                disabled={!replyText.trim()}
              >
                Reply
              </button>
            </div>
          )}

          {/* Child Replies */}
          {!isReply && (replies[review._id] || (replyingTo === review._id && review.replyCount > 0)) && (
            <div className="mt-2 space-y-2">
              {replies[review._id]?.map(reply => renderReviewItem(reply, true))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) return null;

  return (
    <div className="mt-16 max-w-3xl">
      <h2 className="text-2xl font-semibold mb-6 text-text-primary flex items-center gap-2">
        <MessageCircle className="w-6 h-6 text-accent" />
        Community Reviews
      </h2>

      {/* Main Review Input box, styled like a Tweet composer */}
      <div className="flex gap-4 mb-8 glass-card p-4 rounded-xl">
        <div className="w-12 h-12 rounded-full bg-border flex items-center justify-center shrink-0">
          <User className="w-6 h-6 text-text-muted" />
        </div>
        <form onSubmit={handlePostReview} className="flex-1 flex flex-col gap-3">
          <textarea
            value={newReview}
            onChange={(e) => setNewReview(e.target.value)}
            placeholder="What did you think of the movie?"
            className="w-full bg-transparent border-none outline-none resize-none text-text-primary placeholder:text-text-muted text-lg min-h-[80px]"
          />
          <div className="flex justify-between items-center border-t border-border pt-3">
            <span className="text-xs text-text-muted">Stay respectful and keep it spoiler-free!</span>
            <button 
              type="submit" 
              className="btn-primary py-2 px-6 rounded-full font-bold"
              disabled={!newReview.trim()}
            >
              Post
            </button>
          </div>
        </form>
      </div>

      {/* Reviews List */}
      <div className="bg-bg-card border border-border rounded-xl mb-12">
        {reviews.length > 0 ? (
          <div className="flex flex-col">
            {reviews.map(review => renderReviewItem(review))}
          </div>
        ) : (
          <div className="p-8 text-center text-text-muted border-b border-border">
            No reviews yet. Be the first to share your thoughts!
          </div>
        )}
      </div>
    </div>
  );
};

export default UserReviews;
