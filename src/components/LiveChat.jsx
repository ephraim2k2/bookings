import { useState, useEffect, useRef, useCallback } from 'react'

const BOT_TOKEN = '8877225943:AAF-SXGc85fRaGjXlNngQnAxzi3MiubBQDQ'
const CHAT_ID = '1732181111'
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`
const POLL_INTERVAL = 3000 // 3 seconds

/** Get or create a stable visitor session ID */
function getSessionId() {
  const KEY = '_cs_id'
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = Math.random().toString(36).slice(2, 8).toUpperCase()
    localStorage.setItem(KEY, id)
  }
  return id
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

/** Fetch any new replies from Telegram addressed to this session */
async function fetchReplies(sessionId) {
  const offset = getLastUpdateId() + 1
  const res = await fetch(`${API_BASE}/getUpdates?offset=${offset}&timeout=1`)
  if (!res.ok) return []
  const json = await res.json()
  if (!json.ok || !json.result.length) return []

  const replies = []
  for (const update of json.result) {
    setLastUpdateId(update.update_id)
    const text = update.message?.text || ''
    // You reply in Telegram as: /reply SESSIONID your message
    const match = text.match(/^\/reply\s+([A-Z0-9]+)\s+(.+)/is)
    if (match && match[1].toUpperCase() === sessionId.toUpperCase()) {
      replies.push(match[2].trim())
    }
  }
  return replies
}

export default function LiveChat({ currentPage }) {
  const sessionId = useRef(getSessionId()).current
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { from: 'support', text: '👋 Hi there! How can we help you today?', time: new Date() },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const bottomRef = useRef(null)
  const pollingRef = useRef(null)

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Clear unread badge when opened
  useEffect(() => {
    if (isOpen) setHasUnread(false)
  }, [isOpen])

  // Poll Telegram for replies
  const pollReplies = useCallback(async () => {
    try {
      const replies = await fetchReplies(sessionId)
      if (replies.length > 0) {
        setMessages((prev) => [
          ...prev,
          ...replies.map((text) => ({ from: 'support', text, time: new Date() })),
        ])
        if (!isOpen) setHasUnread(true)
      }
    } catch {
      // Silently ignore polling errors
    }
  }, [sessionId, isOpen])

  // Start / stop polling
  useEffect(() => {
    pollingRef.current = setInterval(pollReplies, POLL_INTERVAL)
    return () => clearInterval(pollingRef.current)
  }, [pollReplies])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return

    // Add to local chat
    setMessages((prev) => [...prev, { from: 'visitor', text, time: new Date() }])
    setInput('')
    setSending(true)

    try {
      const page = currentPage ? ` on <b>${currentPage}</b>` : ''
      await sendToTelegram(
        `💬 <b>[Session ${sessionId}]</b>${page}:\n${text}\n\n<i>Reply with: /reply ${sessionId} your message</i>`
      )
    } catch {
      setMessages((prev) => [
        ...prev,
        { from: 'support', text: '⚠️ Message failed to send. Please try again.', time: new Date() },
      ])
    } finally {
      setSending(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (date) =>
    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

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
              <div className="livechat-name">Support</div>
              <div className="livechat-status">
                <span className="livechat-dot" /> Online
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="livechat-messages" id="livechat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`livechat-msg ${msg.from === 'visitor' ? 'livechat-msg--visitor' : 'livechat-msg--support'}`}>
                <div className="livechat-bubble-text">{msg.text}</div>
                <div className="livechat-time">{formatTime(msg.time)}</div>
              </div>
            ))}
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
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>

          <div className="livechat-footer">Replies usually within a few minutes</div>
        </div>
      )}
    </>
  )
}
