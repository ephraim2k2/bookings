import { useState, useEffect, useRef, useCallback } from 'react'
import ImageLightbox from './ImageLightbox'

const BOT_TOKEN = '8877225943:AAF-SXGc85fRaGjXlNngQnAxzi3MiubBQDQ'
const CHAT_ID = '1732181111'
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`
const POLL_INTERVAL = 3000 // 3 seconds

const DEFAULT_WELCOME = {
  from: 'support',
  text: '👋 Hi there! How can we help you today?',
  time: new Date().toISOString(),
}

/** Compress image to a clean Data URL so it NEVER breaks, expires, or fails CORS */
function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.75) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(dataUrl)
      }
      img.onerror = () => resolve(e.target.result)
      img.src = e.target.result
    }
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}

/** Get or create a stable visitor session ID that stays active */
function getSessionId() {
  const KEY = '_cs_id'
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = Math.random().toString(36).slice(2, 8).toUpperCase()
    localStorage.setItem(KEY, id)
  }
  return id
}

/** Load stored messages from localStorage so session never closes unexpectedly */
function loadStoredMessages() {
  try {
    const raw = localStorage.getItem('_cs_msgs')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (err) {
    console.warn('[LiveChat] Failed to load messages:', err)
  }
  return [DEFAULT_WELCOME]
}

/** Save messages to localStorage */
function saveMessages(msgs) {
  try {
    localStorage.setItem('_cs_msgs', JSON.stringify(msgs))
  } catch (err) {
    console.warn('[LiveChat] Failed to save messages:', err)
  }
}

/** Get or set the last processed Telegram update ID */
function getLastUpdateId() {
  return parseInt(localStorage.getItem('_cs_upd') || '0', 10)
}
function setLastUpdateId(id) {
  localStorage.setItem('_cs_upd', id.toString())
}

/** Send text message to Telegram */
async function sendToTelegram(text) {
  await fetch(`${API_BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' }),
  })
}

/** Send photo file directly to Telegram bot */
async function sendPhotoToTelegram(file, caption) {
  const formData = new FormData()
  formData.append('chat_id', CHAT_ID)
  formData.append('photo', file)
  if (caption) {
    formData.append('caption', caption)
    formData.append('parse_mode', 'HTML')
  }

  const res = await fetch(`${API_BASE}/sendPhoto`, {
    method: 'POST',
    body: formData,
  })
  return res.ok
}

