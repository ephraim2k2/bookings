import { useState } from 'react'
import { therapists } from '../data/therapists'

export default function HomePage({ onSelectTherapist }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  const handleUnlock = (e) => {
    e.preventDefault()
    const clean = code.trim().toLowerCase()
    const match = therapists.find(
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
        <div className="private-portal-icon">🔒</div>
        <h2>Private Booking Portal</h2>
        <p>
          Welcome to Grove &amp; Stone. Our services and profiles are private and accessible exclusively
          via your direct invitation link or private access code.
        </p>

        <form className="private-access-form" onSubmit={handleUnlock}>
          <div className="field">
            <label htmlFor="portal-code">Enter Your Invitation / Access Code</label>
            <input
              id="portal-code"
              type="text"
              placeholder="e.g. KATE88 or your invite link"
              value={code}
              onChange={(e) => {
                setCode(e.target.value)
                setError(false)
              }}
              required
            />
          </div>
          <button type="submit" className="submit-btn" style={{ width: '100%', marginTop: '6px' }}>
            Access Profile →
          </button>
        </form>

        {error && (
          <div className="confirm-msg" style={{ background: 'var(--clay-dark)', marginTop: '14px' }}>
            Invalid access code. Please verify your invitation code or use your direct private link.
          </div>
        )}

        <div className="private-portal-note">
          Please contact support via live chat if you need assistance with your booking link.
        </div>
      </div>
    </div>
  )
}
