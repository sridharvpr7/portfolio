import React, { useState } from 'react';
import { useReveal } from '../hooks/useReveal';
import type { SkillGroup } from '../services/contentLoader';
import './SkillsSection.css';

interface SkillsSectionProps {
  groups: SkillGroup[];
  levels: Record<string, { label: string; description: string }>;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({ groups, levels }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'hardware' | 'software' | 'both'>('all');
  const { ref, isVisible } = useReveal<HTMLDivElement>({ threshold: 0.08 });

  const filters = [
    { id: 'all', label: 'All Skills' },
    { id: 'hardware', label: 'ECE / Hardware' },
    { id: 'software', label: 'Web / Software' },
    { id: 'both', label: 'Shared' },
  ] as const;

  const filteredGroups = activeFilter === 'all'
    ? groups
    : groups.filter(g => g.domain === activeFilter);

  return (
    <section id="skills" className="section skills-section" aria-labelledby="skills-title">
      <div className="container" ref={ref}>

        <div className={`skills-header ${isVisible ? 'revealed' : ''}`}>
          <div className="section-label">Technical Stack</div>
          <h2 className="section-title" id="skills-title">Skills & Technologies</h2>
          <p className="section-subtitle">
            A growing toolkit across two engineering disciplines — hardware and software.
          </p>
        </div>

        <div className={`skills-legend ${isVisible ? 'revealed' : ''}`} aria-label="Skill level legend">
          {Object.entries(levels).map(([key, val]) => (
            <div key={key} className={`legend-item level-${key}`}>
              <div className={`legend-dot dot-${key}`} aria-hidden="true" />
              <div>
                <span className="legend-label">{val.label}</span>
                <span className="legend-desc">{val.description}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={`skills-filters ${isVisible ? 'revealed' : ''}`} role="group" aria-label="Filter skills by domain">
          {filters.map(f => (
            <button
              key={f.id}
              id={`skill-filter-${f.id}`}
              className={`skills-filter-btn ${activeFilter === f.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(f.id as typeof activeFilter)}
              aria-pressed={activeFilter === f.id}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className={`skills-grid ${isVisible ? 'revealed' : ''}`}>
          {filteredGroups.map((group, gi) => (
            <div
              key={group.id}
              className={`skill-group card domain-${group.domain}`}
              style={{ animationDelay: `${gi * 0.08}s` }}
            >
              <div className="skill-group-header">
                <DomainIcon domain={group.domain} />
                <h3 className="skill-group-title">{group.label}</h3>
                <span className={`skill-domain-badge badge-${group.domain}`}>
                  {group.domain === 'both' ? 'Shared' : group.domain === 'hardware' ? 'ECE' : 'Web'}
                </span>
              </div>

              <div className="skill-list">
                {group.skills.map(skill => (
                  <div key={skill.id} className={`skill-item level-${skill.level}`}>
                    <div className="skill-item-left">
                      <div className={`skill-level-indicator indicator-${skill.level}`} aria-hidden="true" />
                      <span className="skill-name">{skill.name}</span>
                    </div>
                    <span
                      className="skill-level-badge"
                      title={levels[skill.level]?.description}
                    >
                      {levels[skill.level]?.label ?? skill.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredGroups.length === 0 && (
          <div className="skills-empty">
            <p>No skill groups match this filter.</p>
          </div>
        )}
      </div>
    </section>
  );
};

const DomainIcon: React.FC<{ domain: string }> = ({ domain }) => {
  if (domain === 'hardware') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="6" width="20" height="14" rx="2"/>
        <path d="M6 6V4M10 6V4M14 6V4M18 6V4"/>
      </svg>
    );
  }
  if (domain === 'software') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M2 12h4M18 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
    </svg>
  );
};
