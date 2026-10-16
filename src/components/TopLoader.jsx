import { useEffect, useState } from 'react'

/**
 * TopNavLoader
 * Delicate, glowing clay/gold progress line that slides across the top
 * when switching between pages / therapist profiles.
 */
export default function TopLoader({ isLoading }) {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let t1, t2, t3

    if (isLoading) {
      setVisible(true)
      setProgress(25)
      t1 = setTimeout(() => {
        setProgress(75)
      }, 120)
    } else {
      setProgress(100)
      t2 = setTimeout(() => {
        setVisible(false)
      }, 280)
      t3 = setTimeout(() => {
        setProgress(0)
      }, 400)
    }

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [isLoading])

  if (!visible && progress === 0) return null

  return (
    <div
      className={`top-nav-loader ${progress === 100 ? 'done' : ''}`}
      style={{ width: `${progress}%` }}
      role="progressbar"
      aria-label="Loading page"
    />
  )
}

