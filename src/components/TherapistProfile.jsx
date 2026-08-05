import { useState } from 'react'
import Gallery from './Gallery'
import PayCard from './PayCard'
import BookingForm from './BookingForm'

const PAY_LABELS = {
  chime: 'Chime',
  zelle: 'Zelle',
  venmo: 'Venmo',
  btc: 'Bitcoin',
}

export default function TherapistProfile({ therapist }) {
  const { id, name, role, desc, tags, accent, tint, gallery, sessions, payment } = therapist
  const [selectedSession, setSelectedSession] = useState(
    sessions.find((s) => s.selected)?.label || sessions[0]?.label
  )

  return (
    <section className={`profile standalone-page${tint ? ' tint' : ''}`} id={id}>
      <div className="wrap">
        <div className="profile-grid">
          <Gallery accent={accent} gallery={gallery} />

          <div>
            <div className="profile-name">{name}</div>
            {role && <div className="profile-role">{role}</div>}
            {desc && <p className="profile-desc">{desc}</p>}
            {tags && tags.length > 0 && (
              <div className="tags">
                {tags.map((tag) => (
                  <span className="tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="session-row">
              <label htmlFor={`${id}-length`}>Session</label>
              <select
                id={`${id}-length`}
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
              >
                {sessions.map((s) => (
                  <option key={s.label} value={s.label}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="block-label">Pay for {name.split(' ')[0]}</div>
            <div className="pay-grid-mini">
              {Object.entries(payment).map(([type, value]) => (
                <PayCard key={type} type={type} label={PAY_LABELS[type]} value={value} accent={accent} />
              ))}
            </div>

            <div className="block-label">Confirm your booking</div>
            <BookingForm therapistName={name.split(' ')[0]} sessionType={selectedSession} idPrefix={id} />
          </div>
        </div>
      </div>
    </section>
  )
}
