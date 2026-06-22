import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Heart, MapPin, Phone, Star, Navigation, MessageCircle, Plus, Trash2, Tag, Copy, Check, X, Filter, TrendingUp } from "lucide-react";
import { validateReview } from "../utils/validators";

export default function BusinessDetail({ business, user, onBack, onAskAI, isFavorited, onToggleFavorite }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddReview, setShowAddReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [deals, setDeals] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [filterRating, setFilterRating] = useState('all');
  const [formErrors, setFormErrors] = useState({});
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: '',
    author: user.id
  });

  useEffect(() => {
    fetchReviews();
    ratings();
    review_count();
    fetchDeals();
  }, [business?.id]);

  // Listen for voice agent commands via custom events
  useEffect(() => {
    const handleRefreshReviews = (event) => {
      if (event.detail.business_id === business?.id) {
        console.log('🔄 Voice agent triggered review refresh');
        fetchReviews();
        ratings();
        review_count();
      }
    };

    const handleSortFilterReviews = (event) => {
      if (event.detail.business_id === business?.id) {
        console.log('🔧 Voice agent updating review display:', event.detail);
        if (event.detail.sort_by) {
          setSortBy(event.detail.sort_by);
        }
        if (event.detail.filter_rating !== undefined) {
          setFilterRating(event.detail.filter_rating === null ? 'all' : event.detail.filter_rating.toString());
        }
      }
    };

    window.addEventListener('refresh-reviews', handleRefreshReviews);
    window.addEventListener('sort-filter-reviews', handleSortFilterReviews);

    return () => {
      window.removeEventListener('refresh-reviews', handleRefreshReviews);
      window.removeEventListener('sort-filter-reviews', handleSortFilterReviews);
    };
  }, [business?.id]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/get_reviews/${business.id}`);
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeals = async () => {
    try {
      const response = await fetch(`http://localhost:8000/deals/business/${business.id}`);
      const data = await response.json();
      setDeals(data);
    } catch (error) {
      console.error('Error fetching deals:', error);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isReviewValid = Object.keys(validateReview(newReview)).length === 0;

  const handleSubmitReview = async () => {
    // Validate first
    const errors = validateReview(newReview);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return; // Don't submit if errors
    }

    try {
      const response = await fetch('http://localhost:8000/add_reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth0-User-ID': user.sub // Pass Auth0 ID
        },
        body: JSON.stringify({
          business: business.id,
          rating: newReview.rating,
          comment: newReview.comment.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Show backend errors
        if (data.errors) {
          const backendErrors = {};
          data.errors.forEach(err => {
            if (err.includes('rating')) backendErrors.rating = err;
            else if (err.includes('comment')) backendErrors.comment = err;
            else backendErrors.general = err;
          });
          setFormErrors(backendErrors);
        }
        return;
      }

      // Success - refresh and close
      await fetchReviews();
      setShowAddReview(false);
      setNewReview({ rating: 0, comment: '', author: user.id });
      setFormErrors({});
    } catch (error) {
      console.error('Error adding review:', error);
      setFormErrors({ general: 'Failed to submit review. Please try again.' });
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const response = await fetch(`http://localhost:8000/get_reviews/${business.id}`);
      const data = await response.json();

      if (response.ok) {
        await fetchReviews();
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  // Calculate review statistics
  const reviewStats = useMemo(() => {
    if (reviews.length === 0) return null;

    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      ratingCounts[review.rating] = (ratingCounts[review.rating] || 0) + 1;
    });

    const total = reviews.length;
    const recommended = reviews.filter(r => r.rating >= 4).length;

    return {
      distribution: Object.entries(ratingCounts)
        .map(([rating, count]) => ({
          rating: parseInt(rating),
          count,
          percentage: (count / total) * 100
        }))
        .reverse(),
      recommendedPercentage: (recommended / total) * 100
    };
  }, [reviews]);

  // Filter and sort reviews
  const filteredAndSortedReviews = useMemo(() => {
    let filtered = [...reviews];

    // Apply rating filter
    if (filterRating !== 'all') {
      filtered = filtered.filter(review => review.rating === parseInt(filterRating));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortBy === 'highest') {
        return b.rating - a.rating;
      } else if (sortBy === 'lowest') {
        return a.rating - b.rating;
      }
      return 0;
    });

    return filtered;
  }, [reviews, sortBy, filterRating]);

  if (!business) return null;

  const StarRating = ({ rating, interactive = false, onChange }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`w-5 h-5 ${
            star <= rating
              ? 'fill-green-700 text-green-700'
              : 'text-gray-300'
          } ${interactive ? 'cursor-pointer hover:text-green-700' : ''}`}
          onClick={() => interactive && onChange(star)}
        />
      ))}
    </div>
  );

  const ratings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/get_rating/${business.id}`);
      const data = await response.json();
      setRating(data.average_rating);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const review_count = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/get_review_count/${business.id}`);
      const data = await response.json();
      setReviewCount(data.review_count);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-15">
      {/* Main Content */}
      <div className={`${showMap ? 'lg:w-1/2' : 'w-full'} transition-all duration-300`}>
        <div className="mx-auto">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-green-700 transition-colors mb-6 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Businesses
          </button>

          {/* Deals Section */}
          {deals.length > 0 && (
            <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-6 mb-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-bold text-white">Active Deals & Offers</h2>
              </div>
              <div className="space-y-4">
                {deals.map((deal) => (
                  <div key={deal.id} className="bg-white rounded-lg p-4 shadow-md">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800">{deal.title}</h3>
                        <p className="text-gray-600 mt-1">{deal.description}</p>
                        {deal.end_date && (
                          <p className="text-sm text-gray-500 mt-2">
                            Valid until: {new Date(deal.end_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {(deal.discount_percentage || deal.discount_amount) && (
                        <div className="bg-red-100 text-red-700 px-3 py-1 rounded-lg font-bold ml-4">
                          {deal.discount_percentage ? `${deal.discount_percentage}% OFF` : `$${deal.discount_amount} OFF`}
                        </div>
                      )}
                    </div>
                    {deal.code && (
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex-1 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg px-4 py-2">
                          <span className="font-mono font-bold text-gray-800">{deal.code}</span>
                        </div>
                        <button
                          onClick={() => copyCode(deal.code)}
                          className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                        >
                          {copiedCode === deal.code ? (
                            <>
                              <Check className="w-4 h-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy Code
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hero Image */}
          <div className="relative h-80 rounded-xl overflow-hidden mb-8 border border-gray-200">
            <img src={business.image || "/placeholder.svg"} alt={business.name} className="w-full h-full object-cover" />
          </div>

          {/* Business Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 text-transparent bg-clip-text mb-2">{business.name}</h1>
            <p className="text-lg text-gray-600 mb-4">{business.category}</p>

            {/* Rating and Stats */}
            <div className="flex flex-wrap justify-center gap-10 mb-6">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-green-700 text-green-700" />
                  <span className="text-2xl font-bold text-black">{rating?.toFixed(1)}</span>
                </div>
                <span className="text-black">({reviewCount} reviews)</span>
              </div>
              <div className="flex items-center bg-gradient-to-r from-green-600 to-green-700 text-transparent bg-clip-text gap-2">
                <MapPin className="w-5 h-5 text-green-700" />
                <span>{business.distance}</span>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowMap(!showMap)}
                  className="flex items-center justify-center gap-2 bg-white hover:shadow-md hover:scale-105 hover:shadow-green-500 text-green-700 p-3 rounded-lg font-semibold transition-colors"
                >
                  <Navigation className="w-5 h-5" />
                  <div className="overflow-hidden whitespace-nowrap">
                    {showMap ? 'Hide Map' : 'Get Directions'}
                  </div>
                </button>
              </div>
              <div>
                <button
                  onClick={() => onToggleFavorite(business.id)}
                  className="group flex items-center gap-2 hover:scale-105 p-3 rounded-lg font-semibold transition-all duration-300 hover:bg-gray-100"
                >
                  <Heart className={`w-5 h-5 transition-colors ${isFavorited ? 'fill-red-500 text-red-500' : 'text-black hover:text-green-700'}`} />
                  <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 text-black whitespace-nowrap">
                    {isFavorited ? 'Unfavorite' : 'Favorite'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Business Info */}
          <div className="rounded-xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white border rounded-xl p-6">
              <h2 className="text-xl font-semibold text-black mb-6">Business Information</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Address</p>
                  <p className="text-gray-600 flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
                    {business.address}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phone</p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-green-700" />
                    <a href={`tel:${business.phone}`} className="hover:text-green-700 text-gray-600 transition-colors">
                      {business.phone}
                    </a>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">About</p>
                  <p className="leading-relaxed text-gray-600">{business.description}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-6">
              <h2 className="text-xl text-black font-semibold mb-6">Hours & Highlights</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Hours</p>
                  <div className="space-y-1 text-gray-600">
                    <p>Mon - Fri: 7:00 AM - 6:00 PM</p>
                    <p>Sat - Sun: 8:00 AM - 5:00 PM</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Why we love this place</p>
                  <ul className="space-y-2 text-gray-600 flex justify-center flex-col">
                    <li className="flex items-center gap-2">✓ Locally sourced products</li>
                    <li className="flex items-center gap-2">✓ Community focused</li>
                    <li className="flex items-center gap-2">✓ High quality service</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="rounded-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-green-600 to-green-700 text-transparent bg-clip-text">Customer Reviews</h2>
              <button
                onClick={() => setShowAddReview(!showAddReview)}
                className="group flex items-center font-semibold justify-center hover:gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white p-3 shadow-lg hover:shadow-green-500/50 hover:scale-105 rounded-full transition-all duration-300"
              >
                <div className="flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
                  Add Review
                </span>
              </button>
            </div>

            {/* Review Statistics */}
            {reviewStats && (
              <div className="bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-xl p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Overall Rating */}
                  <div className="flex flex-col items-center justify-center border-r border-green-200 md:border-r-0 md:border-b-0">
                    <div className="text-5xl font-bold text-green-700 mb-2">{rating.toFixed(1)}</div>
                    <StarRating rating={Math.round(rating)} />
                    <p className="text-sm text-gray-600 mt-2">{reviewCount} reviews</p>
                  </div>

                  {/* Rating Distribution */}
                  <div className="md:col-span-2 space-y-2">
                    {reviewStats.distribution.map(({ rating: starRating, count, percentage }) => (
                      <div key={starRating} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700 w-12">{starRating} star</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-green-600 to-green-700 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                      </div>
                    ))}

                    {/* Recommended Badge */}
                    {reviewStats.recommendedPercentage >= 70 && (
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-green-200">
                        <TrendingUp className="w-5 h-5 text-green-700" />
                        <span className="text-sm font-semibold text-green-700">
                          {reviewStats.recommendedPercentage.toFixed(0)}% of customers recommend this business
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sort and Filter Controls */}
            <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-gray-200">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-green-700 focus:border-transparent bg-white"
                >
                  <option value="recent">Most Recent</option>
                  <option value="highest">Highest Rated</option>
                  <option value="lowest">Lowest Rated</option>
                </select>
              </div>

              {/* Rating Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterRating('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterRating === 'all'
                      ? 'bg-green-700 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-green-700'
                  }`}
                >
                  All
                </button>
                {[5, 4, 3, 2, 1].map((stars) => (
                  <button
                    key={stars}
                    onClick={() => setFilterRating(stars.toString())}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                      filterRating === stars.toString()
                        ? 'bg-green-700 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-green-700'
                    }`}
                  >
                    {stars} <Star className="w-3 h-3 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            {showAddReview && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold mb-4 text-black">Write a Review</h3>

                {formErrors.general && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {formErrors.general}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-600">Rating</label>
                    <StarRating
                      rating={newReview.rating}
                      interactive={true}
                      onChange={(rating) => {
                        setNewReview({ ...newReview, rating })
                        setFormErrors({ ...formErrors, rating: null }) // Clear error on change
                      }}
                    />
                    {formErrors.rating && (
                      <p className="text-red-600 text-sm mt-1">{formErrors.rating}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-600">Your Review</label>
                    <textarea
                      value={newReview.comment}
                      onChange={(e) => {
                        setNewReview({ ...newReview, comment: e.target.value })
                        setFormErrors({ ...formErrors, comment: null }) // Clear error on change
                      }}
                      rows="4"
                      maxLength={500}
                      className={`w-full px-4 py-2 border rounded-lg text-gray-600 focus:ring-2 focus:ring-green-700 focus:border-transparent ${
                        formErrors.comment ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Share your experience... (10-500 characters)"
                    />
                    <div className="flex justify-between items-center mt-1">
                      {formErrors.comment && (
                        <p className="text-red-600 text-sm">{formErrors.comment}</p>
                      )}
                      <p className="text-gray-500 text-sm ml-auto">{newReview.comment.length}/500</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowAddReview(false)
                        setFormErrors({})
                      }}
                      className="px-4 py-2 border text-green-700 border-gray-300 hover:scale-105 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitReview}
                      disabled={!isReviewValid}
                      className="px-4 py-2 bg-green-700 text-white rounded-lg bg-gradient-to-r hover:scale-105 from-green-600 to-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      Submit Review
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {loading ? (
                <p className="text-center text-gray-500">Loading reviews...</p>
              ) : filteredAndSortedReviews.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {filterRating !== 'all'
                      ? `No ${filterRating}-star reviews yet.`
                      : 'No reviews yet. Be the first to review!'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-sm text-gray-600 mb-4">
                    Showing {filteredAndSortedReviews.length} of {reviews.length} reviews
                  </div>
                  {filteredAndSortedReviews.map((review) => (
                    <div key={review.id} className="bg-gray-50 rounded-xl py-6 px-3 last:border-b-0 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-green-700">{review.user_name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StarRating rating={review.rating} />
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="text-red-600 text-sm hover:underline ml-4"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="leading-relaxed text-gray-600">{review.comment}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Map Sidebar */}
      {showMap && (
        <div className="lg:w-1/2 w-full h-[500px] lg:h-screen overflow-y-scroll lg:sticky lg:top-4">
          <div className="relative h-full rounded-xl overflow-scroll border-2 border-gray-200 shadow-xl">
            <button
              onClick={() => setShowMap(false)}
              className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 z-50 shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe
              src={`https://www.google.com/maps?q=${business.latitude},${business.longitude}&output=embed`}
              className="w-full h-full"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      )}
    </div>
  );
}
