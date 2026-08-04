export default function Gallery({ accent, gallery }) {
  return (
    <div className="gallery">
      <div className="gallery-main" style={{ background: gallery.main }}>
        <svg width="96" height="96" viewBox="0 0 92 92">
          <circle cx="46" cy="34" r="18" fill={accent} />
          <path d="M12 86c0-20 15-32 34-32s34 12 34 32" fill={accent} />
        </svg>
      </div>
      <div className="gallery-thumbs">
        <div style={{ background: gallery.thumb1 }}>
          <svg width="60" height="60" viewBox="0 0 92 92">
            <circle cx="46" cy="16" r="8" fill={accent} />
            <circle cx="46" cy="38" r="16" fill={accent} />
            <path d="M14 86c0-18 14-30 32-30s32 12 32 30" fill={accent} />
          </svg>
        </div>
        <div style={{ background: gallery.thumb2 }}>
          <svg width="58" height="58" viewBox="0 0 34 34">
            <path
              d="M8 20c0-6 5-10 11-10h6c6 0 11 4 11 10v3c0 6-5 10-11 10H19c-6 0-11-4-11-10v-3z"
              fill={accent}
              opacity="0.85"
            />
            <path d="M11 17q9-6 18 0" stroke={gallery.main} strokeWidth="1.6" fill="none" />
          </svg>
        </div>
      </div>
    </div>
  )
}
