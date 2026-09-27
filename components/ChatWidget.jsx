"use client";

import { useEffect, useRef, useState } from "react";

const MAX_MESSAGE_LENGTH = 1000;

const WELCOME_MESSAGE = {
  role: "model",
  text: "Hi, I'm Leinad! Ask me for game recommendations, how games compare, where to grab something, or anything else video-game related.",
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, sending, open]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const nextMessages = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          // The canned welcome message never went to Gemini, so it doesn't
          // belong in the history we send back to it either.
          history: nextMessages
            .filter((m) => m !== WELCOME_MESSAGE)
            .slice(0, -1)
            .map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      setMessages((prev) => [...prev, { role: "model", text: data.reply }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[520px] max-h-[70vh] w-[min(360px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-card border border-ink-700 bg-ink-900 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-ink-700 bg-ink-950 px-4 py-3">
            <div>
              <p className="font-display text-sm font-bold text-parchment-100">Leinad</p>
              <p className="text-xs text-parchment-500">Your helper AI chatbot for anything video games</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="flex h-7 w-7 items-center justify-center rounded-full text-parchment-300 hover:bg-ink-800 hover:text-parchment-100"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages */}
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m, i) => (
              <ChatBubble key={i} role={m.role} text={m.text} />
            ))}
            {sending && <TypingIndicator />}
            {error && (
              <p className="text-xs text-clay-500">Couldn't reach Leinad: {error}</p>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="flex items-end gap-2 border-t border-ink-700 p-3">
            <textarea
              rows={1}
              value={input}
              disabled={sending}
              maxLength={MAX_MESSAGE_LENGTH}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  handleSend(e);
                }
              }}
              placeholder="Ask about a game…"
              className="max-h-24 flex-1 resize-none rounded-card border border-ink-600 bg-ink-950 px-3 py-2 text-sm text-parchment-100 placeholder:text-parchment-500 focus:border-marigold-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="shrink-0 rounded-card bg-marigold-500 px-3 py-2 text-sm font-medium text-ink-950 transition-colors hover:bg-marigold-400 disabled:cursor-not-allowed disabled:bg-ink-700 disabled:text-parchment-500"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close game chat" : "Open game chat"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-marigold-500 text-ink-950 shadow-lg transition-transform hover:scale-105 hover:bg-marigold-400"
      >
        {open ? <CloseIcon large /> : <ChatIcon />}
      </button>
    </div>
  );
}

function ChatBubble({ role, text }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-card px-3 py-2 text-sm leading-relaxed ${
          isUser ? "bg-marigold-500 text-ink-950" : "bg-ink-800 text-parchment-100"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-card bg-ink-800 px-3 py-2.5">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-parchment-500 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-parchment-500 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-parchment-500" />
      </div>
    </div>
  );
}

function ChatIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8-1.06 0-2.075-.163-3.016-.463L3 21l1.395-4.185C3.512 15.42 3 13.766 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

function CloseIcon({ large = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={large ? "h-6 w-6" : "h-4 w-4"}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}