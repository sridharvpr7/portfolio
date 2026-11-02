import React from 'react';
import { MapPin, BookOpen, Zap } from 'lucide-react';
import { useReveal } from '../hooks/useReveal';
import type { ProfileData, EducationEntry } from '../services/contentLoader';
import './AboutSection.css';

interface AboutSectionProps {
  profile: ProfileData;
  education: EducationEntry[];
}

export const AboutSection: React.FC<AboutSectionProps> = ({ profile, education }) => {
  const { ref, isVisible } = useReveal<HTMLDivElement>({ threshold: 0.1 });

  const paragraphs = profile.bio.split('\n\n').filter(Boolean);

  return (
    <section id="about" className="section about-section" aria-labelledby="about-title">
      <div className="container about-container" ref={ref}>

        <div className={`about-left ${isVisible ? 'revealed' : ''}`}>
          <div className="section-label">About Me</div>
          <h2 className="section-title" id="about-title">
            The Mind Behind<br />the <span className="text-gradient">Work</span>
          </h2>

          <div className="about-bio">
            {paragraphs.map((para, i) => (
              <p key={i} className="about-para" style={{ transitionDelay: `${i * 0.1}s` }}>
                {para}
              </p>
            ))}
          </div>

          <div className="about-meta">
            {profile.location && (
              <div className="about-meta-item">
                <MapPin size={15} />
                <span>{profile.location}</span>
              </div>
            )}
            {profile.currentFocus && (
              <div className="about-meta-item">
                <Zap size={15} />
                <span>{profile.currentFocus}</span>
              </div>
            )}
          </div>
        </div>

        <div className={`about-right ${isVisible ? 'revealed' : ''}`}>

          {/* Education card */}
          {education.length > 0 && education.map(edu => (
            <div key={edu.id} className="about-edu-card card">
              <div className="about-edu-header">
                <div className="about-edu-icon" aria-hidden="true">
                  <BookOpen size={20} />
                </div>
                <div>
                  <div className="about-edu-degree">
                    {edu.degree} — {edu.field}
                  </div>
                  <div className="about-edu-institution">
                    {edu.institution}
                  </div>
                </div>
              </div>

              <div className="about-edu-meta">
                <span className="chip">{edu.startYear} – {edu.endYear}</span>
                <span className="chip chip-cyan">{edu.status}</span>
                <span>{edu.location}</span>
              </div>

              <p className="about-edu-desc">{edu.description}</p>

              {edu.highlights.length > 0 && (
                <div className="about-edu-highlights">
                  {edu.highlights.map((h, i) => (
                    <div key={i} className="about-highlight">
                      <span className="about-highlight-dot" aria-hidden="true"/>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Focus card */}
          <div className="about-focus-card card">
            <div className="font-mono" style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent-blue)', marginBottom: '0.75rem' }}>
              &gt; Current_Focus
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7 }}>
              {profile.currentFocus || 'Exploring VLSI design and building full-stack web applications — connecting hardware knowledge with modern software engineering.'}
            </p>
            <div className="about-focus-bar" aria-hidden="true">
              <div className="about-focus-bar-fill" />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
