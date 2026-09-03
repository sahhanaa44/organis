import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, Bot, User } from "lucide-react";
import api from "../lib/api.js";

const SUGGESTIONS = [
  "How does compatibility scoring work?",
  "What happens after a match is found?",
  "What does 'human review' mean?",
  "How is my waitlist position determined?",
];

export default function Assistant() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello — I'm the Organis Assistant. I can explain how matching, compatibility scoring, and the allocation workflow work, and answer general questions about the platform. I don't have access to your personal medical records, and I never make allocation decisions.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setMessages((m) => [...m, { role: "user", content }]);
    setInput("");
    setLoading(true);
    try {
      const history = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));
      const { data } = await api.post("/assistant/ask", { question: content, history });
      setMessages((m) => [...m, { role: "assistant", content: data.answer, mode: data.mode }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "I ran into an issue answering that. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 pt-24 pb-8">
      <div className="mb-6">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-forest-600">
          <Sparkles size={13} /> Organis Assistant
        </p>
        <h1 className="mt-2 text-3xl">Ask about matching, allocation, or your status.</h1>
        <p className="mt-2 text-sm text-stone-500">
          Educational and informational only — not a source of medical advice or a substitute for clinical judgment.
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-stone-200 bg-white p-6">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                m.role === "user" ? "bg-charcoal text-warmwhite" : "bg-forest-50 text-forest-700"
              }`}
            >
              {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user" ? "bg-charcoal text-warmwhite" : "bg-stone-50 text-charcoal"
              }`}
            >
              {m.content}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 pl-11 text-xs text-stone-400">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-300 [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-300 [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-300" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="rounded-full border border-stone-200 px-3 py-1.5 text-xs text-stone-600 transition-colors hover:border-forest-400 hover:text-forest-700"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="mt-4 flex items-center gap-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="input-field"
        />
        <button type="submit" className="btn-primary !px-5 !py-3">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
