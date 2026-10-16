import { useState, useMemo } from 'react'
import { getStoredReviews, saveNewReview, getRatingSummary } from '../data/reviews'
import { trackReviewSubmission } from '../lib/telegram'

export default function ReviewsSection({ therapistId, therapistName, accent }) {
  const [reviews, setReviews] = useState(() => getStoredReviews(therapistId))
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Form states
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [clientName, setClientName] = useState('')
  const [refCode, setRefCode] = useState('')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const summary = useMemo(() => getRatingSummary(reviews), [reviews])

  const RATING_DESCRIPTIONS = {
    1: '1 Star — Poor experience',
    2: '2 Stars — Below expectations',
    3: '3 Stars — Average session',
    4: '4 Stars — Very good & professional',
    5: '5 Stars — Exceptional & highly recommended',
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!comment.trim() && !clientName.trim()) return

    setIsSubmitting(true)

    const newReview = {
      name: clientName.trim() || 'Anonymous Client',
      rating,
      refCode: refCode.trim(),
      comment: comment.trim(),
      sessionType: 'Verified Client Session',
    }

    // 1. Save to local storage and update UI
    const updated = saveNewReview(therapistId, newReview)
    setReviews(updated)

    // 2. Send instant notification to Telegram
    try {
      await trackReviewSubmission({
        therapistName,
        clientName: newReview.name,
        rating,
        refCode: newReview.refCode,
        comment: newReview.comment,
      })
    } catch (err) {
      console.warn('Telegram review track error:', err)
    }

    setIsSubmitting(false)
    setSubmitted(true)
    setComment('')
    setClientName('')
    setRefCode('')

    // Auto-close form after a few seconds
    setTimeout(() => {
      setIsFormOpen(false)
      setSubmitted(false)
    }, 3500)
  }

  return (
    <div className="reviews-section" id="reviews-section">
      <div className="reviews-header-block">
        <div className="reviews-score-col">
          <div className="reviews-big-rating">{summary.average.toFixed(1)}</div>
          <div className="reviews-score-meta">
            <div className="reviews-stars-row" aria-label={`${summary.average} out of 5 stars`}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className="review-star filled">★</span>
              ))}
            </div>
            <div className="reviews-count-label">
              Based on {summary.count} verified client ratings
            </div>
          </div>
        </div>

        <div className="reviews-actions-col">
          <button
            type="button"
            className="write-review-btn"
            onClick={() => setIsFormOpen((prev) => !prev)}
            style={{ borderColor: accent ? `${accent}66` : undefined }}
          >
            {isFormOpen ? '✕ Close Review Form' : '✍️ Write a Review'}
          </button>
        </div>
      </div>

      {/* Review Submission Form Drawer / Card */}
      {isFormOpen && (
        <div className="review-form-card">
          {submitted ? (
            <div className="review-success-msg">
              <div className="review-success-icon">✓</div>
              <h4>Thank you for your review!</h4>
              <p>Your feedback for <strong>{therapistName}</strong> has been received by concierge management for verification.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="review-form-header">
                <h4>Rate your session with {therapistName}</h4>
                <p>Private &amp; discreet client feedback. Only your first name or initials are shown.</p>
              </div>

              {/* Star Picker */}
              <div className="review-star-picker-row">
                <span className="review-form-label">Your Rating:</span>
                <div className="star-picker-stars" onMouseLeave={() => setHoverRating(0)}>
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const activeVal = hoverRating || rating
                    const isFilled = starVal <= activeVal
                    return (
                      <button
                        key={starVal}
                        type="button"
                        className={`star-pick-btn ${isFilled ? 'active' : ''}`}
                        onMouseEnter={() => setHoverRating(starVal)}
                        onClick={() => setRating(starVal)}
                        aria-label={`Rate ${starVal} stars`}
                      >
                        ★
                      </button>
                    )
                  })}
                </div>
                <span className="star-rating-hint">
                  {RATING_DESCRIPTIONS[hoverRating || rating]}
                </span>
              </div>

              <div className="review-form-grid">
                <div className="review-field">
                  <label htmlFor="review-client-name">Your Name / Initials</label>
                  <input
                    id="review-client-name"
                    type="text"
                    placeholder="e.g. David M. or Anonymous"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    maxLength={32}
                  />
                  <span className="field-hint">Initials recommended for discretion</span>
                </div>

                <div className="review-field">
                  <label htmlFor="review-ref-code">Booking Reference Code (Optional)</label>
                  <input
                    id="review-ref-code"
                    type="text"
                    placeholder="e.g. GS-89A742"
                    value={refCode}
                    onChange={(e) => setRefCode(e.target.value.toUpperCase())}
                    maxLength={16}
                  />
                  <span className="field-hint">Awards your review a &ldquo;✓ Verified Client&rdquo; badge</span>
                </div>
              </div>

              <div className="review-field full-width">
                <label htmlFor="review-comments">Session Feedback &amp; Review</label>
                <textarea
                  id="review-comments"
                  rows={3}
                  placeholder={`Share your experience with ${therapistName} (punctuality, studio ambiance, professionalism...)`}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />
              </div>

              <div className="review-form-footer">
                <button
                  type="submit"
                  className="submit-review-btn"
                  disabled={isSubmitting || !comment.trim()}
                >
                  {isSubmitting ? 'Submitting…' : 'Publish Verified Review'}
                </button>
                <button
                  type="button"
                  className="cancel-review-btn"
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Reviews Cards List */}
      <div className="reviews-list">
        {reviews.map((rev) => (
          <div key={rev.id} className="review-card">
            <div className="review-card-top">
              <div className="review-author-meta">
                <span className="review-author-name">{rev.name}</span>
                {rev.verified && (
                  <span className="review-verified-badge" title="Verified Meetup Booking">
                    <span className="verified-check">✓</span> Verified Client
                  </span>
                )}
              </div>
              <span className="review-date">{rev.date}</span>
            </div>

            <div className="review-card-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`review-card-star ${star <= rev.rating ? 'filled' : 'empty'}`}
                >
                  ★
                </span>
              ))}
              <span className="review-card-session-type">{rev.sessionType}</span>
            </div>

            <p className="review-comment-text">&ldquo;{rev.comment}&rdquo;</p>
          </div>
        ))}
      </div>
    </div>
  )
}

