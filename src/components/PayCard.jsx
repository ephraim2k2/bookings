import { useState } from 'react'
import PaymentIcon from './PaymentIcon'

export default function PayCard({ type, label, value, accent }) {
  const [copied, setCopied] = useState(false)

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
        <div className="value">{value}</div>
        <button className="copy-btn" onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}
