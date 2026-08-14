import { useEffect, useRef } from 'react'

export default function BlockedScreen() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let w = canvas.width = window.innerWidth
    let h = canvas.height = window.innerHeight

    const dots = Array.from({ length: 60 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.4 + 0.1,
    }))

    let raf
    function draw() {
      ctx.clearRect(0, 0, w, h)
      dots.forEach(d => {
        d.x += d.dx
        d.y += d.dy
        if (d.x < 0 || d.x > w) d.dx *= -1
        if (d.y < 0 || d.y > h) d.dy *= -1
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(180,120,100,${d.alpha})`
        ctx.fill()
      })
      raf = requestAnimationFrame(draw)
    }
    draw()

    const onResize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <div style={styles.root}>
      <canvas ref={canvasRef} style={styles.canvas} />

      {/* Radial glow */}
      <div style={styles.glow} />

      <div style={styles.card}>
        {/* Icon */}
        <div style={styles.iconWrap}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#c97c6d' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </div>

        {/* Label */}
        <span style={styles.label}>403 — Forbidden</span>

        {/* Heading */}
        <h1 style={styles.heading}>Access Restricted</h1>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Body */}
        <p style={styles.body}>
          Your access to this site has been permanently restricted.<br />
          If you believe this is an error, please reach out to support.
        </p>

        {/* Code badge */}
        <div style={styles.badge}>
          <span style={styles.badgeDot} />
          Access revoked
        </div>
      </div>

      {/* Bottom brand */}
      <p style={styles.brand}>Grove &amp; Stone · Private Wellness</p>
    </div>
  )
}

const styles = {
  root: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0c0b0b',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    overflow: 'hidden',
    userSelect: 'none',
  },
  canvas: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  },
  glow: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '520px',
    height: '520px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(180,80,60,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '20px',
    padding: '48px 52px',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
    maxWidth: '400px',
    width: '90vw',
    textAlign: 'center',
    animation: 'fadeUp 0.5s ease forwards',
  },
  iconWrap: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'rgba(201,124,109,0.1)',
    border: '1px solid rgba(201,124,109,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '4px',
  },
  label: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#c97c6d',
  },
  heading: {
    fontSize: '26px',
    fontWeight: 700,
    color: '#f0ece8',
    margin: 0,
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  },
  divider: {
    width: '40px',
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
    margin: '4px 0',
  },
  body: {
    fontSize: '14px',
    color: '#666',
    lineHeight: 1.7,
    margin: 0,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    background: 'rgba(201,80,60,0.08)',
    border: '1px solid rgba(201,80,60,0.18)',
    borderRadius: '999px',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: 500,
    color: '#b86050',
    marginTop: '6px',
    letterSpacing: '0.02em',
  },
  badgeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#c96050',
    boxShadow: '0 0 6px #c96050',
    animation: 'pulse 2s infinite',
  },
  brand: {
    position: 'absolute',
    bottom: '24px',
    fontSize: '11px',
    color: '#333',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    zIndex: 2,
  },
}

// Inject keyframes once
if (typeof document !== 'undefined' && !document.getElementById('blocked-screen-styles')) {
  const style = document.createElement('style')
  style.id = 'blocked-screen-styles'
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.3; }
    }
  `
  document.head.appendChild(style)
}
