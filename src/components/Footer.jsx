export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <span>© 2026 Grove &amp; Stone Studio</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'currentColor', opacity: 0.4, display: 'inline-block' }} />
          By appointment only
          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'currentColor', opacity: 0.4, display: 'inline-block' }} />
          Private &amp; Discreet
        </span>
      </div>
    </footer>
  )
}
