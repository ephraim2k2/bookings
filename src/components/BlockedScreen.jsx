export default function BlockedScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f0f0f',
      color: '#fff',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center',
      padding: '2rem',
      gap: '1rem',
    }}>
      <div style={{ fontSize: '3rem' }}>🚫</div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Access Denied</h1>
      <p style={{ color: '#888', margin: 0, maxWidth: '320px', lineHeight: 1.6 }}>
        Your access to this site has been restricted. If you believe this is a mistake, please contact support.
      </p>
    </div>
  )
}
