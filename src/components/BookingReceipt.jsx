import { useState } from 'react'
import ImageLightbox from './ImageLightbox'

export default function BookingReceipt({ receipt, onReset }) {
  const [copied, setCopied] = useState(false)
  const [showLightbox, setShowLightbox] = useState(false)

  if (!receipt) return null

  const {
    refCode,
    clientName,
    clientEmail,
    therapistName,
    duration,
    rate,
    date,
    time,
    hostingOption,
    address,
    specialRequests,
    proofPreview,
    submittedAt,
  } = receipt

  const handleCopyRef = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(refCode).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleOpenChat = () => {
    const chatBtn = document.getElementById('livechat-toggle')
    if (chatBtn) chatBtn.click()
  }

  return (
    <>
      <div className="receipt-container" id="booking-receipt-printable">
        {/* Top Screenshot Callout Banner */}
        <div className="receipt-screenshot-banner no-print">
          <div className="screenshot-banner-icon">📸</div>
          <div className="screenshot-banner-text">
            <strong>SCREENSHOT THIS RECEIPT NOW:</strong> Save this screen or take a screenshot as your official proof of booking &amp; arrival pass.
          </div>
          <span className="screenshot-pulse-badge">SAVE NOW</span>
        </div>

        {/* The Official Receipt Card */}
        <div className="booking-receipt-card">
          {/* Top Perforated Bar & Brand Header */}
          <div className="receipt-card-header">
            <div className="receipt-brand-meta">
              <span className="receipt-brand-tag">GROVE &amp; STONE CONCIERGE</span>
              <h2 className="receipt-brand-title">Official Booking Receipt</h2>
              <span className="receipt-brand-sub">Private &amp; Confidential Wellness Session</span>
            </div>
            <div className="receipt-status-stamp">
              <span className="receipt-stamp-badge">
                <span className="receipt-stamp-dot" /> CONFIRMED &amp; LOGGED
              </span>
              <span className="receipt-stamp-time">{submittedAt}</span>
            </div>
          </div>

          <div className="receipt-zigzag-divider" />

          {/* Reference Code Box */}
          <div className="receipt-ref-banner">
            <div className="receipt-ref-label">Booking Reference ID</div>
            <div className="receipt-ref-code-row">
              <span className="receipt-ref-code">{refCode}</span>
              <button
                type="button"
                className="receipt-copy-btn"
                onClick={handleCopyRef}
                title="Copy Reference Code"
              >
                {copied ? '✓ Copied' : 'Copy ID'}
              </button>
            </div>
            <div className="receipt-ref-hint">
              Quote this reference ID to concierge support or upon arrival.
            </div>
          </div>

          {/* Core Booking Breakdown Grid */}
          <div className="receipt-section-title">Session Particulars</div>
          <div className="receipt-grid">
            <div className="receipt-grid-item">
              <span className="r-item-label">Provider / Therapist</span>
              <span className="r-item-val font-highlight">{therapistName}</span>
            </div>

            <div className="receipt-grid-item">
              <span className="r-item-label">Client Name</span>
              <span className="r-item-val">{clientName}</span>
            </div>

            <div className="receipt-grid-item">
              <span className="r-item-label">Appointment Date</span>
              <span className="r-item-val">{date}</span>
            </div>

            <div className="receipt-grid-item">
              <span className="r-item-label">Scheduled Time</span>
              <span className="r-item-val">{time}</span>
            </div>

            <div className="receipt-grid-item">
              <span className="r-item-label">Service &amp; Duration</span>
              <span className="r-item-val">{duration || 'Session'}</span>
            </div>

            <div className="receipt-grid-item">
              <span className="r-item-label">Hosting Preference</span>
              <span className="r-item-val">
                {hostingOption === 'out-call' ? 'Out-call (Your Venue)' : 'In-call (Private Suite)'}
              </span>
            </div>
          </div>

          {/* Location & Address Box */}
          <div className="receipt-grid-item full-width-box">
            <span className="r-item-label">Meeting Location &amp; Access</span>
            <span className="r-item-val location-val">
              📍 {address || 'Private discreet suite address delivered to your email'}
            </span>
          </div>

          {/* Special Requests if any */}
          {specialRequests && (
            <div className="receipt-grid-item full-width-box notes-box">
              <span className="r-item-label">Special Requests / Preferences</span>
              <span className="r-item-val italic-notes">"{specialRequests}"</span>
            </div>
          )}

          {/* Financial Statement */}
          <div className="receipt-section-title" style={{ marginTop: '16px' }}>
            Payment Summary
          </div>
          <div className="receipt-financial-card">
            <div className="receipt-fin-row">
              <span className="fin-label">Total Session Fee:</span>
              <span className="fin-val font-bold">{rate}</span>
            </div>
            <div className="receipt-fin-row">
              <span className="fin-label">Payment Proof Verification:</span>
              <span className="fin-val fin-success">
                <span className="fin-check">✓</span> Submitted &amp; Recorded
              </span>
            </div>
            <div className="receipt-fin-row fin-divider" />
            <div className="receipt-fin-row fin-total-row">
              <span className="fin-label">Balance Due at Meetup:</span>
              <span className="fin-val fin-due">$0.00 (Fully Covered)</span>
            </div>

            {proofPreview && (
              <div className="receipt-proof-preview-row no-print">
                <div className="proof-meta">
                  <span className="proof-label">Payment Proof Attached:</span>
                  <span className="proof-sub">Click thumbnail to view screenshot</span>
                </div>
                <img
                  src={proofPreview}
                  alt="Payment receipt proof"
                  className="receipt-proof-thumb"
                  onClick={() => setShowLightbox(true)}
                  title="Click to zoom proof"
                />
              </div>
            )}
          </div>

          {/* Arrival & Security Guarantee Protocol */}
          <div className="receipt-protocol-box">
            <div className="protocol-header">
              <span>🛡️ Arrival &amp; Discretion Protocol</span>
            </div>
            <ul className="protocol-list">
              <li>Please arrive 5–10 minutes prior to your scheduled time slot.</li>
              <li>Discreet door entry instructions and suite code have been sent to <strong>{clientEmail}</strong>.</li>
              <li>Present this screenshot or your Booking ID (<code>{refCode}</code>) upon arrival.</li>
            </ul>
          </div>

          {/* Footer Watermark */}
          <div className="receipt-card-footer">
            <span>Official digital receipt issued by Grove &amp; Stone Wellness.</span>
            <span>All sessions are 100% private, discreet, and strictly confidential.</span>
          </div>
        </div>

        {/* Action Buttons Below Receipt */}
        <div className="receipt-action-buttons no-print">
          <button type="button" className="receipt-action-btn primary" onClick={handlePrint}>
            🖨️ Print / Save PDF
          </button>
          <button type="button" className="receipt-action-btn secondary" onClick={handleOpenChat}>
            💬 Concierge Support
          </button>
          <button type="button" className="receipt-action-btn outline" onClick={onReset}>
            ← Book Another Session
          </button>
        </div>
      </div>

      {showLightbox && proofPreview && (
        <ImageLightbox
          src={proofPreview}
          alt="Payment proof screenshot"
          onClose={() => setShowLightbox(false)}
        />
      )}
    </>
  )
}
