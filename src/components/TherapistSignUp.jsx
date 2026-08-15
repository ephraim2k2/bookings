import { useState } from 'react'
import { sessionRates, saveNewTherapist } from '../data/therapists'
import { uploadImage } from '../lib/sendBooking'
import { trackTherapistRegistration } from '../lib/telegram'

export default function TherapistSignUp({ onComplete, onBack }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    city: '',
    role: 'Licensed Massage & Bodywork Specialist',
    desc: '',
    tags: 'Relaxation, Deep Tissue, In-call, Out-call',
    chime: '',
    zelle: '',
    venmo: '',
    btc: '',
    accent: '#71846A',
  })

  const [mainPhotoFile, setMainPhotoFile] = useState(null)
  const [mainPhotoPreview, setMainPhotoPreview] = useState(null)
  const [thumb1File, setThumb1File] = useState(null)
  const [thumb1Preview, setThumb1Preview] = useState(null)
  const [thumb2File, setThumb2File] = useState(null)
  const [thumb2Preview, setThumb2Preview] = useState(null)

  const [status, setStatus] = useState('idle') // idle | uploading | saving | success | error
  const [statusText, setStatusText] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [createdProfile, setCreatedProfile] = useState(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  const handleInputChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }))
  }

  const handleFileChange = (file, setFile, setPreview) => {
    if (!file) return
    setFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const generateSlug = (name) => {
    const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'pro'
    const rand = Math.random().toString(36).slice(2, 8)
    return `v-${clean}-${rand}`
  }

  const generateAccessCode = (name) => {
    const clean = name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5) || 'PRO'
    const randNum = Math.floor(10 + Math.random() * 90)
    return `${clean}${randNum}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setStatus('uploading')
    setErrorMsg('')

    try {
      // 1. Upload photos (or use fallback previews/placeholders)
      setStatusText('Uploading profile photos...')
      let mainUrl = mainPhotoPreview
      let thumb1Url = thumb1Preview
      let thumb2Url = thumb2Preview

      const uploadTasks = []
      if (mainPhotoFile) {
        uploadTasks.push(
          uploadImage(mainPhotoFile)
            .then((url) => { mainUrl = url })
            .catch(() => {})
        )
      }
      if (thumb1File) {
        uploadTasks.push(
          uploadImage(thumb1File)
            .then((url) => { thumb1Url = url })
            .catch(() => {})
        )
      }
      if (thumb2File) {
        uploadTasks.push(
          uploadImage(thumb2File)
            .then((url) => { thumb2Url = url })
            .catch(() => {})
        )
      }

      if (uploadTasks.length > 0) {
        await Promise.all(uploadTasks)
      }

      // 2. Build profile object
      setStatus('saving')
      setStatusText('Generating your private portal...')

      const rawId = formData.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '-')
      const uniqueSlug = generateSlug(formData.name)
      const accessCode = generateAccessCode(formData.name)

      const splitTags = formData.tags
        ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : ['Relaxation', 'Bodywork']

      const newTherapist = {
        id: rawId || `therapist-${Date.now()}`,
        slug: uniqueSlug,
        accessCode: accessCode,
        name: formData.name.trim(),
        role: formData.role.trim() || 'Independent Provider',
        desc: formData.desc.trim() || 'Professional massage and relaxation sessions tailored to your needs.',
        tags: splitTags,
        accent: formData.accent || '#71846A',
        gallery: {
          main: mainUrl || '/kate1.jpeg',
          thumb1: thumb1Url || '/kate2.jpeg',
          thumb2: thumb2Url || '/kate3.jpeg',
        },
        sessions: sessionRates,
        whatsapp: formData.whatsapp.replace(/[^0-9]/g, '') || formData.phone.replace(/[^0-9]/g, '') || '14302939043',
        payment: {
          chime: formData.chime || `$${formData.name.replace(/\s+/g, '')}`,
          zelle: formData.zelle || formData.email || 'support@grovestone.co',
          venmo: formData.venmo || `@${formData.name.replace(/\s+/g, '-')}`,
          btc: formData.btc || 'bc1qts3ulkzefm5csrswydv98rcusyvaf74gr77an9',
        },
        contact: {
          email: formData.email,
          phone: formData.phone,
          city: formData.city,
        },
      }

      // 3. Save locally for instant access
      saveNewTherapist(newTherapist)

      // 4. Notify admin on Telegram
      const photoUrls = [mainUrl, thumb1Url, thumb2Url].filter(
        (u) => u && typeof u === 'string' && u.startsWith('http')
      )

      trackTherapistRegistration({
        name: newTherapist.name,
        email: formData.email,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        city: formData.city,
        bio: newTherapist.desc,
        services: newTherapist.tags.join(', '),
        accessCode: newTherapist.accessCode,
        slug: newTherapist.slug,
        payment: newTherapist.payment,
        photos: photoUrls,
      })

      setCreatedProfile(newTherapist)
      setStatus('success')
    } catch (err) {
      console.error(err)
      setStatus('error')
      setErrorMsg(err.message || 'Registration failed. Please try again.')
    }
  }

  const fullPortalUrl = createdProfile
    ? `${window.location.origin}${window.location.pathname}#/${createdProfile.slug}`
    : ''

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'link') {
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2000)
      } else {
        setCopiedCode(true)
        setTimeout(() => setCopiedCode(false), 2000)
      }
    })
  }

  return (
    <div className="wrap therapist-signup-wrap">
      <div className="therapist-signup-card">
        {status === 'success' && createdProfile ? (
          <div className="signup-success-view">
            <div className="success-icon">🎉</div>
            <h2>Welcome, {createdProfile.name}!</h2>
            <p className="success-subtitle">
              Your private provider profile has been created and is active immediately.
            </p>

            <div className="credential-box">
              <div className="credential-item">
                <span className="cred-label">Your Private Booking Link:</span>
                <div className="cred-row">
                  <input type="text" readOnly value={fullPortalUrl} className="cred-input" />
                  <button
                    type="button"
                    className="copy-btn cred-copy-btn"
                    onClick={() => copyToClipboard(fullPortalUrl, 'link')}
                  >
                    {copiedLink ? '✓ Copied' : 'Copy Link'}
                  </button>
                </div>
                <small className="cred-hint">Share this direct link with your clients.</small>
              </div>

              <div className="credential-item" style={{ marginTop: '16px' }}>
                <span className="cred-label">Your Secret Access Code:</span>
                <div className="cred-row">
                  <div className="access-code-badge">{createdProfile.accessCode}</div>
                  <button
                    type="button"
                    className="copy-btn cred-copy-btn"
                    onClick={() => copyToClipboard(createdProfile.accessCode, 'code')}
                  >
                    {copiedCode ? '✓ Copied' : 'Copy Code'}
                  </button>
                </div>
                <small className="cred-hint">Clients can also enter this code on the home page.</small>
              </div>
            </div>

            <div className="success-actions">
              <button
                type="button"
                className="submit-btn"
                onClick={() => onComplete && onComplete(createdProfile.slug)}
                style={{ width: '100%' }}
              >
                View Your Live Profile →
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={onBack}
                style={{ width: '100%', marginTop: '10px' }}
              >
                ← Back to Home
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="signup-header">
              <span className="signup-badge">Independent Providers</span>
              <h2>Join as a Therapist</h2>
              <p>
                Create your private, discreet booking profile to accept client bookings and session
                requests directly.
              </p>
            </div>

            <form className="therapist-signup-form" onSubmit={handleSubmit}>
              {/* SECTION 1 */}
              <div className="signup-section-title">1. Personal &amp; Profile Details</div>

              <div className="field-grid-2">
                <div className="field">
                  <label htmlFor="reg-name">Display Name / Alias *</label>
                  <input
                    id="reg-name"
                    type="text"
                    placeholder="e.g. Sophia Ray"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="reg-city">City / Base Location</label>
                  <input
                    id="reg-city"
                    type="text"
                    placeholder="e.g. Miami, FL / Downtown"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>
              </div>

              <div className="field-grid-2">
                <div className="field">
                  <label htmlFor="reg-email">Email Address *</label>
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="reg-phone">Phone / WhatsApp Number</label>
                  <input
                    id="reg-phone"
                    type="tel"
                    placeholder="e.g. +1 555-0199"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="reg-desc">Bio &amp; Session Introduction</label>
                <textarea
                  id="reg-desc"
                  rows="3"
                  placeholder="Describe your session style, approach, experience, and what clients can expect..."
                  value={formData.desc}
                  onChange={(e) => handleInputChange('desc', e.target.value)}
                  className="notes-textarea"
                />
              </div>

              <div className="field">
                <label htmlFor="reg-tags">Specialties &amp; Services (comma separated)</label>
                <input
                  id="reg-tags"
                  type="text"
                  placeholder="e.g. Relaxation, Deep Tissue, Aromatherapy, In-call, Out-call"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                />
              </div>

              {/* SECTION 2 */}
              <div className="signup-section-title">2. Payment Handles (For Client Payments)</div>
              <p className="signup-section-sub">
                Clients will use these details to complete payment to secure their bookings.
              </p>

              <div className="field-grid-2">
                <div className="field">
                  <label htmlFor="reg-chime">Chime Tag</label>
                  <input
                    id="reg-chime"
                    type="text"
                    placeholder="e.g. $SophiaRay"
                    value={formData.chime}
                    onChange={(e) => handleInputChange('chime', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="reg-zelle">Zelle Email / Phone</label>
                  <input
                    id="reg-zelle"
                    type="text"
                    placeholder="e.g. sophia.pay@gmail.com"
                    value={formData.zelle}
                    onChange={(e) => handleInputChange('zelle', e.target.value)}
                  />
                </div>
              </div>

              <div className="field-grid-2">
                <div className="field">
                  <label htmlFor="reg-venmo">Venmo Handle</label>
                  <input
                    id="reg-venmo"
                    type="text"
                    placeholder="e.g. @Sophia-Ray"
                    value={formData.venmo}
                    onChange={(e) => handleInputChange('venmo', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="reg-btc">Bitcoin Address (Optional)</label>
                  <input
                    id="reg-btc"
                    type="text"
                    placeholder="e.g. bc1q..."
                    value={formData.btc}
                    onChange={(e) => handleInputChange('btc', e.target.value)}
                  />
                </div>
              </div>

              {/* SECTION 3 */}
              <div className="signup-section-title">3. Profile Photos</div>
              <p className="signup-section-sub">Upload clear, attractive photos for your client gallery.</p>

              <div className="photo-upload-grid">
                <div className="photo-upload-item">
                  <label>Main Profile Photo *</label>
                  <div className="file-field">
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) =>
                        handleFileChange(e.target.files?.[0], setMainPhotoFile, setMainPhotoPreview)
                      }
                    />
                    {mainPhotoPreview && (
                      <img src={mainPhotoPreview} alt="Main preview" className="signup-img-preview" />
                    )}
                  </div>
                </div>

                <div className="photo-upload-item">
                  <label>Gallery Photo 1 (Optional)</label>
                  <div className="file-field">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFileChange(e.target.files?.[0], setThumb1File, setThumb1Preview)
                      }
                    />
                    {thumb1Preview && (
                      <img src={thumb1Preview} alt="Thumb 1 preview" className="signup-img-preview" />
                    )}
                  </div>
                </div>

                <div className="photo-upload-item">
                  <label>Gallery Photo 2 (Optional)</label>
                  <div className="file-field">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFileChange(e.target.files?.[0], setThumb2File, setThumb2Preview)
                      }
                    />
                    {thumb2Preview && (
                      <img src={thumb2Preview} alt="Thumb 2 preview" className="signup-img-preview" />
                    )}
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="confirm-msg" style={{ background: 'var(--clay-dark)', marginTop: '14px' }}>
                  {errorMsg}
                </div>
              )}

              <div className="signup-footer-buttons">
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={status === 'uploading' || status === 'saving'}
                  style={{ width: '100%' }}
                >
                  {status === 'uploading' || status === 'saving'
                    ? statusText || 'Setting up profile…'
                    : 'Create Provider Profile →'}
                </button>
                <button type="button" className="secondary-btn" onClick={onBack} style={{ marginTop: '10px' }}>
                  Cancel &amp; Return
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
