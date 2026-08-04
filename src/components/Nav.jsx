import { therapists } from '../data/therapists'

export default function Nav() {
  return (
    <nav>
      <div className="wrap">
        <div className="logo">
          <svg className="logo-mark" viewBox="0 0 26 26" fill="none">
            <circle cx="13" cy="13" r="12" stroke="#B97B6D" strokeWidth="1.4" />
            <path
              d="M8 13c1.5-3 3.5-4.5 5-4.5s3.5 1.5 5 4.5c-1.5 3-3.5 4.5-5 4.5s-3.5-1.5-5-4.5z"
              stroke="#1E2B22"
              strokeWidth="1.2"
            />
          </svg>
          Grove &amp; Stone
        </div>
        <div className="navlinks">
          {therapists.map((t) => (
            <a key={t.id} href={`#${t.id}`}>
              {t.name.split(' ')[0]}
            </a>
          ))}
        </div>
      </div>
    </nav>
  )
}
