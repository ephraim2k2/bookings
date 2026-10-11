import {
  WEB3FORMS_ACCESS_KEY,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
} from '../config.js'

/** Convert any image file (HEIC, PNG, large photos) into a standardized, compressed JPEG File */
export async function normalizeImageFile(file) {
  if (!file) return null
  if (typeof window === 'undefined' || typeof document === 'undefined') return file

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const maxDim = 1280
          let { width, height } = img
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width)
              width = maxDim
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height)
              height = maxDim
            }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(new File([blob], 'payment-proof.jpg', { type: 'image/jpeg' }))
              } else {
                resolve(file)
              }
            },
            'image/jpeg',
            0.85
          )
        } catch {
          resolve(file)
        }
      }
      img.onerror = () => resolve(file)
      img.src = e.target.result
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}

/** Convert a File or Blob into a compressed Base64 Data URL (safe in all browsers, zero external dependencies) */
export async function fileToDataUrl(file, maxWidth = 1000, quality = 0.8) {
  if (!file) return null
  if (typeof window === 'undefined' || typeof document === 'undefined') return null

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          const dataUrl = canvas.toDataURL(file.type || 'image/jpeg', quality)
          resolve(dataUrl)
        } catch {
          resolve(e.target.result)
        }
      }
      img.onerror = () => resolve(e.target.result)
      img.src = e.target.result
    }
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}

/**
 * Upload an image: attempts public hosting with a short 4s timeout,
 * and falls back gracefully to a robust Data URL. NEVER throws.
 */
export async function uploadImage(file) {
  if (!file) return null

  // 1. Try public host with a short timeout
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    const fallbackData = new FormData()
    fallbackData.append('file', file)
    const res = await fetch('https://tmpfiles.org/api/v1/upload', {
      method: 'POST',
      body: fallbackData,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      const json = await res.json()
      const rawUrl = json?.data?.url
      if (rawUrl) {
        return rawUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
      }
    }
  } catch (err) {
    console.warn('[uploadImage] Public host skipped/timed out:', err?.message)
  }

  // 2. Resilient fallback: data URL that never fails CORS
  try {
    const dataUrl = await fileToDataUrl(file)
    if (dataUrl) return dataUrl
  } catch (err) {
    console.warn('[uploadImage] Local fallback failed:', err)
  }

  return null
}

/**
 * Send payload to Telegram using both local dev proxy and direct Telegram API.
 * Local proxy completely bypasses browser adblockers and CORS restrictions.
 */
async function sendToTelegram(method, bodyOrFormData, isFormData = false) {
  const isBrowser = typeof window !== 'undefined'
  const isLocal =
    isBrowser &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.endsWith('.local'))

  // Prioritize local proxy on localhost to avoid adblocker/CORS blocks
  const bases = isLocal
    ? [
        `/api/telegram/bot${TELEGRAM_BOT_TOKEN}`,
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`,
      ]
    : [
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`,
        `/api/telegram/bot${TELEGRAM_BOT_TOKEN}`,
      ]

  let lastError = null

  for (const base of bases) {
    try {
      const url = `${base}/${method}`
      const options = {
        method: 'POST',
        body: isFormData ? bodyOrFormData : JSON.stringify(bodyOrFormData),
      }
      if (!isFormData) {
        options.headers = { 'Content-Type': 'application/json' }
      }

      const res = await fetch(url, options)
      const data = await res.json()
      if (data.ok) {
        return { ok: true, data }
      } else {
        lastError = data.description || `Telegram error ${data.error_code}`
        console.warn(`[Telegram ${method}] API error via ${base}:`, data)
      }
    } catch (err) {
      lastError = err?.message || 'Network request failed'
      console.warn(`[Telegram ${method}] Network error via ${base}:`, err)
    }
  }

  return { ok: false, error: lastError }
}

/** Send an automated booking confirmation email directly to the potential client (disabled) */
export async function sendClientConfirmationEmail() {
  return
}

/**
 * Submits a new booking:
 * 1. Normalizes and sends the payment proof screenshot + booking details directly to Telegram.
 * 2. If photo fails, sends as document; if that fails, sends full details via text message.
 * 3. Saves locally for record keeping.
 * 4. Silently notifies Web3Forms in background (non-blocking).
 */
