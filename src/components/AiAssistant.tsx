import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Minus, Send, Sparkles, User, RefreshCw, Copy, Check, ExternalLink } from 'lucide-react';
import './AiAssistant.css';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const SUGGESTED_QUESTIONS = [
  'Explore ECE Background',
  'Explore VLSI Interests',
  "Tell me about Elder's Veil",
  'Explain CONVET PULSE',
  'Web Development Skills',
  'Open Resume',
  'Contact Sridhar',
];

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  sender: 'assistant',
  text: "Hello! I'm the Beyond the Circuit assistant. I can help you explore Sridhar's engineering interests, development skills, projects, certifications and professional background.\n\n[action:ece:Explore ECE Section] [action:projects:View Projects] [action:resume:Open Resume]",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

// Client-side fallback knowledge engine in case server is offline or unreachable
function getClientFallbackAnswer(q: string): string {
  const query = q.toLowerCase();
  if (query.includes('ece') || query.includes('hardware') || query.includes('vlsi') || query.includes('verilog') || query.includes('circuit')) {
    return `In hardware engineering, Sridhar focuses on:
• Digital Electronics & Logic Design (adders, multiplexers, decoders, flip-flops)
• Verilog HDL and synthesizable RTL architectures
• Computer Organization & Architecture
• Embedded Systems & Serial Protocols (UART, SPI, I2C)
• CMOS fundamentals and VLSI digital design flows.
Explore the dedicated ECE section for interactive logic gates and Verilog code!

[action:ece:Open ECE Section]`;
  }
  if (query.includes("elder's veil") || query.includes('comic') || query.includes('manga')) {
    return `Elder's Veil is a full-stack comic reading platform built with JavaScript, Node.js, Express.js, and PostgreSQL. It features OTP authentication, creator workflows, and an admin dashboard.

[action:projects:View Elder's Veil]`;
  }
  if (query.includes('convet') || query.includes('pulse') || query.includes('converter')) {
    return `CONVET PULSE is an engineering radix and unit conversion platform covering number bases (binary, octal, hex, two's complement), RF signal wavelength transformations, and data capacity units.

[action:projects:View CONVET PULSE] [action:ece:Try ECE Converter]`;
  }
  if (query.includes('skill') || query.includes('tech') || query.includes('stack') || query.includes('software') || query.includes('react')) {
    return `Sridhar's technical stack:
• Frontend: React 19, TypeScript, JavaScript (ES6+), HTML5, CSS3, Framer Motion
• Backend: Node.js, Express.js, REST APIs
• Databases: PostgreSQL (Neon Serverless), Firebase Realtime DB, SQLite
• Tools & DevOps: Git, GitHub, Render, Vite, Vitest.

[action:skills:View Skills Dashboard]`;
  }
  if (query.includes('project') || query.includes('built') || query.includes('portfolio')) {
    return `Sridhar has engineered both hardware and software projects:
1. Beyond the Circuit — Personal engineering portfolio with live visitor analytics & circuit simulations
2. Elder's Veil — Comic and manga reading platform (PostgreSQL, Node.js)
3. CONVET PULSE — Engineering radix and unit conversion platform
4. Portfolio Manager — Indian investment tracking dashboard (SQLite, XIRR)
5. Kabaddi Pro — Tournament management web app with automated PDF export.

[action:projects:View Projects Section]`;
  }
  if (query.includes('education') || query.includes('college')) {
    return `Sridhar is pursuing a Bachelor of Engineering (B.E.) in Electronics and Communication Engineering at J.N.N. Institute of Engineering, Tamil Nadu, India (Expected Graduation: 2029).

[action:about:View Education]`;
  }
  if (query.includes('internship') || query.includes('experience')) {
    return `Sridhar's internships:
• Codec Technologies: Digital Electronics & VLSI Intern (AICTE & ICAC Approved, July-Aug 2026)
• CodeAlpha: Frontend Development Intern (Scheduled July 2026).

[action:experience:View Experience]`;
  }
  if (query.includes('contact') || query.includes('hire') || query.includes('email') || query.includes('reach')) {
    return `You can reach Sridhar directly:
• Email: sridharvpr7@gmail.com
• GitHub: https://github.com/sridharvpr7
• LinkedIn: https://linkedin.com/in/sridhar-manivannan-468ba035b
He is open to internship opportunities and technical collaborations!

[action:contact:Open Contact Form]`;
  }
  if (query.includes('resume') || query.includes('cv')) {
    return `You can view Sridhar's JSON-driven HTML resume at /resume or download the official PDF directly from /assets/resume/resume.pdf!

[action:resume:View HTML Resume] [action:download_resume:Download PDF]`;
  }
  return `Sridhar Vpr is an Electronics & Communication Engineering (ECE) student and full-stack web developer. His mission is "Bridging the World of Circuits and Code" — connecting silicon hardware logic with modern web applications.

[action:ece:Explore ECE] [action:projects:View Projects] [action:resume:View Resume]`;
}

