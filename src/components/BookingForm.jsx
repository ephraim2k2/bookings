import { useState } from 'react'

export default function BookingForm({ therapistName, idPrefix }) {
  const [name, setName] = useState('')
  const [previewSrc, setPreviewSrc] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPreviewSrc(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
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
        <label htmlFor={`${idPrefix}-file`}>Proof of payment (screenshot)</label>
        <div className="file-field">
          <input
            id={`${idPrefix}-file`}
            type="file"
            accept="image/*"
            required
            onChange={handleFileChange}
          />
          {previewSrc && <img className="file-preview" src={previewSrc} alt="Payment proof preview" />}
        </div>
      </div>
      <button type="submit" className="submit-btn" disabled={submitted}>
        {submitted ? 'Sent ✓' : 'Submit booking'}
      </button>
      <div className="form-note">We'll confirm your slot by text once we verify payment.</div>
      {submitted && (
        <div className="confirm-msg">
          Thanks {name}! We've received your payment proof for {therapistName} and
          will confirm your time slot by text shortly.
        </div>
      )}
    </form>
  )
}
