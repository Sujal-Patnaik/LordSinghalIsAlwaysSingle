import { useState, useRef, useEffect, useCallback } from "react";
import { FiMessageCircle, FiX, FiSend, FiWind } from "react-icons/fi";
import "./ChatBot.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const SUGGESTIONS = [
  "Why is AQI high in Delhi during winter?",
  "What is PM2.5 and why is it dangerous?",
  "How does monsoon affect air quality?",
  "Health tips for high pollution days",
];

/**
 * Renders basic markdown-like formatting:
 *  - **bold**
 *  - bullet points (lines starting with - or •)
 *  - numbered lists
 *  - paragraphs (double newline)
 */
function formatBotReply(text) {
  // Split into paragraphs
  const paragraphs = text.split(/\n{2,}/);

  return paragraphs.map((para, pi) => {
    const lines = para.split("\n");

    // Check if this paragraph is a list
    const isList = lines.every(
      (l) => /^\s*[-•*]\s/.test(l) || /^\s*\d+[.)]\s/.test(l) || l.trim() === ""
    );

    if (isList) {
      const items = lines.filter((l) => l.trim() !== "");
      return (
        <ul key={pi}>
          {items.map((item, i) => (
            <li key={i}>
              {inlineFormat(item.replace(/^\s*[-•*\d.)]+\s*/, ""))}
            </li>
          ))}
        </ul>
      );
    }

    return <p key={pi}>{inlineFormat(para.replace(/\n/g, " "))}</p>;
  });
}

/** Handle **bold** inline formatting */
function inlineFormat(text) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  function handleToggle() {
    if (isOpen) {
      setIsClosing(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
      }, 250);
    } else {
      setIsOpen(true);
    }
  }

  async function sendMessage(text) {
    const trimmed = (text || input).trim();
    if (!trimmed || isLoading) return;

    const userMsg = { role: "user", content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setError("");
    setIsLoading(true);

    // Auto-resize textarea back
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
    }

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get response");
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      setError("Oops! Couldn't reach AirPulse Assistant. Try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleTextareaInput(e) {
    setInput(e.target.value);
    // Auto-resize
    e.target.style.height = "40px";
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
  }

  return (
    <>
      {/* ── Chat Panel ── */}
      {isOpen && (
        <div className={`chat-panel ${isClosing ? "closing" : ""}`}>
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-avatar">
              <FiWind />
            </div>
            <div className="chat-header-info">
              <h3>AirPulse Assistant</h3>
              <p>
                <span className="status-dot" /> AQI &amp; Weather Expert
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.length === 0 && !isLoading ? (
              <div className="chat-welcome">
                <div className="chat-welcome-icon">🌬️</div>
                <h4>Hi! I&apos;m AirPulse Assistant</h4>
                <p>
                  Ask me anything about air quality, pollution trends, weather
                  impacts, or health advisories for Indian cities.
                </p>
                <div className="chat-suggestions">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      className="chat-suggestion-btn"
                      onClick={() => sendMessage(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div key={i} className={`chat-msg ${msg.role}`}>
                    <div className="chat-msg-avatar">
                      {msg.role === "assistant" ? (
                        <FiWind />
                      ) : (
                        "👤"
                      )}
                    </div>
                    <div className="chat-msg-bubble">
                      {msg.role === "assistant"
                        ? formatBotReply(msg.content)
                        : msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="chat-msg assistant">
                    <div className="chat-msg-avatar">
                      <FiWind />
                    </div>
                    <div className="chat-msg-bubble">
                      <div className="typing-indicator">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error */}
          {error && <div className="chat-error">{error}</div>}

          {/* Input */}
          <div className="chat-input-area">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask about AQI, pollution, weather..."
              rows={1}
              disabled={isLoading}
            />
            <button
              className="chat-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              title="Send message"
            >
              <FiSend />
            </button>
          </div>
        </div>
      )}

      {/* ── FAB ── */}
      <button
        className={`chat-fab ${isOpen ? "open" : ""}`}
        onClick={handleToggle}
        title={isOpen ? "Close chat" : "Chat with AirPulse Assistant"}
        id="chat-toggle-fab"
      >
        <span className="fab-icon">
          {isOpen ? <FiX /> : <FiMessageCircle />}
        </span>
      </button>
    </>
  );
}
