export default function Nav({ isIndividualPage, onNavigate }) {
  return (
    <nav>
      <div className="wrap">
        <div
          className="logo"
          style={{ cursor: onNavigate ? 'pointer' : 'default' }}
          onClick={() => onNavigate && onNavigate('home')}
        >
          <svg className="logo-mark" viewBox="0 0 26 26" fill="none">
            <circle cx="13" cy="13" r="12" stroke="#C97C6D" strokeWidth="1.2" />
            <circle cx="13" cy="13" r="5.5" stroke="#C97C6D" strokeWidth="1" strokeDasharray="2 2" />
            <path
              d="M13 4 C10 8, 7 10.5, 7 13 C7 16.3 9.7 19 13 19 C16.3 19 19 16.3 19 13 C19 10.5 16 8 13 4Z"
              fill="rgba(201,124,109,0.15)"
              stroke="#C97C6D"
              strokeWidth="0.8"
            />
          </svg>
          Grove &amp; Stone
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onNavigate && (
            <button
              type="button"
              className="nav-provider-signup-btn"
              onClick={() => onNavigate('therapist-signup')}
            >
              ✦ Join as Provider
            </button>
          )}
          {!isIndividualPage && (
            <div className="nav-private-badge">
              <span>🔒 Private</span>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
