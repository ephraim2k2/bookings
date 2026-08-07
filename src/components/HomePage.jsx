import { therapists } from '../data/therapists'
import Gallery from './Gallery'

export default function HomePage({ onSelectTherapist }) {
  return (
    <div className="wrap home-directory">
      <div className="directory-head">
        <h2>Our Therapists</h2>
        <p>Select a therapist below to view their profile, rates, and book a session.</p>
      </div>

      <div className="therapist-cards-grid">
        {therapists.map((t) => (
          <div key={t.id} className="therapist-card">
            <div className="card-gallery-wrapper">
              <Gallery accent={t.accent} gallery={t.gallery} />
            </div>
            <div className="card-body">
              <h3 className="card-name">{t.name}</h3>
              <p className="card-desc">{t.desc}</p>
              <div className="card-rates">Rates from $50 · $25 Deposit to Confirm Meetup</div>
              <a
                href={`#/${t.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  onSelectTherapist(t.id)
                }}
                className="view-profile-btn"
                style={{ background: t.accent }}
              >
                Book with {t.name.split(' ')[0]} →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