export async function sendBookingSubmission({
  name,
  email,
  file,
  therapistName,
  sessionType,
  appointmentDate,
  appointmentTime,
  specialRequests,
  address,
  depositAmount,
  totalAmount,
  balanceDue: _balanceDue,
}) {
  const visitorId = (typeof localStorage !== 'undefined' && localStorage.getItem('_vid')) || 'N/A'
  const time = new Date().toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  // Clean plain text format: immune to HTML/Markdown parser errors, renders emojis natively
  const plainCaption = [
    `📋 NEW BOOKING SUBMITTED!`,
    ``,
    `💆 Therapist: ${therapistName}`,
    `👤 Client: ${name}`,
    `📧 Email: ${email}`,
    `📦 Session: ${sessionType || 'Session'}`,
    `📅 Date: ${appointmentDate || 'Not specified'}`,
    `⏰ Time: ${appointmentTime || 'Not specified'}`,
    `📍 Location: ${address || 'In-call'}`,
    `💰 Total Rate: ${totalAmount || depositAmount || 'N/A'}`,
    specialRequests ? `📝 Special Notes: ${specialRequests}` : null,
    ``,
    `🕐 Submission Time: ${time}`,
    `🆔 Visitor ID: ${visitorId}`,
  ]
    .filter(Boolean)
    .join('\n')

  let deliveryResult = { ok: false }

  // 1. Prepare and normalize image file into a standardized JPEG
  const preparedFile = file ? await normalizeImageFile(file) : null

  // 2. Attempt delivery with payment proof photo
  if (preparedFile) {
    const photoFd = new FormData()
    photoFd.append('chat_id', TELEGRAM_CHAT_ID)
    photoFd.append('photo', preparedFile, 'payment-proof.jpg')
    const captionText =
      plainCaption.length > 1020 ? plainCaption.slice(0, 1010) + '…' : plainCaption
    photoFd.append('caption', captionText)

    deliveryResult = await sendToTelegram('sendPhoto', photoFd, true)

    // Fallback: If sendPhoto returned error, try sendDocument
    if (!deliveryResult.ok) {
      console.warn('[Booking] sendPhoto failed, attempting sendDocument fallback...')
      const docFd = new FormData()
      docFd.append('chat_id', TELEGRAM_CHAT_ID)
      docFd.append('document', preparedFile, 'payment-proof.jpg')
      docFd.append('caption', captionText)
      deliveryResult = await sendToTelegram('sendDocument', docFd, true)
    }
  }

  // 3. Fallback: If photo couldn't be sent or no file, send complete booking text details
  if (!deliveryResult.ok) {
    console.warn('[Booking] Photo delivery unavailable, sending text details via sendMessage...')
    deliveryResult = await sendToTelegram('sendMessage', {
      chat_id: TELEGRAM_CHAT_ID,
      text: plainCaption,
    })
  }

  // If Telegram delivery succeeded, mark timestamp to avoid duplicate text alert
  if (deliveryResult.ok) {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('_last_booking_telegram', Date.now().toString())
    }
  } else {
    throw new Error(deliveryResult.error || 'Failed to connect to Telegram bot')
  }

  // 4. Save booking locally in localStorage for backup
  if (typeof localStorage !== 'undefined') {
    try {
      const existing = JSON.parse(localStorage.getItem('_submitted_bookings') || '[]')
      existing.push({
        id: Date.now(),
        name,
        email,
        therapistName,
        sessionType,
        appointmentDate,
        appointmentTime,
        address,
        totalAmount: totalAmount || depositAmount,
        specialRequests,
        createdAt: new Date().toISOString(),
      })
      localStorage.setItem('_submitted_bookings', JSON.stringify(existing))
    } catch (err) {
      console.warn('[Booking] Local storage write error:', err)
    }
  }

  // 5. Background Web3Forms submission (non-blocking)
  ;(async () => {
    try {
      const imgUrl = await uploadImage(file)
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `New booking request — ${therapistName} (${sessionType || 'Session'})`,
          from_name: 'Booking System',
          name,
          email,
          therapist: therapistName,
          session_duration: sessionType,
          appointment_date: appointmentDate || 'Not specified',
          appointment_time: appointmentTime || 'Not specified',
          special_requests: specialRequests || 'None',
          total_cost: totalAmount || depositAmount || 'N/A',
          hosting_option: address,
          proof_of_payment_url: imgUrl || 'Directly sent to Telegram bot',
        }),
      })
    } catch {
      // Ignored
    }
  })()

  return { success: true }
}


