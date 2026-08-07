import { useState } from 'react'
import { sendBookingSubmission } from '../lib/sendBooking'
import { trackBookingSubmission } from '../lib/telegram'
import { sessionRates } from '../data/therapists'
import ImageLightbox from './ImageLightbox'

export default function BookingForm({ therapistName, idPrefix, onBookingSuccess }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState(sessionRates[0]?.id || '1hr')
  const [hostingOption, setHostingOption] = useState('in-call') // 'in-call' | 'out-call'
  const [address, setAddress] = useState('')
  const [file, setFile] = useState(null)
  const [previewSrc, setPreviewSrc] = useState(null)
  const [submittedName, setSubmittedName] = useState('')
  const [showLightbox, setShowLightbox] = useState(false)
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('')

  const selectedSession = sessionRates.find((s) => s.id === selectedSessionId) || sessionRates[0]
  const isOutCall = hostingOption === 'out-call'
  const isThreesome = selectedSession?.id === 'threesome'
  const balanceDue =
    selectedSession.totalNum > 0 && selectedSession.depositNum > 0
      ? selectedSession.totalNum - selectedSession.depositNum
      : null

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

    const sessionSummary = `${selectedSession.time} — Total: ${selectedSession.amount} (Deposit: ${selectedSession.deposit}) · ${isOutCall ? 'Out-call' : 'In-call'}`

    const clientAddress = isOutCall
      ? address
      : isThreesome
        ? address || 'Threesome package — venue/location to be confirmed via email.'
        : 'In-call session. Meeting location address will be sent to client email upon deposit confirmation.'

    setStatus('sending')
    setErrorMsg('')
    const currentName = name
    try {
      await sendBookingSubmission({
        name: currentName,
        email,
        file,
        therapistName,
        sessionType: sessionSummary,
        address: clientAddress,
      })
      // Notify via Telegram and mark booking done
      trackBookingSubmission(therapistName, currentName, sessionSummary)
      if (onBookingSuccess) onBookingSuccess()
      setSubmittedName(currentName)
      setStatus('sent')
      setName('')
      setEmail('')
      setAddress('')
      setFile(null)
      setPreviewSrc(null)
      e.target.reset()

      // Reload page after 2.5 seconds
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
        {/* Deposit Policy Notice */}
        <div className="deposit-policy-banner">
          <div className="deposit-banner-icon">🔒</div>
          <div className="deposit-banner-text">
            <strong>Meetup Confirmed Upon Deposit:</strong> Pay the required deposit now to secure your session.
            The remaining balance is paid upon meetup.
          </div>
        </div>

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

        {/* Time / Duration selector */}
        <div className="field">
          <label htmlFor={`${idPrefix}-session`}>Select Meetup Duration & Deposit</label>
          <select
            id={`${idPrefix}-session`}
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
          >
            {sessionRates.map((s) => (
              <option key={s.id} value={s.id}>
                {s.time} — Total: {s.amount} · Deposit: {s.deposit}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Deposit Breakdown Box */}
        <div className="deposit-summary-box">
          <div className="deposit-summary-row">
            <span className="summary-label">Total Meetup Amount:</span>
            <span className="summary-val">{selectedSession.amount}</span>
          </div>
          <div className="deposit-summary-row highlight">
            <span className="summary-label">
              <strong>Deposit Due Now to Confirm:</strong>
            </span>
            <span className="summary-val deposit-tag">{selectedSession.deposit}</span>
          </div>
          {balanceDue !== null && (
            <div className="deposit-summary-row subtle">
              <span className="summary-label">Remaining Balance at Meetup:</span>
              <span className="summary-val">${balanceDue}</span>
            </div>
          )}
        </div>

        {/* Hosting / Location Preference */}
        <div className="field">
          <label htmlFor={`${idPrefix}-hosting`}>Can you host / Location preference?</label>
          <select
            id={`${idPrefix}-hosting`}
            value={hostingOption}
            onChange={(e) => setHostingOption(e.target.value)}
          >
            <option value="in-call">I cannot host — In-call (Meeting location provided after deposit)</option>
            <option value="out-call">I can host — Out-call (Therapist travels to your address)</option>
          </select>
        </div>

        {isOutCall ? (
          <div className="field">
            <label htmlFor={`${idPrefix}-address`}>Your Address / Meeting Location</label>
            <input
              id={`${idPrefix}-address`}
              type="text"
              placeholder="Enter street address, city, apt/suite"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        ) : isThreesome ? (
          <div className="field">
            <label htmlFor={`${idPrefix}-address`}>Preferred Venue/Location (Optional)</label>
            <input
              id={`${idPrefix}-address`}
              type="text"
              placeholder="Enter location or leave blank for arranged venue"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        ) : (
          <div className="address-info-note">
            📍 <strong>Meeting Location:</strong> Our private meeting address will be sent to your email immediately
            after your deposit payment is verified.
          </div>
        )}

        <div className="field">
          <label htmlFor={`${idPrefix}-file`}>Proof of deposit payment (screenshot)</label>
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
                alt="Deposit proof preview"
                onClick={() => setShowLightbox(true)}
                title="Click to expand preview"
              />
            )}
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={status === 'sending' || status === 'sent'}>
          {status === 'sending' ? 'Verifying deposit…' : status === 'sent' ? 'Deposit Submitted ✓' : 'Confirm Meetup with Deposit'}
        </button>
        <div className="form-note">
          Your meetup slot is locked and confirmed as soon as your deposit proof is verified.
        </div>

        {status === 'sent' && (
          <div className="confirm-msg">
            Thanks {submittedName || 'there'}! We have received your deposit proof for {therapistName}. Your meetup is
            being confirmed and details will be sent to your email shortly.
          </div>
        )}
        {status === 'error' && (
          <div className="confirm-msg" style={{ background: 'var(--clay-dark)' }}>
            Something went wrong sending your deposit ({errorMsg}). Please try again.
          </div>
        )}
      </form>
      {showLightbox && previewSrc && (
        <ImageLightbox src={previewSrc} alt="Payment proof preview" onClose={() => setShowLightbox(false)} />
      )}
    </>
  )
}
