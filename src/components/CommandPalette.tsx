import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Compass,
  ArrowRight,
  Download,
  Mail,
  Sun,
  Moon,
  Bot,
  FolderGit2,
  X,
  Sparkles,
  Cpu,
  FileText,
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from './BrandIcons';
import type { Project } from '../services/contentLoader';
import './CommandPalette.css';

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Actions' | 'Projects';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  projects?: Project[];
  isDark: boolean;
  onThemeToggle: () => void;
  onResumeDownload?: () => void;
  onOpenAi?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  projects = [],
  isDark,
  onThemeToggle,
  onResumeDownload,
  onOpenAi,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Smooth scroll helper
  const navigateTo = (id: string) => {
    setIsOpen(false);
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.getBoundingClientRect().top + window.scrollY - 75,
        behavior: 'smooth',
      });
    }
  };

  // Commands definition
  const commands: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      // Navigation
      {
        id: 'nav-hero',
        category: 'Navigation',
        title: 'Home / Hero',
        subtitle: 'Introduction, identity and headline',
        icon: <Compass size={16} />,
        action: () => navigateTo('hero'),
        keywords: ['home', 'start', 'top', 'hero', 'intro'],
      },
      {
        id: 'nav-dual-identity',
        category: 'Navigation',
        title: 'Dual Identity',
        subtitle: 'Hardware engineering meets software development',
        icon: <Compass size={16} />,
        action: () => navigateTo('dual-identity'),
        keywords: ['identity', 'hardware', 'software', 'vlsi', 'bridge'],
      },
      {
        id: 'nav-about',
        category: 'Navigation',
        title: 'About Me & Education',
        subtitle: 'Engineering journey, background, and college',
        icon: <Compass size={16} />,
        action: () => navigateTo('about'),
        keywords: ['about', 'bio', 'education', 'college', 'jnn', 'j.n.n'],
      },
      {
        id: 'nav-ece',
        category: 'Navigation',
        title: 'ECE Engineering & Digital Hardware',
        subtitle: 'Digital logic gates, VLSI workflow, Verilog HDL, and protocols',
        icon: <Cpu size={16} />,
        action: () => navigateTo('ece'),
        keywords: ['ece', 'hardware', 'vlsi', 'verilog', 'logic', 'circuit', 'gates', 'converter'],
      },
      {
        id: 'nav-skills',
        category: 'Navigation',
        title: 'Skills & Technologies',
        subtitle: 'Hardware RTL, programming languages, and tools',
        icon: <Compass size={16} />,
        action: () => navigateTo('skills'),
        keywords: ['skills', 'tech', 'stack', 'verilog', 'react', 'typescript'],
      },
      {
        id: 'nav-projects',
        category: 'Navigation',
        title: 'Projects Showcase',
        subtitle: 'Full-stack applications and hardware circuits',
        icon: <FolderGit2 size={16} />,
        action: () => navigateTo('projects'),
        keywords: ['projects', 'work', 'code', 'apps', 'demos'],
      },
      {
        id: 'nav-github',
        category: 'Navigation',
        title: 'GitHub Live Activity',
        subtitle: 'Open source repositories and language statistics',
        icon: <GithubIcon size={16} />,
        action: () => navigateTo('github'),
        keywords: ['github', 'activity', 'repos', 'open source'],
      },
      {
        id: 'nav-experience',
        category: 'Navigation',
        title: 'Experience & Certifications',
        subtitle: 'Internships, certified courses, and achievements',
        icon: <Compass size={16} />,
        action: () => navigateTo('experience'),
        keywords: ['experience', 'certificates', 'certifications', 'internships'],
      },
      {
        id: 'nav-contact',
        category: 'Navigation',
        title: 'Contact Sridhar',
        subtitle: 'Send a direct message or collaboration inquiry',
        icon: <Mail size={16} />,
        action: () => navigateTo('contact'),
        keywords: ['contact', 'email', 'message', 'hire', 'collaborate'],
      },

      // Actions
      {
        id: 'act-view-resume',
        category: 'Actions',
        title: 'View Interactive HTML Resume',
        subtitle: 'Open dynamic JSON-driven ATS-friendly resume page',
        icon: <FileText size={16} />,
        action: () => {
          setIsOpen(false);
          window.history.pushState({}, '', '/resume');
          window.dispatchEvent(new PopStateEvent('popstate'));
        },
        keywords: ['resume', 'cv', 'html', 'view', 'read'],
      },
      {
        id: 'act-resume',
        category: 'Actions',
        title: 'Download Resume (PDF)',
        subtitle: 'Get official curriculum vitae of Sridhar VPR',
        icon: <Download size={16} />,
        action: () => {
          setIsOpen(false);
          if (onResumeDownload) {
            onResumeDownload();
          } else {
            const link = document.createElement('a');
            link.href = '/assets/resume/resume.pdf';
            link.download = 'Sridhar_VPR_Resume.pdf';
            link.click();
          }
        },
        keywords: ['resume', 'cv', 'pdf', 'download'],
      },
      {
        id: 'act-ai',
        category: 'Actions',
        title: 'Ask Beyond AI Assistant',
        subtitle: 'Ask questions about Sridhar’s ECE skills and code',
        icon: <Bot size={16} />,
        action: () => {
          setIsOpen(false);
          onOpenAi?.();
        },
        keywords: ['ai', 'assistant', 'bot', 'chat', 'ask'],
      },
      {
        id: 'act-theme',
        category: 'Actions',
        title: isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme',
        subtitle: isDark ? 'High-contrast clean daylight visual mode' : 'Cinematic neon electric dark mode',
        icon: isDark ? <Sun size={16} /> : <Moon size={16} />,
        action: () => {
          setIsOpen(false);
          onThemeToggle();
        },
        keywords: ['theme', 'dark', 'light', 'mode', 'color'],
      },
      {
        id: 'act-github',
        category: 'Actions',
        title: 'Open GitHub Profile (@sridharvpr7)',
        subtitle: 'https://github.com/sridharvpr7',
        icon: <GithubIcon size={16} />,
        action: () => {
          setIsOpen(false);
          window.open('https://github.com/sridharvpr7', '_blank', 'noopener,noreferrer');
        },
        keywords: ['github', 'profile', 'git'],
      },
      {
        id: 'act-linkedin',
        category: 'Actions',
        title: 'Open LinkedIn Profile',
        subtitle: 'Connect with Sridhar on professional network',
        icon: <LinkedinIcon size={16} />,
        action: () => {
          setIsOpen(false);
          window.open('https://www.linkedin.com/in/sridhar-vpr', '_blank', 'noopener,noreferrer');
        },
        keywords: ['linkedin', 'social', 'network', 'connect'],
      },
    ];

    // Project entries
    projects.forEach((p) => {
      list.push({
        id: `proj-${p.id}`,
        category: 'Projects',
        title: p.title,
        subtitle: p.shortSummary || p.category,
        icon: <FolderGit2 size={16} />,
        action: () => {
          navigateTo('projects');
        },
        keywords: [p.title.toLowerCase(), ...(p.tags || []).map((t) => t.toLowerCase())],
      });
    });

    return list;
  }, [projects, isDark, onThemeToggle, onResumeDownload, onOpenAi]);

  // Filter commands by search query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase().trim();
    return commands.filter((cmd) => {
      const matchTitle = cmd.title.toLowerCase().includes(q);
      const matchSub = cmd.subtitle?.toLowerCase().includes(q);
      const matchCategory = cmd.category.toLowerCase().includes(q);
      const matchKeywords = cmd.keywords?.some((k) => k.includes(q));
      return matchTitle || matchSub || matchCategory || matchKeywords;
    });
  }, [commands, query]);

  // Keyboard shortcut listener (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user pressed Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        const target = e.target as HTMLElement | null;
        // Don't hijack if user is typing inside an input/textarea
        if (target && target.closest('input, textarea, select, [contenteditable="true"]')) {
          return;
        }

        e.preventDefault();
        setIsOpen((prev) => {
          if (!prev) {
            previousFocusRef.current = document.activeElement as HTMLElement;
          }
          return !prev;
        });
      }

      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus management & prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      document.body.style.overflow = '';
      setQuery('');
      previousFocusRef.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Arrow navigation & Enter key
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = filteredCommands[selectedIndex];
      if (current) {
        current.action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="cmd-backdrop"
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div className="cmd-panel" onClick={(e) => e.stopPropagation()}>
        {/* Search Header */}
        <div className="cmd-header">
          <Search size={18} className="cmd-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder="Type a command, section, or project... (Esc to exit)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            aria-autocomplete="list"
          />
          {query && (
            <button
              className="cmd-clear-btn"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
          <kbd className="cmd-kbd">ESC</kbd>
        </div>

        {/* Results List */}
        <div className="cmd-list" ref={listRef} role="listbox">
          {filteredCommands.length === 0 ? (
            <div className="cmd-empty">
              <Sparkles size={24} className="cmd-empty-icon" />
              <p>No matching commands found for "{query}"</p>
              <span>Try searching for "projects", "resume", "skills", or "contact"</span>
            </div>
          ) : (
            filteredCommands.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`cmd-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="cmd-item-icon">{item.icon}</div>
                  <div className="cmd-item-content">
                    <div className="cmd-item-title-row">
                      <span className="cmd-item-title">{item.title}</span>
                      <span className="cmd-item-cat">{item.category}</span>
                    </div>
                    {item.subtitle && <span className="cmd-item-sub">{item.subtitle}</span>}
                  </div>
                  {isSelected && <ArrowRight size={14} className="cmd-item-arrow" />}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="cmd-footer">
          <div className="cmd-footer-hints">
            <span className="cmd-hint">
              <kbd className="cmd-hint-kbd">↑</kbd>
              <kbd className="cmd-hint-kbd">↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="cmd-hint">
              <kbd className="cmd-hint-kbd">↵</kbd>
              <span>Select</span>
            </span>
            <span className="cmd-hint">
              <kbd className="cmd-hint-kbd">ESC</kbd>
              <span>Close</span>
            </span>
          </div>
          <span className="cmd-footer-brand">Beyond the Circuit</span>
        </div>
      </div>
    </div>
  );
};

