import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bot, Loader2, MessageSquare, Send, Sparkles, X } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const QUICK_PROMPTS_BY_ROUTE: Record<string, string[]> = {
  '/cars': [
    'Which Blord electric car is best under ₦30M?',
    'How do I pay in USDT or Naira for BYD Atto 3?',
    'Compare BYD Seagull and BYD Song Plus EV.',
  ],
  '/power-tank': [
    'Which Blunt Power Tank can run my 1.5HP AC & fridge?',
    'What is the price of the 5,000W and 10,000W Power Tanks?',
    'Compare 3,000W vs 1,500W Blunt solar generators.',
  ],
  '/contact-us': [
    'Where is the Awka Head Office and how do I drive there?',
    'What is the address of the Lagos Lekki branch?',
    'How do I contact the China Guangzhou procurement office?',
  ],
};

const DEFAULT_PROMPTS = [
  'What electric cars does Blord sell and what are the prices?',
  'Show me Blunt Power Tank capacities and prices.',
  'How does Billpoint, Dolla USD card, or Bitshop work?',
  'Where are your 10 offices located?',
];

function renderFormattedText(text: string) {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={lineIdx} className="h-2" />;

    // Split bold **...** and URLs cleanly without HTML injection
    const tokens = trimmed.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s)]+)/g);
    const rendered = tokens.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={i} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (/^https?:\/\//.test(part)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#fe6d2c] underline decoration-[#fe6d2c]/60 underline-offset-2 hover:text-[#ff9464]"
          >
            {part}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return (
        <div key={lineIdx} className="mt-1 flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#fe6d2c]" />
          <div className="flex-1">{rendered}</div>
        </div>
      );
    }

    return (
      <p key={lineIdx} className={lineIdx > 0 ? 'mt-1.5' : ''}>
        {rendered}
      </p>
    );
  });
}

export function BlordAiBot() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! I am **Blord AI**, your intelligent Blord Group assistant. Ask me about **Blord Electric Cars**, **Blunt Power Tanks & capacities**, **Billpoint / Bitshop / Dolla**, **China sourcing**, or directions to any of our **10 offices**.',
    },
  ]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const msgCounterRef = useRef(1);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, busy]);

  const quickPrompts = QUICK_PROMPTS_BY_ROUTE[pathname] ?? DEFAULT_PROMPTS;

  async function sendQuestion(questionText: string, isRetry = false) {
    const q = questionText.trim();
    if (!q || busy) return;

    setErrorMsg('');
    let nextMessages = messages;
    if (!isRetry) {
      msgCounterRef.current += 1;
      const userMsg: ChatMessage = {
        id: `u-${msgCounterRef.current}`,
        role: 'user',
        text: q,
      };
      nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput('');
    }
    setBusy(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: q,
          currentPath: pathname,
          history: nextMessages
            .filter((m) => m.id !== 'welcome')
            .slice(-8)
            .map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Unable to reach Blord AI right now.');
        return;
      }

      msgCounterRef.current += 1;
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${msgCounterRef.current}`,
          role: 'assistant',
          text: data.reply,
        },
      ]);
    } catch {
      setErrorMsg('Network error communicating with Blord AI. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {open && (
        <section
          aria-label="Blord AI Concierge"
          className="mb-3 flex h-[520px] w-[min(92vw,400px)] flex-col overflow-hidden rounded-2xl border border-white/20 bg-[#0b0f19]/95 shadow-2xl backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/15 bg-gradient-to-r from-[#fe6d2c]/25 via-[#0f131c]/90 to-[#0f131c]/90 px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fe6d2c] text-white shadow-md">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-sm font-bold text-white">Blord AI Concierge</h2>
                <p className="text-[11px] text-slate-300">
                  Smart Assistant · Live Pricing & Locations
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close Blord AI Concierge"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 transition-colors hover:bg-white/15"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#fe6d2c] font-medium text-white'
                      : 'border border-white/15 bg-white/[0.06] text-slate-200'
                  }`}
                >
                  {msg.role === 'user' ? msg.text : renderFormattedText(msg.text)}
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-xs text-slate-300">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#fe6d2c]" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}

            {errorMsg && (
              <div
                role="alert"
                className="flex items-start justify-between gap-2 rounded-xl border border-red-500/40 bg-red-500/15 px-3 py-2.5 text-xs text-red-200"
              >
                <span className="min-w-0 flex-1 break-words leading-relaxed">{errorMsg}</span>
                {messages.some((m) => m.role === 'user') && (
                  <button
                    type="button"
                    onClick={() => {
                      const lastUser = [...messages].reverse().find((m) => m.role === 'user');
                      if (lastUser) void sendQuestion(lastUser.text, true);
                    }}
                    className="shrink-0 rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-white/25"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Suggested Prompts */}
          {messages.length <= 2 && !busy && (
            <div className="border-t border-white/10 bg-white/[0.02] px-3 py-2.5">
              <p className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <Sparkles className="h-3 w-3 text-[#fe6d2c]" />
                <span>Quick Questions</span>
              </p>
              <div className="flex flex-col gap-1.5">
                {quickPrompts.slice(0, 3).map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendQuestion(prompt)}
                    className="rounded-lg border border-white/15 bg-white/[0.04] px-2.5 py-1.5 text-left text-[11px] text-slate-200 transition-colors hover:border-[#fe6d2c]/60 hover:bg-[#fe6d2c]/15"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendQuestion(input);
            }}
            className="flex items-center gap-2 border-t border-white/15 bg-[#07090e]/80 px-3 py-3"
          >
            <label htmlFor="blord-ai-input" className="sr-only">
              Ask Blord AI a question
            </label>
            <input
              id="blord-ai-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about cars, power tanks, prices..."
              className="flex-1 rounded-xl border border-white/20 bg-white/[0.06] px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:border-[#fe6d2c] focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send message to Blord AI"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fe6d2c] text-white transition-colors hover:bg-[#ff7f44] disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      )}

      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={open ? 'Minimize Blord AI Concierge' : 'Open Blord AI Concierge'}
        className="group flex items-center gap-2.5 rounded-2xl border border-white/25 bg-[#fe6d2c] px-4 py-3 text-sm font-semibold text-white shadow-xl transition-all hover:bg-[#ff7f44] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <MessageSquare className="h-5 w-5" />
        <span>{open ? 'Close AI' : 'Ask Blord AI'}</span>
      </button>
    </div>
  );
}
