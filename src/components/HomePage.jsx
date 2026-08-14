import { useState } from 'react'
import { getStoredTherapists } from '../data/therapists'

export default function HomePage({ onSelectTherapist, onJoinProvider }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  const handleUnlock = (e) => {
    e.preventDefault()
    const clean = code.trim().toLowerCase()
    const allTherapists = getStoredTherapists()
    const match = allTherapists.find(
      (t) =>
        t.id.toLowerCase() === clean ||
        t.slug.toLowerCase() === clean ||
        t.accessCode?.toLowerCase() === clean ||
        t.name.toLowerCase().includes(clean)
    )

    if (match) {
      setError(false)
      onSelectTherapist(match.slug || match.id)
    } else {
      setError(true)
    }
  }

  return (
    <div className="wrap home-directory">
      <div className="private-portal-card">
        {/* Icon */}
        <span className="private-portal-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#C97C6D', display: 'inline-block' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </span>

        <h2>Private Booking Portal</h2>
        <p>
          Welcome to Grove &amp; Stone. Profiles are accessible exclusively
          via your private invitation link or access code.
        </p>

        <form className="private-access-form" onSubmit={handleUnlock}>
          <div className="field">
            <label htmlFor="portal-code">Access Code or Invitation Link</label>
            <input
              id="portal-code"
              type="text"
              placeholder="e.g. KATE88"
              value={code}
              onChange={(e) => {
                setCode(e.target.value)
                setError(false)
              }}
              required
              style={{ marginTop: 0 }}
            />
          </div>
          <button type="submit" className="submit-btn" style={{ width: '100%', marginTop: '4px' }}>
            Access Profile →
          </button>
        </form>

        {error && (
          <div
            className="confirm-msg"
            style={{ marginTop: '14px', textAlign: 'center' }}
          >
            Invalid code. Please check your invitation and try again.
          </div>
        )}

        <p className="private-portal-note">
          Need help? Contact support via the live chat below.
        </p>

        {/* Provider Sign-up Prompt */}
        <div className="provider-join-banner">
          <div className="provider-join-text">
            <strong>Are you an independent provider?</strong>
            <span>Set up your private booking portal and accept client appointments.</span>
          </div>
          {onJoinProvider && (
            <button
              type="button"
              className="provider-join-btn"
              onClick={onJoinProvider}
            >
              Join as a Provider →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
