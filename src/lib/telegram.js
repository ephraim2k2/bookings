// ─── Telegram Bot Config ──────────────────────────────────────────────────────
const BOT_TOKEN = '8877225943:AAF-SXGc85fRaGjXlNngQnAxzi3MiubBQDQ'
const CHAT_ID = '1732181111'
const API = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Get or create a stable anonymous visitor ID stored in localStorage */
function getVisitorId() {
  const KEY = '_vid'
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = Math.random().toString(36).slice(2, 10).toUpperCase()
    localStorage.setItem(KEY, id)
  }
  return id
}

/** Is this visitor new or returning for a given profile? */
function getVisitorStatus(profileId) {
  const KEY = `_seen_${profileId}`
  const seen = localStorage.getItem(KEY)
  if (!seen) {
    localStorage.setItem(KEY, Date.now().toString())
    return '🆕 New visitor'
  }
  return '🔁 Returning visitor'
}

/** Increment and return the total visit count for a profile */
function incrementVisitCount(profileId) {
  const KEY = `_views_${profileId}`
  const count = parseInt(localStorage.getItem(KEY) || '0', 10) + 1
  localStorage.setItem(KEY, count.toString())
  return count
}

/** Detect referrer source */
function getReferrerSource() {
  const ref = document.referrer
  if (!ref) return '🔗 Direct / Typed URL'
  if (ref.includes('google')) return '🔍 Google Search'
  if (ref.includes('bing')) return '🔍 Bing Search'
  if (ref.includes('facebook') || ref.includes('fb.com')) return '📘 Facebook'
  if (ref.includes('instagram')) return '📸 Instagram'
  if (ref.includes('twitter') || ref.includes('x.com')) return '🐦 Twitter / X'
  if (ref.includes('whatsapp')) return '💬 WhatsApp'
  if (ref.includes('t.me') || ref.includes('telegram')) return '✈️ Telegram'
  if (ref.includes('tiktok')) return '🎵 TikTok'
  return `🌐 ${new URL(ref).hostname}`
}

/** Format current local time nicely */
function formatTime() {
  return new Date().toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  })
}

/** Escape special Markdown V2 characters for Telegram */
function esc(text) {
  return String(text).replace(/[_*[\]()~`>#+=|{}.!\\-]/g, '\\$&')
}

/** Send a raw message to Telegram */
async function sendTelegram(text) {
  try {
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'MarkdownV2',
      }),
    })
  } catch (err) {
    // Silently fail — never break the user experience
    console.warn('[Analytics] Telegram send failed:', err)
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Track a profile page visit. Call this when a profile page mounts.
 * Returns a cleanup function that reports time-on-page when called.
 */
export function trackProfileVisit(profileId, profileName) {
  const visitStart = Date.now()
  const visitorId = getVisitorId()
  const visitorStatus = getVisitorStatus(profileId)
  const visitCount = incrementVisitCount(profileId)
  const source = getReferrerSource()
  const time = formatTime()

  // Fire the visit notification immediately
  const msg = [
    `👤 *${esc(profileName)}'s profile was visited*`,
    ``,
    `🕐 *Time:* ${esc(time)}`,
    `${visitorStatus}`,
    `🆔 *Visitor ID:* \`${esc(visitorId)}\``,
    `📊 *Total views on this profile:* ${esc(visitCount)}`,
    `📍 *Traffic source:* ${esc(source)}`,
    `⏱️ _Time on page will be reported when they leave_`,
  ].join('\n')

  sendTelegram(msg)

  // Return a cleanup function for time-on-page reporting
  return function reportExit(didBook = false) {
    const seconds = Math.round((Date.now() - visitStart) / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    const duration =
      mins > 0 ? `${mins}m ${secs}s` : `${secs}s`

    const exitMsg = [
      `⏱️ *${esc(profileName)}'s visitor left*`,
      ``,
      `🆔 *Visitor ID:* \`${esc(visitorId)}\``,
      `⌛ *Time on page:* ${esc(duration)}`,
      `📋 *Booking form submitted:* ${didBook ? '✅ Yes' : '❌ No'}`,
    ].join('\n')

    sendTelegram(exitMsg)
  }
}

/**
 * Track a booking form submission. Call this after a successful booking.
 */
export function trackBookingSubmission({
  profileName,
  clientName,
  sessionType,
  appointmentDate,
  appointmentTime,
  specialRequests,
  hostingPreference,
  depositAmount,
  totalAmount,
  balanceDue,
}) {
  const visitorId = getVisitorId()
  const time = formatTime()

  const msg = [
    `📋 *New Booking Submitted\\!*`,
    ``,
    `💆 *Therapist:* ${esc(profileName)}`,
    `👤 *Client name:* ${esc(clientName)}`,
    `📦 *Session:* ${esc(sessionType)}`,
    `📅 *Date:* ${esc(appointmentDate || 'Not specified')}`,
    `⏰ *Time slot:* ${esc(appointmentTime || 'Not specified')}`,
    `📍 *Location:* ${esc(hostingPreference || 'In-call')}`,
    `💰 *Deposit Required:* ${esc(depositAmount || 'N/A')}`,
    `💵 *Balance at Meetup:* ${esc(balanceDue || 'N/A')}`,
    specialRequests ? `📝 *Special Notes:* ${esc(specialRequests)}` : null,
    ``,
    `🕐 *Submission Time:* ${esc(time)}`,
    `🆔 *Visitor ID:* \`${esc(visitorId)}\``,
  ]
    .filter(Boolean)
    .join('\n')

  sendTelegram(msg)
}

/**
 * Track a new therapist registration / sign-up application.
 */
export function trackTherapistRegistration({
  name,
  email,
  phone,
  whatsapp,
  city,
  bio,
  services,
  accessCode,
  slug,
  payment,
  photos,
}) {
  const visitorId = getVisitorId()
  const time = formatTime()

  const msg = [
    `🎉 *NEW THERAPIST REGISTRATION\\!*`,
    ``,
    `👤 *Name:* ${esc(name)}`,
    `📧 *Email:* ${esc(email)}`,
    `📞 *Phone:* ${esc(phone || 'Not provided')}`,
    `💬 *WhatsApp:* ${esc(whatsapp || 'Not provided')}`,
    `📍 *City / Location:* ${esc(city || 'Not provided')}`,
    `📝 *Bio:* ${esc(bio || 'None')}`,
    `✨ *Services / Tags:* ${esc(services || 'Standard')}`,
    ``,
    `💳 *Payment Handles:*`,
    `• Chime: \`${esc(payment?.chime || 'N/A')}\``,
    `• Zelle: \`${esc(payment?.zelle || 'N/A')}\``,
    `• Venmo: \`${esc(payment?.venmo || 'N/A')}\``,
    `• BTC: \`${esc(payment?.btc || 'N/A')}\``,
    ``,
    `🔑 *Generated Access Code:* \`${esc(accessCode)}\``,
    `🔗 *Private URL Slug:* \`#/${esc(slug)}\``,
    photos?.length ? `🖼️ *Photos Uploaded:* ${esc(photos.join(', '))}` : null,
    ``,
    `🕐 *Registered At:* ${esc(time)}`,
    `🆔 *Visitor ID:* \`${esc(visitorId)}\``,
  ]
    .filter(Boolean)
    .join('\n')

  sendTelegram(msg)
}
