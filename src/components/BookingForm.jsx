import { useState, useMemo } from 'react'
import { sendBookingSubmission } from '../lib/sendBooking'
import { trackBookingSubmission } from '../lib/telegram'
import { sessionRates } from '../data/therapists'
import ImageLightbox from './ImageLightbox'

const POPULAR_TIME_SLOTS = [
  'ASAP / Next Available',
  '11:00 AM',
  '12:30 PM',
  '2:00 PM',
  '3:30 PM',
  '5:00 PM',
  '6:30 PM',
  '8:00 PM',
  '9:30 PM',
  '11:00 PM (Late)',
  'Overnight',
  'Custom Time',
]

function getFormattedDate(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().split('T')[0]
}

function formatPrettyDate(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  const dateObj = new Date(year, month - 1, day)
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export default function BookingForm({ therapistName, idPrefix, onBookingSuccess }) {
  const todayStr = useMemo(() => getFormattedDate(0), [])
  const tomorrowStr = useMemo(() => getFormattedDate(1), [])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState(sessionRates[0]?.id || '1hr')
  const [dateMode, setDateMode] = useState('today') // 'today' | 'tomorrow' | 'custom'
  const [customDate, setCustomDate] = useState(todayStr)
  const [timeSlot, setTimeSlot] = useState('2:00 PM')
  const [customTime, setCustomTime] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
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

  // Effective appointment date & time for display and submit
  const effectiveDate =
    dateMode === 'today'
      ? `Today (${formatPrettyDate(todayStr)})`
      : dateMode === 'tomorrow'
        ? `Tomorrow (${formatPrettyDate(tomorrowStr)})`
        : formatPrettyDate(customDate) || customDate

  const effectiveTime = timeSlot === 'Custom Time' ? customTime || 'Custom' : timeSlot

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

    const sessionSummary = `${selectedSession.time} — Total: ${selectedSession.amount} (Deposit: ${selectedSession.deposit})`

    const clientAddress = isOutCall
      ? `Out-call: ${address}`
      : isThreesome
        ? `Threesome Venue: ${address || 'To be arranged via email'}`
        : 'In-call: Private suite address sent upon deposit confirmation'

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
        appointmentDate: effectiveDate,
        appointmentTime: effectiveTime,
        specialRequests,
        address: clientAddress,
        depositAmount: selectedSession.deposit,
        totalAmount: selectedSession.amount,
        balanceDue: balanceDue !== null ? `$${balanceDue}` : 'On arrival',
      })

      // Notify via Telegram and mark booking done
      trackBookingSubmission({
        profileName: therapistName,
        clientName: currentName,
        sessionType: sessionSummary,
        appointmentDate: effectiveDate,
        appointmentTime: effectiveTime,
        specialRequests,
        hostingPreference: clientAddress,
        depositAmount: selectedSession.deposit,
        totalAmount: selectedSession.amount,
        balanceDue: balanceDue !== null ? `$${balanceDue}` : 'On arrival',
      })

      if (onBookingSuccess) onBookingSuccess()
      setSubmittedName(currentName)
      setStatus('sent')
      setName('')
      setEmail('')
      setAddress('')
      setSpecialRequests('')
      setFile(null)
      setPreviewSrc(null)
      e.target.reset()

      // Reload page after 3 seconds
      setTimeout(() => {
        window.location.reload()
      }, 3000)
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
            <strong>Meetup Confirmed Upon Deposit:</strong> Pay the required deposit now to lock your appointment slot.
            The remaining balance is paid directly in cash upon arrival.
          </div>
        </div>

        {/* 1. Client Info */}
        <div className="field-group-title">1. Your Details</div>
        <div className="field">
          <label htmlFor={`${idPrefix}-name`}>Full Name</label>
          <input
            id={`${idPrefix}-name`}
            type="text"
            placeholder="Your name or preferred alias"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}-email`}>Email Address</label>
          <input
            id={`${idPrefix}-email`}
            type="email"
            placeholder="you@example.com (for address & confirmation)"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* 2. Schedule & Duration */}
        <div className="field-group-title">2. Session Schedule &amp; Duration</div>

        <div className="field">
          <label htmlFor={`${idPrefix}-session`}>Select Meetup Duration &amp; Deposit</label>
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

        {/* Date Selector */}
        <div className="field">
          <label>Preferred Date</label>
          <div className="date-chip-group">
            <button
              type="button"
              className={`date-chip ${dateMode === 'today' ? 'active' : ''}`}
              onClick={() => setDateMode('today')}
            >
              📅 Today ({formatPrettyDate(todayStr)})
            </button>
            <button
              type="button"
              className={`date-chip ${dateMode === 'tomorrow' ? 'active' : ''}`}
              onClick={() => setDateMode('tomorrow')}
            >
              🗓️ Tomorrow ({formatPrettyDate(tomorrowStr)})
            </button>
            <button
              type="button"
              className={`date-chip ${dateMode === 'custom' ? 'active' : ''}`}
              onClick={() => setDateMode('custom')}
            >
              📆 Select Date
            </button>
          </div>
          {dateMode === 'custom' && (
            <input
              type="date"
              min={todayStr}
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="custom-date-input"
              required
            />
          )}
        </div>

        {/* Time Selector */}
        <div className="field">
          <label htmlFor={`${idPrefix}-time`}>Preferred Time Slot</label>
          <select
            id={`${idPrefix}-time`}
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
          >
            {POPULAR_TIME_SLOTS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {timeSlot === 'Custom Time' && (
            <input
              type="text"
              placeholder="e.g. 4:15 PM or After midnight"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="custom-time-input"
              style={{ marginTop: '8px' }}
              required
            />
          )}
        </div>

        {/* 3. Location & Hosting */}
        <div className="field-group-title">3. Location Preference</div>
        <div className="field">
          <label htmlFor={`${idPrefix}-hosting`}>Can you host / Location preference?</label>
          <select
            id={`${idPrefix}-hosting`}
            value={hostingOption}
            onChange={(e) => setHostingOption(e.target.value)}
          >
            <option value="in-call">I cannot host — In-call (Private suite address sent after deposit)</option>
            <option value="out-call">I can host — Out-call (Therapist travels to your address)</option>
          </select>
        </div>

        {isOutCall ? (
          <div className="field">
            <label htmlFor={`${idPrefix}-address`}>Your Address / Hotel &amp; Room #</label>
            <input
              id={`${idPrefix}-address`}
              type="text"
              placeholder="Enter full street address, city, hotel/room #"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        ) : isThreesome ? (
          <div className="field">
            <label htmlFor={`${idPrefix}-address`}>Preferred Venue / Location (Optional)</label>
            <input
              id={`${idPrefix}-address`}
              type="text"
              placeholder="Enter location or leave blank for arranged private suite"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        ) : (
          <div className="address-info-note">
            📍 <strong>Meeting Location:</strong> Our private, discreet suite address will be delivered directly to your
            email inbox immediately after your deposit payment is verified.
          </div>
        )}

        {/* 4. Special Requests / Notes */}
        <div className="field">
          <label htmlFor={`${idPrefix}-notes`}>
            Special Requests / Preferences <span className="optional-tag">(Optional)</span>
          </label>
          <textarea
            id={`${idPrefix}-notes`}
            rows="2"
            placeholder="e.g. Focus areas, preferred atmosphere, beverage preference, scent sensitivity, or special notes..."
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            className="notes-textarea"
          />
        </div>

        {/* 5. Live Booking Summary Receipt */}
        <div className="booking-summary-receipt">
          <div className="receipt-header">
            <span className="receipt-title">🧾 Real-Time Booking Summary</span>
            <span className="receipt-badge">LIVE ESTIMATE</span>
          </div>

          <div className="receipt-rows">
            <div className="receipt-row">
              <span className="r-label">Therapist:</span>
              <span className="r-val font-bold">{therapistName}</span>
            </div>
            <div className="receipt-row">
              <span className="r-label">Duration &amp; Rate:</span>
              <span className="r-val">
                {selectedSession.time} ({selectedSession.amount})
              </span>
            </div>
            <div className="receipt-row">
              <span className="r-label">Scheduled For:</span>
              <span className="r-val">
                {effectiveDate} @ {effectiveTime}
              </span>
            </div>
            <div className="receipt-row">
              <span className="r-label">Hosting Mode:</span>
              <span className="r-val">{isOutCall ? 'Out-call (Your place)' : 'In-call (Private Suite)'}</span>
            </div>
            {specialRequests.trim() && (
              <div className="receipt-row notes-preview">
                <span className="r-label">Notes:</span>
                <span className="r-val italic">"{specialRequests.trim().slice(0, 50)}{specialRequests.length > 50 ? '…' : ''}"</span>
              </div>
            )}
          </div>

          <div className="receipt-divider" />

          <div className="receipt-financials">
            <div className="receipt-row">
              <span className="r-label">Total Session Cost:</span>
              <span className="r-val total-amount">{selectedSession.amount}</span>
            </div>
            <div className="receipt-row highlight-deposit">
              <span className="r-label">
                <strong>🔒 Deposit Due Now (Locks Slot):</strong>
              </span>
              <span className="r-val deposit-pill">{selectedSession.deposit}</span>
            </div>
            {balanceDue !== null && (
              <div className="receipt-row subtle-balance">
                <span className="r-label">Remaining Balance at Meetup:</span>
                <span className="r-val">${balanceDue} (Cash)</span>
              </div>
            )}
          </div>

          <div className="receipt-footer">
            🛡️ 100% of your deposit is applied to your session total. Pay the remaining balance in person upon meetup.
          </div>
        </div>

        {/* 6. Deposit Proof Upload */}
        <div className="field-group-title">4. Upload Deposit Proof</div>
        <div className="field">
          <label htmlFor={`${idPrefix}-file`}>Upload Proof of Deposit (Screenshot or Transaction Receipt)</label>
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
          {status === 'sending' ? 'Verifying deposit proof…' : status === 'sent' ? 'Deposit Submitted ✓' : 'Confirm Meetup with Deposit'}
        </button>
        <div className="form-note">
          Your appointment is locked and confirmed as soon as your deposit proof is verified.
        </div>

        {status === 'sent' && (
          <div className="confirm-msg">
            Thanks {submittedName || 'there'}! We have received your booking and deposit proof for {therapistName}. Your
            appointment is being confirmed and meeting details will be sent to your email shortly.
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
