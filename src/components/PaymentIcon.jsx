export default function PaymentIcon({ type, accent }) {
  switch (type) {
    case 'chime':
      return (
        <svg className="icon" viewBox="0 0 34 34" fill="none">
          <rect x="4" y="4" width="26" height="26" rx="8" stroke={accent} strokeWidth="1.6" />
          <path
            d="M17 10v14M13 13.5c0-2 2-3.5 4-3.5s4 1.5 4 3.5-2 3-4 3.5-4 1.5-4 3.5 2 3.5 4 3.5 4-1.5 4-3.5"
            stroke={accent}
            strokeWidth="1.4"
            fill="none"
          />
        </svg>
      )
    case 'zelle':
      return (
        <svg className="icon" viewBox="0 0 34 34" fill="none">
          <circle cx="17" cy="17" r="14" stroke={accent} strokeWidth="1.6" />
          <path
            d="M11 12h12l-12 10h12"
            stroke={accent}
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'venmo':
      return (
        <svg className="icon" viewBox="0 0 34 34" fill="none">
          <circle cx="17" cy="17" r="14" stroke={accent} strokeWidth="1.6" />
          <path
            d="M11 10l5 14 8-14"
            stroke={accent}
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'btc':
      return (
        <svg className="icon" viewBox="0 0 34 34" fill="none">
          <circle cx="17" cy="17" r="14" stroke={accent} strokeWidth="1.6" />
          <text x="17" y="23" fontSize="16" textAnchor="middle" fill={accent} fontFamily="serif">
            ฿
          </text>
        </svg>
      )
    default:
      return null
  }
}
