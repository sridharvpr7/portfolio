import React, { useState } from 'react';
import { ExternalLink, ChevronRight, X } from 'lucide-react';
import { GithubIcon } from '../components/BrandIcons';
import { useReveal } from '../hooks/useReveal';
import type { Project, ProjectCategory } from '../services/contentLoader';
import './ProjectsSection.css';

interface ProjectsSectionProps {
  projects: Project[];
  categories: ProjectCategory[];
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({ projects, categories }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { ref, isVisible } = useReveal<HTMLDivElement>({ threshold: 0.08 });

  const visible = projects.filter(p => p.visible);
  const filtered = activeCategory === 'all'
    ? visible
    : visible.filter(p => p.category === activeCategory);

  const sorted = [...filtered].sort((a, b) => a.order - b.order);
  const featured = sorted.filter(p => p.featured);
  const regular = sorted.filter(p => !p.featured);

  return (
    <section id="projects" className="section projects-section" aria-labelledby="projects-title">
      <div className="container" ref={ref}>

        <div className={`projects-header ${isVisible ? 'revealed' : ''}`}>
          <div className="section-label">Featured Work</div>
          <h2 className="section-title" id="projects-title">Projects</h2>
          <p className="section-subtitle">
            Real things I've built — from RTL hardware descriptions to full-stack web applications.
          </p>
        </div>

        <div className={`projects-filters ${isVisible ? 'revealed' : ''}`} role="group" aria-label="Filter projects by category">
          {categories.map(cat => (
            <button
              key={cat.id}
              id={`proj-cat-${cat.id}`}
              className={`projects-filter-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
              aria-pressed={activeCategory === cat.id}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Featured projects */}
        {featured.length > 0 && (
          <div className={`projects-featured ${isVisible ? 'revealed' : ''}`}>
            {featured.map((project, i) => (
              <FeaturedProjectCard
                key={project.id}
                project={project}
                index={i}
                onClick={() => setSelectedProject(project)}
              />
            ))}
          </div>
        )}

        {/* Regular projects grid */}
        {regular.length > 0 && (
          <div className={`projects-grid ${isVisible ? 'revealed' : ''}`}>
            {regular.map((project, i) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={i}
                onClick={() => setSelectedProject(project)}
              />
            ))}
          </div>
        )}

        {sorted.length === 0 && (
          <div className="projects-empty">
            <div className="projects-empty-icon" aria-hidden="true">◇</div>
            <p>No projects in this category yet.</p>
          </div>
        )}
      </div>

      {/* Project detail modal */}
      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </section>
  );
};

// ── Featured card ──────────────────────────────────────────
interface CardProps {
  project: Project;
  index: number;
  onClick: () => void;
}

const FeaturedProjectCard: React.FC<CardProps> = ({ project, index, onClick }) => {
  const isEven = index % 2 === 0;

  return (
    <article
      className={`featured-card ${isEven ? '' : 'featured-card-reversed'}`}
      style={{ animationDelay: `${index * 0.12}s` }}
      aria-label={`Featured project: ${project.title}`}
    >
      <div className="featured-visual">
        <CategoryVisual category={project.category} />
        <div className="featured-category-tag">
          <span className="chip chip-cyan">{getCategoryLabel(project.category)}</span>
          <span className="chip">{project.status}</span>
        </div>
      </div>

      <div className="featured-content">
        <div className="featured-meta">
          <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', letterSpacing: '0.12em' }}>
            FEATURED PROJECT
          </span>
          {project.startDate && (
            <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>
              {formatDate(project.startDate)}
            </span>
          )}
        </div>

        <h3 className="featured-title">{project.title}</h3>
        <p className="featured-summary">{project.shortSummary}</p>

        <div className="featured-techs">
          {project.technologies.slice(0, 6).map(tech => (
            <span key={tech} className="chip">{tech}</span>
          ))}
          {project.technologies.length > 6 && (
            <span className="chip" style={{ color: 'var(--text-faint)' }}>+{project.technologies.length - 6}</span>
          )}
        </div>

        <div className="featured-actions">
          <button
            className="btn btn-primary btn-sm"
            onClick={onClick}
            aria-label={`View details for ${project.title}`}
          >
            View Details <ChevronRight size={14} />
          </button>
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
              aria-label={`GitHub repository for ${project.title}`}
            >
              <GithubIcon size={14} /> Source
            </a>
          )}
          {project.liveDemoUrl && (
            <a
              href={project.liveDemoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
              aria-label={`Live demo for ${project.title}`}
            >
              <ExternalLink size={14} /> Demo
            </a>
          )}
        </div>
      </div>
    </article>
  );
};

// ── Regular card ──────────────────────────────────────────
const ProjectCard: React.FC<CardProps> = ({ project, index, onClick }) => (
  <article
    className="project-card card"
    style={{ animationDelay: `${index * 0.08}s` }}
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick()}
    aria-label={`Project: ${project.title}`}
  >
    <div className="project-card-top">
      <div className="project-card-icon" aria-hidden="true">
        <CategoryIcon category={project.category} />
      </div>
      <div className="project-card-links">
        {project.githubUrl && (
          <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
            className="navbar-icon-btn" onClick={e => e.stopPropagation()} aria-label="Source code">
            <GithubIcon size={15} />
          </a>
        )}
        {project.liveDemoUrl && (
          <a href={project.liveDemoUrl} target="_blank" rel="noopener noreferrer"
            className="navbar-icon-btn" onClick={e => e.stopPropagation()} aria-label="Live demo">
            <ExternalLink size={15} />
          </a>
        )}
      </div>
    </div>

    <h3 className="project-card-title">{project.title}</h3>
    <p className="project-card-summary">{project.shortSummary}</p>

    <div className="project-card-techs">
      {project.technologies.slice(0, 4).map(tech => (
        <span key={tech} className="chip">{tech}</span>
      ))}
    </div>

    <div className="project-card-footer">
      <span className="chip chip-cyan" style={{ fontSize: '0.68rem' }}>{getCategoryLabel(project.category)}</span>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-faint)' }}>{project.status}</span>
    </div>
  </article>
);

// ── Modal ──────────────────────────────────────────────────
const ProjectModal: React.FC<{ project: Project; onClose: () => void }> = ({ project, onClose }) => {
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Project details: ${project.title}`}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-meta">
              <span className="chip chip-cyan">{getCategoryLabel(project.category)}</span>
              <span className="chip">{project.status}</span>
            </div>
            <h2 className="modal-title">{project.title}</h2>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close project details"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-summary">{project.shortSummary}</p>

          {project.problem && (
            <div className="modal-block">
              <h3 className="modal-block-title">The Problem</h3>
              <p className="modal-block-text">{project.problem}</p>
            </div>
          )}

          {project.solution && (
            <div className="modal-block">
              <h3 className="modal-block-title">The Solution</h3>
              <p className="modal-block-text">{project.solution}</p>
            </div>
          )}

          {project.features && project.features.length > 0 && (
            <div className="modal-block">
              <h3 className="modal-block-title">Key Features</h3>
              <ul className="modal-features">
                {project.features.map((f, i) => (
                  <li key={i} className="modal-feature">
                    <span className="modal-feature-dot" aria-hidden="true"/>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="modal-block">
            <h3 className="modal-block-title">Technologies</h3>
            <div className="modal-techs">
              {project.technologies.map(tech => (
                <span key={tech} className="chip">{tech}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              <GithubIcon size={15} /> Source Code
            </a>
          )}
          {project.liveDemoUrl && (
            <a href={project.liveDemoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              <ExternalLink size={15} /> Live Demo
            </a>
          )}
          {!project.githubUrl && !project.liveDemoUrl && (
            <span style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>Links coming soon</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────
function getCategoryLabel(cat: string) {
  const map: Record<string, string> = {
    'full-stack': 'Full-Stack',
    'frontend': 'Frontend',
    'vlsi': 'VLSI / Verilog',
    'embedded': 'Embedded',
    'ece': 'ECE',
    'tools': 'Tools',
  };
  return map[cat] ?? cat;
}

function formatDate(d: string) {
  const [year, month] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(month) - 1] ?? ''} ${year}`;
}

const CategoryVisual: React.FC<{ category: string }> = ({ category }) => {
  const isHW = ['vlsi', 'embedded', 'ece'].includes(category);

  return (
    <div className={`cat-visual ${isHW ? 'cat-visual-hw' : 'cat-visual-sw'}`}>
      <svg viewBox="0 0 240 180" fill="none" width="100%" height="100%">
        {isHW ? (
          <>
            {/* Circuit board visual */}
            <rect x="20" y="20" width="200" height="140" rx="4" fill="var(--bg-surface-3)" stroke={isHW ? 'var(--accent-blue)' : 'var(--accent-violet)'} strokeWidth="0.8" opacity="0.4"/>
            <line x1="20" y1="60" x2="220" y2="60" stroke="var(--accent-blue)" strokeWidth="0.6" strokeDasharray="4 3" opacity="0.3"/>
            <line x1="20" y1="100" x2="220" y2="100" stroke="var(--accent-blue)" strokeWidth="0.6" strokeDasharray="4 3" opacity="0.3"/>
            <line x1="80" y1="20" x2="80" y2="160" stroke="var(--accent-blue)" strokeWidth="0.6" strokeDasharray="4 3" opacity="0.3"/>
            <line x1="160" y1="20" x2="160" y2="160" stroke="var(--accent-violet)" strokeWidth="0.6" strokeDasharray="4 3" opacity="0.25"/>
            <rect x="90" y="70" width="60" height="40" rx="3" fill="var(--accent-blue-dim)" stroke="var(--accent-blue)" strokeWidth="1"/>
            <text x="120" y="94" textAnchor="middle" fill="var(--accent-blue)" fontSize="10" fontFamily="JetBrains Mono" opacity="0.9">
              {category === 'vlsi' ? 'ALU' : 'MCU'}
            </text>
            {/* Signal pulse */}
            <circle cx="80" cy="90" r="3" fill="var(--accent-blue)">
              <animate attributeName="cx" values="20;80;80;160;220" keyTimes="0;0.3;0.5;0.7;1" dur="3s" repeatCount="indefinite"/>
              <animate attributeName="cy" values="60;60;90;90;60" keyTimes="0;0.3;0.5;0.7;1" dur="3s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0;1;1;1;0" dur="3s" repeatCount="indefinite"/>
            </circle>
          </>
        ) : (
          <>
            {/* Code editor visual */}
            <rect x="20" y="20" width="200" height="140" rx="6" fill="var(--bg-surface-3)" stroke="var(--accent-violet)" strokeWidth="0.8" opacity="0.4"/>
            <rect x="20" y="20" width="200" height="28" rx="6" fill="var(--accent-violet-dim)" opacity="0.5"/>
            <circle cx="38" cy="34" r="5" fill="rgba(255,100,100,0.5)"/>
            <circle cx="55" cy="34" r="5" fill="rgba(255,200,0,0.5)"/>
            <circle cx="72" cy="34" r="5" fill="rgba(100,255,100,0.4)"/>
            {/* Code lines */}
            <rect x="36" y="60" width="60" height="5" rx="2" fill="var(--accent-violet)" opacity="0.6"/>
            <rect x="36" y="75" width="140" height="5" rx="2" fill="var(--accent-blue)" opacity="0.4"/>
            <rect x="50" y="90" width="100" height="5" rx="2" fill="var(--accent-cyan)" opacity="0.35"/>
            <rect x="50" y="105" width="120" height="5" rx="2" fill="var(--accent-blue)" opacity="0.35"/>
            <rect x="36" y="120" width="80" height="5" rx="2" fill="var(--accent-violet)" opacity="0.45"/>
            <rect x="36" y="135" width="50" height="5" rx="2" fill="var(--accent-blue)" opacity="0.3"/>
            {/* Cursor blink */}
            <rect x="90" y="135" width="2" height="10" rx="1" fill="var(--accent-blue)">
              <animate attributeName="opacity" values="0;1;0" dur="1.2s" repeatCount="indefinite"/>
            </rect>
          </>
        )}
      </svg>
    </div>
  );
};

const CategoryIcon: React.FC<{ category: string }> = ({ category }) => {
  const isHW = ['vlsi', 'embedded', 'ece'].includes(category);
  return isHW ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="14" rx="2"/>
      <path d="M6 6V4M10 6V4M14 6V4M18 6V4"/>
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  );
};
