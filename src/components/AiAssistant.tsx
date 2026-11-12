import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Minus, Send, Sparkles, User, RefreshCw } from 'lucide-react';
import './AiAssistant.css';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const SUGGESTED_QUESTIONS = [
  'Tell me about Sridhar.',
  'What are his ECE skills?',
  'Show me his VLSI interests.',
  'What projects has he built?',
  'What technologies does he use?',
  'How can I contact him?',
];

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  sender: 'assistant',
  text: "Hey! Welcome to Beyond the Circuit. I'm your guide to Sridhar's engineering journey. Want to explore his projects, hardware interests, or development work?",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

// Client-side fallback knowledge engine in case server is unreachable or offline
function getClientFallbackAnswer(q: string): string {
  const query = q.toLowerCase();
  if (query.includes('ece') || query.includes('hardware') || query.includes('vlsi') || query.includes('verilog') || query.includes('circuit')) {
    return `In hardware engineering, Sridhar focuses on:
• Digital Electronics & Logic Design
• Verilog HDL and RTL synthesis
• Computer Organization & Architecture
• Embedded Systems & Microcontroller Interfacing (ESP32/Arduino)
• CMOS fundamentals and circuit simulation.
He has hands-on experience designing state machines, ALU logic, and exploring modern chip architecture.`;
  }
  if (query.includes('skill') || query.includes('tech') || query.includes('stack') || query.includes('software') || query.includes('react')) {
    return `Sridhar's technical stack includes:
• Frontend: React 19, TypeScript, JavaScript (ES6+), Tailwind CSS, Framer Motion
• Backend: Node.js, Express, REST APIs
• Databases: PostgreSQL (Neon Serverless), Firebase Realtime DB
• Hardware & Tools: Verilog HDL, Git, GitHub, Render, Vitest.`;
  }
  if (query.includes('project') || query.includes('built') || query.includes('portfolio')) {
    return `Sridhar has engineered both hardware and software projects:
1. Beyond the Circuit: This production React 19 + TypeScript portfolio with real-time analytics, 3D interactive circuits, and serverless PostgreSQL.
2. RTL Digital Design Modules: Verilog-based ALUs, shift registers, and state machines for digital logic verification.
3. IoT & Embedded Systems: Sensor telemetry prototypes with ESP32 and microcontrollers.
4. Full-Stack Web Applications: Interactive data-driven web platforms.
Check out the Projects section on this page for live demos and code links!`;
  }
  if (query.includes('contact') || query.includes('hire') || query.includes('email') || query.includes('reach')) {
    return `You can reach Sridhar directly:
• Email: sridharvpr7@gmail.com
• GitHub: https://github.com/sridharvpr7
• LinkedIn: https://www.linkedin.com/in/sridhar-vpr
Or send a message through the contact form at the bottom of this portfolio!`;
  }
  if (query.includes('resume') || query.includes('cv')) {
    return `You can download Sridhar VPR's resume directly via the "Resume" button in the Hero section or at /assets/resume/resume.pdf.`;
  }
  return `Sridhar VPR is an Electronics & Communication Engineering (ECE) student, VLSI enthusiast, and full-stack web developer. His focus is "Where Hardware Meets Software" — bridging low-level silicon logic and RTL design with modern web engineering.`;
}

export const AiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat to bottom
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
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
        signal: AbortSignal.timeout(6000),
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
      // Seamless verified fallback
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

  return (
    <div className="ai-assistant-wrapper">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          className="ai-fab-btn"
          onClick={handleOpen}
          aria-label="Open Beyond AI Assistant"
          title="Open Beyond AI — Your Guide to Sridhar's Work"
        >
          <div className="ai-fab-glow" />
          <div className="ai-fab-pulse" />
          <Bot className="ai-fab-icon" size={24} />
          {hasUnread && <span className="ai-fab-unread-dot" />}
          <div className="ai-fab-tooltip">
            <Sparkles size={13} className="ai-tooltip-sparkle" />
            <span>Ask Beyond AI</span>
          </div>
        </button>
      )}

      {/* Floating Chat Modal Panel */}
      {isOpen && (
        <div
          className={`ai-chat-card ${isMinimized ? 'minimized' : ''}`}
          role="dialog"
          aria-label="Beyond AI Portfolio Assistant"
        >
          {/* Header Bar */}
          <div className="ai-header">
            <div className="ai-header-info">
              <div className="ai-avatar">
                <Bot size={18} />
                <span className="ai-status-dot" />
              </div>
              <div className="ai-title-wrap">
                <span className="ai-title">Beyond AI</span>
                <span className="ai-subtitle">Guide to Sridhar's Work</span>
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
                      <div className="ai-bubble-text">{msg.text}</div>
                      <span className="ai-bubble-time">{msg.timestamp}</span>
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
              {messages.length <= 2 && (
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
                  placeholder="Ask about Sridhar's skills, VLSI, projects..."
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

