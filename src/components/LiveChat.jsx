import { useState, useEffect, useRef, useCallback } from 'react'

const BOT_TOKEN = '8877225943:AAF-SXGc85fRaGjXlNngQnAxzi3MiubBQDQ'
const CHAT_ID = '1732181111'
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`
const POLL_INTERVAL = 3000 // 3 seconds

const DEFAULT_WELCOME = {
  from: 'support',
  text: '👋 Hi there! How can we help you today?',
  time: new Date().toISOString(),
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

/** Send a message to your Telegram */
async function sendToTelegram(text) {
  await fetch(`${API_BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' }),
  })
}

/** Fetch any new replies or typing signals from Telegram addressed to this session */
async function fetchReplies(sessionId) {
  const offset = getLastUpdateId() + 1
  const res = await fetch(`${API_BASE}/getUpdates?offset=${offset}&timeout=1`)
  if (!res.ok) return { replies: [], typing: false }
  const json = await res.json()
  if (!json.ok || !json.result.length) return { replies: [], typing: false }

  const replies = []
  let typing = false

  for (const update of json.result) {
    setLastUpdateId(update.update_id)
    const text = update.message?.text || ''

    // 1. Reply command: /reply SESSIONID your message
    const replyMatch = text.match(/^\/reply\s+([A-Z0-9]+)\s+(.+)/is)
    if (replyMatch && replyMatch[1].toUpperCase() === sessionId.toUpperCase()) {
      replies.push(replyMatch[2].trim())
    }

    // 2. Typing command: /typing SESSIONID
    const typingMatch = text.match(/^\/typing\s+([A-Z0-9]+)/is)
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
  const [sending, setSending] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef(null)
  const pollingRef = useRef(null)
  const typingTimerRef = useRef(null)

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

      // If support sent typing command from Telegram
      if (typing) {
        setIsTyping(true)
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
        typingTimerRef.current = setTimeout(() => setIsTyping(false), 15000)
      }

      // If new replies arrived
      if (replies.length > 0) {
        setIsTyping(false)
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
        setMessages((prev) => [
          ...prev,
          ...replies.map((text) => ({ from: 'support', text, time: new Date().toISOString() })),
        ])
        if (!isOpen) setHasUnread(true)
      }
    } catch {
      // Silently ignore polling errors
    }
  }, [sessionId, isOpen])

  // Keep polling running continuously
  useEffect(() => {
    pollingRef.current = setInterval(pollReplies, POLL_INTERVAL)
    return () => {
      clearInterval(pollingRef.current)
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    }
  }, [pollReplies])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return

    const newMsg = { from: 'visitor', text, time: new Date().toISOString() }
    setMessages((prev) => [...prev, newMsg])
    setInput('')
    setSending(true)

    // Show instant typing animation to reassure the visitor
    setIsTyping(true)
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => setIsTyping(false), 14000)

    try {
      const page = currentPage ? ` on <b>${currentPage}</b>` : ''
      await sendToTelegram(
        `💬 <b>[Active Session ${sessionId}]</b>${page}:\n${text}\n\n<i>Reply in Telegram with:\n/reply ${sessionId} your message\n/typing ${sessionId} (shows typing dots)</i>`
      )
    } catch {
      setIsTyping(false)
      setMessages((prev) => [
        ...prev,
        {
          from: 'support',
          text: '⚠️ Message failed to send. Please try again.',
          time: new Date().toISOString(),
        },
      ])
    } finally {
      setSending(false)
    }
  }

  // Client ends the session explicitly from the front end
  const handleEndSession = async () => {
    setShowEndConfirm(false)
    setIsTyping(false)
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)

    try {
      await sendToTelegram(`🔴 <b>[Session ${sessionId}]</b>: Visitor has ended the chat session.`)
    } catch (err) {
      console.warn('Could not notify session end:', err)
    }

    // Reset session storage
    localStorage.removeItem('_cs_id')
    localStorage.removeItem('_cs_msgs')

    // Start fresh new session ID
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
      {/* Floating bubble */}
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

      {/* Chat window */}
      {isOpen && (
        <div className="livechat-window" role="dialog" aria-label="Live support chat">
          {/* Header */}
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

            {/* Prominent End Session Button in Header */}
            <button
              className="livechat-end-btn"
              onClick={() => setShowEndConfirm(true)}
              title="End this chat session"
              type="button"
            >
              End Chat ✕
            </button>
          </div>

          {/* End Confirmation Modal Overlay */}
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

          {/* Messages */}
          <div className="livechat-messages" id="livechat-messages">
            <div className="livechat-session-notice">
              This chat stays open until you end chat.
            </div>

            {messages.map((msg, i) => (
              <div key={i} className={`livechat-msg ${msg.from === 'visitor' ? 'livechat-msg--visitor' : 'livechat-msg--support'}`}>
                <div className="livechat-bubble-text">{msg.text}</div>
                <div className="livechat-time">{formatTime(msg.time)}</div>
              </div>
            ))}

            {/* Animated Typing Dots */}
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

          {/* Input */}
          <div className="livechat-input-area">
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
              disabled={!input.trim() || sending}
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
    </>
  )
}