/** Fetch photo file URL from Telegram API as Data URL to prevent CORS/broken link errors */
async function getTelegramFileAsDataUrl(fileId) {
  try {
    const res = await fetch(`${API_BASE}/getFile?file_id=${fileId}`)
    const json = await res.json()
    if (json.ok && json.result?.file_path) {
      const imgUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${json.result.file_path}`
      const imgRes = await fetch(imgUrl)
      if (imgRes.ok) {
        const blob = await imgRes.blob()
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(blob)
        })
      }
      return imgUrl
    }
  } catch (err) {
    console.warn('[LiveChat] getFileAsDataUrl error:', err)
  }
  return null
}

/** Fetch any new replies or typing signals from Telegram addressed to this session */
async function fetchReplies(sessionId) {
  const offset = getLastUpdateId() + 1
  const res = await fetch(`${API_BASE}/getUpdates?offset=${offset}&timeout=1`)
  if (!res.ok) return { replies: [], typing: false }
  const json = await res.json()
  if (!json.ok || !json.result?.length) return { replies: [], typing: false }

  const replies = []
  let typing = false

  for (const update of json.result) {
    setLastUpdateId(update.update_id)
    const msgObj = update.message || update.channel_post
    if (!msgObj) continue

    const text = (msgObj.text || msgObj.caption || '').trim()
    const photos = msgObj.photo

    // 1. Reply command: /reply SESSIONID optional message
    const replyMatch = text.match(/^\/reply\s+([A-Z0-9]+)(?:\s+([\s\S]+))?$/i)

    if (replyMatch && replyMatch[1].toUpperCase() === sessionId.toUpperCase()) {
      let replyText = (replyMatch[2] || '').trim()
      let imageUrl = null

      if (photos && photos.length > 0) {
        const largestPhoto = photos[photos.length - 1]
        imageUrl = await getTelegramFileAsDataUrl(largestPhoto.file_id)
      } else {
        const urlMatch = replyText.match(/(https?:\/\/[^\s]+?\.(?:png|jpe?g|gif|webp)|data:image\/[^\s]+)/i)
        if (urlMatch) {
          imageUrl = urlMatch[0]
          replyText = replyText.replace(urlMatch[0], '').trim()
        }
      }

      if (replyText || imageUrl) {
        replies.push({ text: replyText, imageUrl })
      }
    }

    // 2. Typing command: /typing SESSIONID
    const typingMatch = text.match(/^\/typing\s+([A-Z0-9]+)/i)
    if (typingMatch && typingMatch[1].toUpperCase() === sessionId.toUpperCase()) {
      typing = true
    }
  }
  return { replies, typing }
}

export default function LiveChat({ currentPage }) {
  const [sessionId, setSessionId] = useState(getSessionId)
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState(loadStoredMessages)
  const [input, setInput] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedPreview, setSelectedPreview] = useState(null)
  const [sending, setSending] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [lightboxImg, setLightboxImg] = useState(null)

  const bottomRef = useRef(null)
  const pollingRef = useRef(null)
  const typingTimerRef = useRef(null)
  const fileInputRef = useRef(null)

  // Sync messages to localStorage whenever they change
  useEffect(() => {
    saveMessages(messages)
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Clear unread badge when opened
  useEffect(() => {
    if (isOpen) setHasUnread(false)
  }, [isOpen])

  // Poll Telegram for replies and typing indicators continuously
  const pollReplies = useCallback(async () => {
    try {
      const { replies, typing } = await fetchReplies(sessionId)

      if (typing) {
        setIsTyping(true)
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
        typingTimerRef.current = setTimeout(() => setIsTyping(false), 15000)
      }

      if (replies.length > 0) {
        setIsTyping(false)
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
        setMessages((prev) => [
          ...prev,
          ...replies.map((item) => ({
            from: 'support',
            text: item.text,
            imageUrl: item.imageUrl,
            time: new Date().toISOString(),
          })),
        ])
        if (!isOpen) setHasUnread(true)
      }
    } catch {
      // Silently ignore polling errors
    }
  }, [sessionId, isOpen])

  useEffect(() => {
    pollingRef.current = setInterval(pollReplies, POLL_INTERVAL)
    return () => {
      clearInterval(pollingRef.current)
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    }
  }, [pollReplies])

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)

    // Generate lightweight data URL preview
    const previewDataUrl = await compressImage(file, 300, 300, 0.7)
    setSelectedPreview(previewDataUrl)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setSelectedPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSend = async () => {
    const text = input.trim()
    const fileToSend = selectedFile

    if (!text && !fileToSend) return
    if (sending) return

    setSending(true)

    let imageDataUrl = null
    if (fileToSend) {
      // Compress image for reliable 100% data URL storage
      imageDataUrl = await compressImage(fileToSend, 800, 800, 0.75)
    }

    // Append message with self-contained Data URL image that never breaks
    const newMsg = {
      from: 'visitor',
      text,
      imageUrl: imageDataUrl,
      time: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, newMsg])

    // Reset input fields
    setInput('')
    setSelectedFile(null)
    setSelectedPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''

    setIsTyping(true)
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => setIsTyping(false), 14000)

    try {
      const page = currentPage ? ` on <b>${currentPage}</b>` : ''

      if (fileToSend) {
        const caption = `🖼️ <b>[Active Session ${sessionId}]</b>${page}:\n${text || '<i>[Image attached]</i>'}\n\n<i>Reply in Telegram with:\n/reply ${sessionId} your message\n(Or send a photo with caption: /reply ${sessionId})</i>`

        // Send binary photo directly to Telegram bot
        const sent = await sendPhotoToTelegram(fileToSend, caption)

        if (!sent) {
          // Fallback if sendPhoto failed
          await sendToTelegram(
            `🖼️ <b>[Active Session ${sessionId}]</b>${page}:\n${text || '<i>[Image attached]</i>'}\n\n<i>Reply with: /reply ${sessionId} your message</i>`
          )
        }
      } else {
        await sendToTelegram(
          `💬 <b>[Active Session ${sessionId}]</b>${page}:\n${text}\n\n<i>Reply in Telegram with:\n/reply ${sessionId} your message\n/typing ${sessionId} (shows typing dots)</i>`
        )
      }
    } catch (err) {
      console.warn('[LiveChat] Telegram send error:', err)
      setIsTyping(false)
    } finally {
      setSending(false)
    }
  }

  const handleEndSession = async () => {
    setShowEndConfirm(false)
    setIsTyping(false)
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)

    try {
      await sendToTelegram(`🔴 <b>[Session ${sessionId}]</b>: Visitor has ended the chat session.`)
    } catch (err) {
      console.warn('Could not notify session end:', err)
    }

    localStorage.removeItem('_cs_id')
    localStorage.removeItem('_cs_msgs')

    const newId = Math.random().toString(36).slice(2, 8).toUpperCase()
    localStorage.setItem('_cs_id', newId)
    setSessionId(newId)
    setMessages([
      {
        from: 'support',
        text: 'Session ended. Thank you! How can we assist you with anything else?',
        time: new Date().toISOString(),
      },
    ])
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (timeVal) => {
    const date = new Date(timeVal)
    return isNaN(date.getTime())
      ? ''
      : date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  return (
    <>
      <button
        className="livechat-bubble"
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? 'Close live chat' : 'Open live chat'}
        id="livechat-toggle"
      >
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
          </svg>
        )}
        {hasUnread && !isOpen && <span className="livechat-badge" />}
      </button>

      {isOpen && (
        <div className="livechat-window" role="dialog" aria-label="Live support chat">
          <div className="livechat-header">
            <div className="livechat-avatar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </div>
            <div className="livechat-header-text">
              <div className="livechat-name">Live Support</div>
              <div className="livechat-status">
                <span className="livechat-dot" /> {isTyping ? 'Typing…' : 'Online'}
              </div>
            </div>

            <button
              className="livechat-end-btn"
              onClick={() => setShowEndConfirm(true)}
              title="End this chat session"
              type="button"
            >
              End Chat ✕
            </button>
          </div>

          {showEndConfirm && (
            <div className="livechat-confirm-overlay">
              <div className="livechat-confirm-box">
                <h4>End this chat session?</h4>
                <p>
                  Ending this session will clear your message history and notify support.
                </p>
                <div className="livechat-confirm-actions">
                  <button className="confirm-btn-yes" onClick={handleEndSession} type="button">
                    Yes, End Session
                  </button>
                  <button className="confirm-btn-no" onClick={() => setShowEndConfirm(false)} type="button">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="livechat-messages" id="livechat-messages">
            <div className="livechat-session-notice">
              This chat stays open until you end chat.
            </div>

            {messages.map((msg, i) => (
              <div key={i} className={`livechat-msg ${msg.from === 'visitor' ? 'livechat-msg--visitor' : 'livechat-msg--support'}`}>
                <div className="livechat-bubble-text">
                  {msg.text && <div>{msg.text}</div>}
                  {msg.imageUrl && (
                    <div className="livechat-img-wrapper" onClick={() => setLightboxImg(msg.imageUrl)}>
                      <img
                        src={msg.imageUrl}
                        alt="Chat attachment"
                        className="livechat-img"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="livechat-time">{formatTime(msg.time)}</div>
              </div>
            ))}

            {isTyping && (
              <div className="livechat-msg livechat-msg--support">
                <div className="livechat-bubble-text livechat-typing-bubble">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
                <div className="livechat-time">Support is typing…</div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {selectedPreview && (
            <div className="livechat-image-preview-bar">
              <img src={selectedPreview} alt="Selected preview" className="livechat-preview-thumb" />
              <span>Image attached</span>
              <button type="button" className="livechat-preview-remove" onClick={handleRemoveFile}>
                ✕
              </button>
            </div>
          )}

          <div className="livechat-input-area">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="livechat-attach-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Attach an image"
              disabled={sending}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
              </svg>
            </button>

            <textarea
              className="livechat-input"
              placeholder="Type your message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              id="livechat-input"
              disabled={sending}
            />
            <button
              className="livechat-send"
              onClick={handleSend}
              disabled={(!input.trim() && !selectedFile) || sending}
              aria-label="Send message"
              id="livechat-send"
              type="button"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>

          <div className="livechat-footer">
            <span>Support online</span>
            <button
              className="livechat-footer-end-link"
              onClick={() => setShowEndConfirm(true)}
              type="button"
            >
              End Session ✕
            </button>
          </div>
        </div>
      )}

      {lightboxImg && (
        <ImageLightbox src={lightboxImg} onClose={() => setLightboxImg(null)} />
      )}
    </>
  )
}
