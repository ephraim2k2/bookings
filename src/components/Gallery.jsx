import { useState, useEffect } from 'react'
import ImageLightbox from './ImageLightbox'

export default function Gallery({ accent, gallery }) {
  const isImage = (val) => typeof val === 'string' && (val.startsWith('/') || val.startsWith('http') || val.includes('.'))

  const [activeSrc, setActiveSrc] = useState(gallery.main)
  const [lightboxSrc, setLightboxSrc] = useState(null)

  useEffect(() => {
    setActiveSrc(gallery.main)
  }, [gallery.main])

  const currentMain = activeSrc || gallery.main

  return (
    <>
      <div className="gallery" onContextMenu={(e) => e.preventDefault()}>
        <div
          className="gallery-main"
          onClick={() => isImage(currentMain) && setLightboxSrc(currentMain)}
          style={{
            background: isImage(currentMain) ? '#1a1a1a' : currentMain,
            cursor: isImage(currentMain) ? 'zoom-in' : 'default',
            position: 'relative',
          }}
          title={isImage(currentMain) ? 'Click to view full image' : ''}
        >
          {isImage(currentMain) ? (
            <img
              src={currentMain}
              alt="Profile main"
              draggable="false"
              onContextMenu={(e) => e.preventDefault()}
              style={{ width: '120%', height: '120%', objectFit: 'cover' }}
            />
          ) : (
            <svg width="96" height="96" viewBox="0 0 92 92">
              <circle cx="46" cy="34" r="18" fill={accent} />
              <path d="M12 86c0-20 15-32 34-32s34 12 34 32" fill={accent} />
            </svg>
          )}
        </div>
        <div className="gallery-thumbs">
          <div
            onClick={() => isImage(gallery.thumb1) && setActiveSrc(gallery.thumb1)}
            style={{
              background: isImage(gallery.thumb1) ? '#1a1a1a' : gallery.thumb1,
              cursor: isImage(gallery.thumb1) ? 'pointer' : 'default',
              overflow: 'hidden',
              border: currentMain === gallery.thumb1 ? `2px solid ${accent}` : '2px solid transparent',
              transition: 'border-color 0.2s ease',
            }}
          >
            {isImage(gallery.thumb1) ? (
              <img
                src={gallery.thumb1}
                alt="Thumbnail 1"
                draggable="false"
                onContextMenu={(e) => e.preventDefault()}
                style={{ width: '120%', height: '120%', objectFit: 'cover' }}
              />
            ) : (
              <svg width="60" height="60" viewBox="0 0 92 92">
                <circle cx="46" cy="16" r="8" fill={accent} />
                <circle cx="46" cy="38" r="16" fill={accent} />
                <path d="M14 86c0-18 14-30 32-30s32 12 32 30" fill={accent} />
              </svg>
            )}
          </div>
          <div
            onClick={() => isImage(gallery.thumb2) && setActiveSrc(gallery.thumb2)}
            style={{
              background: isImage(gallery.thumb2) ? '#1a1a1a' : gallery.thumb2,
              cursor: isImage(gallery.thumb2) ? 'pointer' : 'default',
              overflow: 'hidden',
              border: currentMain === gallery.thumb2 ? `2px solid ${accent}` : '2px solid transparent',
              transition: 'border-color 0.2s ease',
            }}
          >
            {isImage(gallery.thumb2) ? (
              <img
                src={gallery.thumb2}
                alt="Thumbnail 2"
                draggable="false"
                onContextMenu={(e) => e.preventDefault()}
                style={{ width: '120%', height: '120%', objectFit: 'cover' }}
              />
            ) : (
              <svg width="58" height="58" viewBox="0 0 34 34">
                <path
                  d="M8 20c0-6 5-10 11-10h6c6 0 11 4 11 10v3c0 6-5 10-11 10H19c-6 0-11-4-11-10v-3z"
                  fill={accent}
                  opacity="0.85"
                />
                <path d="M11 17q9-6 18 0" stroke={gallery.main} strokeWidth="1.6" fill="none" />
              </svg>
            )}
          </div>
        </div>
      </div>
      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </>
  )
}
