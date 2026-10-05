import { useState } from 'react'
import PaymentIcon from './PaymentIcon'

export default function PayCard({ type, label, value, accent }) {
  const [copied, setCopied] = useState(false)

  const isBtc = type === 'btc'

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const handleSupportClick = (e) => {
    e.preventDefault()
    const chatToggle = document.getElementById('livechat-toggle')
    if (chatToggle) {
      chatToggle.click()
    }
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
          <button
            type="button"
            onClick={handleSupportClick}
            className="copy-btn pay-card-support-btn"
            style={{ display: 'inline-block', marginTop: '6px', cursor: 'pointer' }}
          >
            Contact support →
          </button>
        )}
      </div>
    </div>
  )
}
