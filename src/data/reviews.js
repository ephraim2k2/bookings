// Reviews and Ratings Data Model

export const DEFAULT_REVIEWS = {
  kate: [
    {
      id: 'rev-k1',
      name: 'David M.',
      rating: 5,
      date: '3 days ago',
      verified: true,
      refCode: 'GS-89A742',
      sessionType: 'In-call Private Suite',
      comment:
        'Kate’s studio was immaculate, quiet, and deeply relaxing. She was punctual, attentive, and made me feel completely comfortable from the moment I arrived. Will definitely book again.',
    },
    {
      id: 'rev-k2',
      name: 'Tyler K.',
      rating: 5,
      date: '1 week ago',
      verified: true,
      refCode: 'GS-44C198',
      sessionType: 'Out-call Session',
      comment:
        'One of the best therapeutic sessions I’ve had in a long time. Very discreet and private communication. Highly recommend Kate if you want true relaxation.',
    },
    {
      id: 'rev-k3',
      name: 'Aaron S.',
      rating: 5,
      date: '2 weeks ago',
      verified: true,
      refCode: 'GS-61X902',
      sessionType: 'In-call Private Suite',
      comment:
        'Professional, calming demeanor, and seamless check-in. The entire booking was hassle-free and discreet.',
    },
  ],
  sarah: [
    {
      id: 'rev-s1',
      name: 'Marcus L.',
      rating: 5,
      date: '4 days ago',
      verified: true,
      refCode: 'GS-77D301',
      sessionType: 'In-call Private Suite',
      comment:
        'Sarah has an incredible healing touch. She completely relieved tension in my shoulders and neck. Very polite and discreet atmosphere.',
    },
    {
      id: 'rev-s2',
      name: 'James P.',
      rating: 5,
      date: '1 week ago',
      verified: true,
      refCode: 'GS-32F810',
      sessionType: 'In-call Private Suite',
      comment:
        'Super smooth booking process. Sarah was warm, welcoming, and very attentive to what I requested. The perfect way to unwind after a stressful week.',
    },
    {
      id: 'rev-s3',
      name: 'Chris B.',
      rating: 5,
      date: '3 weeks ago',
      verified: true,
      refCode: 'GS-19M445',
      sessionType: 'Out-call Session',
      comment:
        'Punctual arrival, great technique, and very respectful of personal space and privacy. Worth every dollar.',
    },
  ],
  katty: [
    {
      id: 'rev-kt1',
      name: 'Anthony R.',
      rating: 5,
      date: '2 days ago',
      verified: true,
      refCode: 'GS-55P213',
      sessionType: 'In-call Private Suite',
      comment:
        'Katty is wonderful. Extremely punctual, polite, and gave an amazing massage. High level of care and total discretion throughout.',
    },
    {
      id: 'rev-kt2',
      name: 'Jason W.',
      rating: 5,
      date: '10 days ago',
      verified: true,
      refCode: 'GS-90K671',
      sessionType: 'In-call Private Suite',
      comment:
        'Top-tier session. The private suite was easy to find and completely private. Katty exceeded my expectations.',
    },
  ],
  rachel: [
    {
      id: 'rev-r1',
      name: 'Brandon T.',
      rating: 5,
      date: 'Yesterday',
      verified: true,
      refCode: 'GS-23R980',
      sessionType: 'In-call Private Suite',
      comment:
        'Rachel is sweet, communicative, and provides an unforgettable experience. Made me feel totally relaxed and at ease.',
    },
    {
      id: 'rev-r2',
      name: 'Sean M.',
      rating: 5,
      date: '6 days ago',
      verified: true,
      refCode: 'GS-88L112',
      sessionType: 'Out-call Session',
      comment:
        'Exceeded all expectations. Very communicative, punctual, and respectful of privacy.',
    },
  ],
}

const STORAGE_PREFIX = '_therapist_reviews_'

/**
 * Get reviews for a therapist (merges stored user reviews with default curated ones)
 */
export function getStoredReviews(therapistId) {
  const normId = (therapistId || '').toLowerCase()
  const defaults = DEFAULT_REVIEWS[normId] || [
    {
      id: `rev-default-${normId}`,
      name: 'Michael B.',
      rating: 5,
      date: 'Recently',
      verified: true,
      refCode: 'GS-77A104',
      sessionType: 'Verified Session',
      comment:
        'Exceptional session. Very professional, relaxing, and strictly private.',
    },
  ]

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${normId}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        // User reviews first, then defaults
        return [...parsed, ...defaults]
      }
    }
  } catch (err) {
    console.warn('[Reviews] Error loading reviews:', err)
  }

  return defaults
}

/**
 * Save a new client review to localStorage
 */
export function saveNewReview(therapistId, review) {
  const normId = (therapistId || '').toLowerCase()
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${normId}`)
    let list = raw ? JSON.parse(raw) : []
    if (!Array.isArray(list)) list = []

    const newEntry = {
      id: `rev-user-${Date.now()}`,
      name: review.name?.trim() || 'Anonymous Client',
      rating: Math.max(1, Math.min(5, Number(review.rating) || 5)),
      date: 'Just now',
      verified: Boolean(review.refCode && review.refCode.trim().length >= 4),
      refCode: review.refCode?.trim() || '',
      sessionType: review.sessionType || 'Verified Client Session',
      comment: review.comment?.trim() || '',
      createdAt: new Date().toISOString(),
    }

    list.unshift(newEntry)
    localStorage.setItem(`${STORAGE_PREFIX}${normId}`, JSON.stringify(list))
    return getStoredReviews(normId)
  } catch (err) {
    console.error('[Reviews] Error saving review:', err)
    return getStoredReviews(normId)
  }
}

/**
 * Compute average rating score, total count, and distribution
 */
export function getRatingSummary(reviews) {
  if (!reviews || reviews.length === 0) {
    return { average: 5.0, count: 0, fiveStarPercent: 100 }
  }

  const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0)
  const average = (sum / reviews.length).toFixed(1)
  const fiveStars = reviews.filter((r) => Number(r.rating) === 5).length
  const fiveStarPercent = Math.round((fiveStars / reviews.length) * 100)

  return {
    average: Number(average),
    count: reviews.length,
    fiveStarPercent,
  }
}

