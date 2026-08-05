import { useState } from 'react'
import { sendBookingSubmission } from '../lib/sendBooking'
import ImageLightbox from './ImageLightbox'

export default function BookingForm({ therapistName, sessionType, idPrefix }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [file, setFile] = useState(null)
  const [previewSrc, setPreviewSrc] = useState(null)
  const [submittedName, setSubmittedName] = useState('')
  const [showLightbox, setShowLightbox] = useState(false)
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('')

  const handleFileChange = (e) => {
    const selected = e.target.files && e.target.files[0]
    if (!selected) return
    setFile(selected)
    const reader = new FileReader()
    reader.onload = (ev) => setPreviewSrc(ev.target.result)
    reader.readAsDataURL(selected)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return
    setStatus('sending')
    setErrorMsg('')
    const currentName = name
    try {
      await sendBookingSubmission({ name: currentName, email, file, therapistName, sessionType })
      setSubmittedName(currentName)
      setStatus('sent')
      setName('')
      setEmail('')
      setFile(null)
      setPreviewSrc(null)
      e.target.reset()

      // Reload page after 2.5 seconds to refresh to a completely clean state
      setTimeout(() => {
        window.location.reload()
      }, 2500)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message)
    }
  }

  return (
    <>
      <form className="proof-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor={`${idPrefix}-name`}>Full name</label>
          <input
            id={`${idPrefix}-name`}
            type="text"
            placeholder="Your name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}-email`}>Email</label>
          <input
            id={`${idPrefix}-email`}
            type="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}-file`}>Proof of payment (screenshot)</label>
          <div className="file-field">
            <input
              id={`${idPrefix}-file`}
              type="file"
              accept="image/*"
              required
              onChange={handleFileChange}
            />
            {previewSrc && (
              <img
                className="file-preview"
                src={previewSrc}
                alt="Payment proof preview"
                onClick={() => setShowLightbox(true)}
                title="Click to expand preview"
              />
            )}
          </div>
        </div>
        <button type="submit" className="submit-btn" disabled={status === 'sending' || status === 'sent'}>
          {status === 'sending' ? 'Sending…' : status === 'sent' ? 'Sent ✓' : 'Submit booking'}
        </button>
        <div className="form-note">We'll confirm your slot by email once we verify payment.</div>
        {status === 'sent' && (
          <div className="confirm-msg">
            Thanks {submittedName || 'there'}! We've received your payment proof for {therapistName} and
            will confirm your time slot by email shortly.
          </div>
        )}
        {status === 'error' && (
          <div className="confirm-msg" style={{ background: 'var(--clay-dark)' }}>
            Something went wrong sending your booking ({errorMsg}). Please try again.
          </div>
        )}
      </form>
      {showLightbox && previewSrc && (
        <ImageLightbox src={previewSrc} alt="Payment proof preview" onClose={() => setShowLightbox(false)} />
      )}
    </>
  )
}