export const AiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen, isMinimized]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setHasUnread(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleToggleMinimize = () => {
    setIsMinimized(prev => !prev);
  };

  const handleCopy = (id: string, text: string) => {
    // Strip action tags before copying
    const cleanText = text.replace(/\[action:[^\]]+\]/g, '').trim();
    navigator.clipboard.writeText(cleanText).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleSmartAction = (actionType: string) => {
    if (actionType === 'resume') {
      window.history.pushState({}, '', '/resume');
      window.dispatchEvent(new PopStateEvent('popstate'));
      setIsOpen(false);
      return;
    }
    if (actionType === 'download_resume') {
      const a = document.createElement('a');
      a.href = '/assets/resume/resume.pdf';
      a.download = 'Sridhar_Vpr_Resume.pdf';
      a.click();
      return;
    }

    // Scroll to section
    const targetId = actionType.replace('#', '');
    const el = document.getElementById(targetId);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
      // On mobile, close to see the section
      if (window.innerWidth < 640) {
        setIsOpen(false);
      }
    }
  };

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const historyPayload = messages.slice(-4).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history: historyPayload }),
        signal: AbortSignal.timeout(6500),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: Message = {
          id: `ai_${Date.now()}`,
          sender: 'assistant',
          text: data.reply || getClientFallbackAnswer(trimmed),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        throw new Error('API request failed');
      }
    } catch {
      const fallbackReply = getClientFallbackAnswer(trimmed);
      const assistantMsg: Message = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setIsLoading(false);
      if (isMinimized || !isOpen) {
        setHasUnread(true);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const handleReset = () => {
    setMessages([WELCOME_MESSAGE]);
  };

  // Helper to render text with clickable smart action pills
  const renderMessageContent = (text: string) => {
    const actionRegex = /\[action:([^:]+):([^\]]+)\]/g;
    let match;

    const actions: Array<{ type: string; label: string }> = [];

    while ((match = actionRegex.exec(text)) !== null) {
      actions.push({ type: match[1], label: match[2] });
    }

    // Strip actions from main prose
    const cleanText = text.replace(/\[action:[^\]]+\]/g, '').trim();

    return (
      <div className="ai-bubble-content-wrap">
        <div className="ai-bubble-text" style={{ whiteSpace: 'pre-line' }}>{cleanText}</div>
        {actions.length > 0 && (
          <div className="ai-smart-actions-wrap" style={{ marginTop: '0.65rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {actions.map((act, idx) => (
              <button
                key={idx}
                type="button"
                className="ai-smart-action-chip"
                onClick={() => handleSmartAction(act.type)}
              >
                <span>{act.label}</span>
                <ExternalLink size={12} />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="ai-assistant-wrapper">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          className="ai-fab-btn"
          onClick={handleOpen}
          aria-label="Open Beyond the Circuit AI Assistant"
          title="Open Beyond the Circuit AI"
        >
          <div className="ai-fab-glow" />
          <div className="ai-fab-pulse" />
          <Bot className="ai-fab-icon" size={24} />
          {hasUnread && <span className="ai-fab-unread-dot" />}
          <div className="ai-fab-tooltip">
            <Sparkles size={13} className="ai-tooltip-sparkle" />
            <span>Beyond the Circuit AI</span>
          </div>
        </button>
      )}

      {/* Floating Chat Modal Panel */}
      {isOpen && (
        <div
          className={`ai-chat-card ${isMinimized ? 'minimized' : ''}`}
          role="dialog"
          aria-label="Beyond the Circuit AI Portfolio Assistant"
        >
          {/* Header Bar */}
          <div className="ai-header">
            <div className="ai-header-info">
              <div className="ai-avatar">
                <Bot size={18} />
                <span className="ai-status-dot" />
              </div>
              <div className="ai-title-wrap">
                <span className="ai-title">Beyond the Circuit AI</span>
                <span className="ai-subtitle">ECE &amp; Full-Stack Engineering Guide</span>
              </div>
            </div>

            <div className="ai-header-actions">
              <button
                className="ai-action-btn"
                onClick={handleReset}
                title="Restart conversation"
                aria-label="Restart conversation"
              >
                <RefreshCw size={14} />
              </button>
              <button
                className="ai-action-btn"
                onClick={handleToggleMinimize}
                title={isMinimized ? 'Expand' : 'Minimize'}
                aria-label={isMinimized ? 'Expand' : 'Minimize'}
              >
                <Minus size={14} />
              </button>
              <button
                className="ai-action-btn close"
                onClick={handleClose}
                title="Close chat"
                aria-label="Close chat"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message History */}
              <div className="ai-messages-container">
                {messages.map((msg) => (
                  <div key={msg.id} className={`ai-message-row ${msg.sender}`}>
                    <div className="ai-message-avatar">
                      {msg.sender === 'assistant' ? <Bot size={14} /> : <User size={14} />}
                    </div>
                    <div className="ai-bubble">
                      {msg.sender === 'assistant' ? renderMessageContent(msg.text) : (
                        <div className="ai-bubble-text">{msg.text}</div>
                      )}
                      <div className="ai-bubble-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem' }}>
                        <span className="ai-bubble-time">{msg.timestamp}</span>
                        {msg.sender === 'assistant' && (
                          <button
                            type="button"
                            className="ai-copy-btn"
                            onClick={() => handleCopy(msg.id, msg.text)}
                            title="Copy response"
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: '2px 4px', display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem' }}
                          >
                            {copiedId === msg.id ? <><Check size={11} color="#22c55e" /> Copied</> : <><Copy size={11} /> Copy</>}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="ai-message-row assistant">
                    <div className="ai-message-avatar">
                      <Bot size={14} />
                    </div>
                    <div className="ai-bubble typing">
                      <div className="ai-typing-indicator">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Questions Chips */}
              {messages.length <= 3 && (
                <div className="ai-suggestions-bar">
                  <span className="ai-suggestions-title">Suggested questions:</span>
                  <div className="ai-chips-scroll">
                    {SUGGESTED_QUESTIONS.map((q, idx) => (
                      <button
                        key={idx}
                        className="ai-chip"
                        onClick={() => sendMessage(q)}
                        disabled={isLoading}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Input Bar */}
              <div className="ai-input-bar">
                <input
                  ref={inputRef}
                  type="text"
                  className="ai-input"
                  placeholder="Ask about ECE, VLSI, projects, resume..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={500}
                  disabled={isLoading}
                />
                <button
                  className="ai-send-btn"
                  onClick={() => sendMessage(inputValue)}
                  disabled={!inputValue.trim() || isLoading}
                  aria-label="Send question"
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
