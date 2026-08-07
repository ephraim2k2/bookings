import { useState } from 'react'
import PaymentIcon from './PaymentIcon'

export default function PayCard({ type, label, value, accent, whatsappPhone = '14302939043' }) {
  const [copied, setCopied] = useState(false)

  const isBtc = type === 'btc'
  const cleanPhone = String(whatsappPhone).replace(/[^0-9]/g, '')
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=Hello%2C%20I%20would%20like%20to%20request%20payment%20details%20for%20${encodeURIComponent(
    label
  )}`

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="pay-card-mini">
      <PaymentIcon type={type} accent={accent} />
      <div>
        <h4>{label}</h4>
        {isBtc ? (
          <>
            <div className="value">{value}</div>
            <button className="copy-btn" onClick={handleCopy}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </>
        ) : (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="copy-btn pay-card-support-btn"
            style={{ textDecoration: 'none', display: 'inline-block', marginTop: '6px' }}
          >
            Contact support →
          </a>
        )}
      </div>
    </div>
  )
}
