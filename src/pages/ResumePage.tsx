import React, { useEffect, useState } from 'react';
import { ArrowLeft, Download, Printer, Mail, MapPin, Globe, ExternalLink, Cpu, BookOpen, Briefcase, Award, Code, CheckCircle2 } from 'lucide-react';
import { GithubIcon } from '../components/BrandIcons';
import './ResumePage.css';

export interface ResumeData {
  personalInfo: {
    name: string;
    title: string;
    tagline: string;
    email: string;
    location: string;
    github: string;
    linkedin: string;
    portfolio: string;
    pdfUrl: string;
  };
  summary: string;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startYear: number;
    endYear: number | string;
    status: string;
    location: string;
    description: string;
  }>;
  technicalSkills: {
    electronicsAndVLSI: string[];
    programmingLanguages: string[];
    webAndFullStack: string[];
    toolsAndPlatforms: string[];
  };
  internships: Array<{
    organization: string;
    role: string;
    period: string;
    location: string;
    description: string;
    certificateFile?: string;
  }>;
  certifications: Array<{
    title: string;
    issuer: string;
    date: string;
    credentialUrl?: string;
  }>;
  projects: Array<{
    title: string;
    category: string;
    techStack: string[];
    summary: string;
    githubUrl?: string;
    liveUrl?: string;
  }>;
}

interface ResumePageProps {
  onBack?: () => void;
}

export const ResumePage: React.FC<ResumePageProps> = ({ onBack }) => {
  const [data, setData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Sridhar Vpr — Resume | Beyond the Circuit";
    const base = import.meta.env.BASE_URL || './';
    const jsonUrl = `${base.replace(/\/+$/, '')}/data/resume.json`;

    fetch(jsonUrl)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load resume data`);
        return res.json();
      })
      .then((json: ResumeData) => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading resume.json:', err);
        setError(err instanceof Error ? err.message : 'Failed to load resume');
        setLoading(false);
      });
  }, []);

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onBack) {
      onBack();
    } else {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="resume-page-wrapper">
        <div className="resume-loading-state">
          <div className="resume-spinner" aria-hidden="true" />
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#f5f7fa' }}>Loading Resume...</h2>
          <p style={{ color: '#929baa', fontSize: '0.875rem' }}>Fetching structured engineering resume data</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="resume-page-wrapper">
        <div className="resume-error-state">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: '#ef4444' }}>Unable to load resume</h2>
          <p style={{ color: '#929baa', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            {error || 'Data source not found. Please verify public/data/resume.json.'}
          </p>
          <button onClick={handleBack} className="resume-nav-back" style={{ display: 'inline-flex' }}>
            <ArrowLeft size={16} /> Return to Portfolio
          </button>
        </div>
      </div>
    );
  }

  const { personalInfo, summary, education, technicalSkills, internships, certifications, projects } = data;
  const pdfDownloadPath = personalInfo.pdfUrl || '/assets/resume/resume.pdf';

  return (
    <div className="resume-page-wrapper">
      {/* Top Action Toolbar */}
      <nav className="resume-toolbar" aria-label="Resume actions">
        <div className="resume-toolbar-left">
          <a href="/" onClick={handleBack} className="resume-nav-back" title="Return to Beyond the Circuit Portfolio">
            <ArrowLeft size={16} />
            <span>Back to Portfolio</span>
          </a>
          <span className="resume-badge">JSON-Driven View</span>
        </div>

        <div className="resume-toolbar-right">
          <button type="button" onClick={handlePrint} className="resume-btn-print" title="Print this resume document">
            <Printer size={15} />
            <span>Print / Save as PDF</span>
          </button>

          <a
            href={pdfDownloadPath}
            download="Sridhar_Vpr_Resume.pdf"
            className="resume-btn-download"
            title="Download the official PDF document"
          >
            <Download size={15} />
            <span>Download Resume (PDF)</span>
          </a>
        </div>
      </nav>

      {/* Main Resume Document (Light Editorial ATS Paper) */}
      <main className="resume-paper" id="resume-document">
        {/* Document Header */}
        <header className="resume-header">
          <h1 className="resume-name">{personalInfo.name}</h1>
          <div className="resume-headline">{personalInfo.title}</div>
          <div className="resume-contact-bar">
            {personalInfo.email && (
              <a href={`mailto:${personalInfo.email}`} className="resume-contact-item">
                <Mail size={14} />
                <span>{personalInfo.email}</span>
              </a>
            )}
            {personalInfo.location && (
              <span className="resume-contact-item">
                <MapPin size={14} />
                <span>{personalInfo.location}</span>
              </span>
            )}
            {personalInfo.portfolio && (
              <a href={personalInfo.portfolio} target="_blank" rel="noopener noreferrer" className="resume-contact-item">
                <Globe size={14} />
                <span>Portfolio</span>
              </a>
            )}
            {personalInfo.github && (
              <a href={personalInfo.github} target="_blank" rel="noopener noreferrer" className="resume-contact-item">
                <GithubIcon size={14} />
                <span>github.com/sridharvpr7</span>
              </a>
            )}
            {personalInfo.linkedin && (
              <a href={personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="resume-contact-item">
                <ExternalLink size={14} />
                <span>LinkedIn</span>
              </a>
            )}
          </div>
        </header>

        {/* Professional Summary */}
        {summary && (
          <section className="resume-section" aria-labelledby="resume-sec-summary">
            <h2 id="resume-sec-summary" className="resume-section-title">
              <CheckCircle2 size={16} /> Professional Profile
            </h2>
            <p className="resume-summary-text">{summary}</p>
          </section>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <section className="resume-section" aria-labelledby="resume-sec-education">
            <h2 id="resume-sec-education" className="resume-section-title">
              <BookOpen size={16} /> Education
            </h2>
            <div className="resume-timeline-list">
              {education.map((item, index) => (
                <article key={index} className="resume-timeline-item">
                  <div className="resume-item-top">
                    <h3 className="resume-item-title">{item.institution}</h3>
                    <span className="resume-item-period">{item.startYear} – {item.endYear}</span>
                  </div>
                  <div className="resume-item-sub">
                    <span>{item.degree} — {item.field}</span>
                    <span className="resume-item-location">{item.location} ({item.status})</span>
                  </div>
                  {item.description && <p className="resume-item-desc">{item.description}</p>}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Technical Skills Dashboard */}
        {technicalSkills && (
          <section className="resume-section" aria-labelledby="resume-sec-skills">
            <h2 id="resume-sec-skills" className="resume-section-title">
              <Cpu size={16} /> Technical Skills &amp; Engineering Disciplines
            </h2>
            <div className="resume-skills-grid">
              <div className="resume-skill-block">
                <h3 className="resume-skill-heading">ECE &amp; Digital Hardware</h3>
                <div className="resume-skill-tags">
                  {technicalSkills.electronicsAndVLSI.map((s, i) => (
                    <span key={i} className="resume-skill-tag">{s}</span>
                  ))}
                </div>
              </div>

              <div className="resume-skill-block">
                <h3 className="resume-skill-heading">Web &amp; Full-Stack Development</h3>
                <div className="resume-skill-tags">
                  {technicalSkills.webAndFullStack.map((s, i) => (
                    <span key={i} className="resume-skill-tag">{s}</span>
                  ))}
                </div>
              </div>

              <div className="resume-skill-block">
                <h3 className="resume-skill-heading">Programming Languages</h3>
                <div className="resume-skill-tags">
                  {technicalSkills.programmingLanguages.map((s, i) => (
                    <span key={i} className="resume-skill-tag">{s}</span>
                  ))}
                </div>
              </div>

              <div className="resume-skill-block">
                <h3 className="resume-skill-heading">Tools, EDA &amp; Platforms</h3>
                <div className="resume-skill-tags">
                  {technicalSkills.toolsAndPlatforms.map((s, i) => (
                    <span key={i} className="resume-skill-tag">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Internships */}
        {internships && internships.length > 0 && (
          <section className="resume-section" aria-labelledby="resume-sec-internships">
            <h2 id="resume-sec-internships" className="resume-section-title">
              <Briefcase size={16} /> Practical Experience &amp; Internships
            </h2>
            <div className="resume-timeline-list">
              {internships.map((intern, i) => (
                <article key={i} className="resume-timeline-item">
                  <div className="resume-item-top">
                    <h3 className="resume-item-title">{intern.organization}</h3>
                    <span className="resume-item-period">{intern.period}</span>
                  </div>
                  <div className="resume-item-sub">
                    <span>{intern.role}</span>
                    <span className="resume-item-location">{intern.location}</span>
                  </div>
                  <p className="resume-item-desc">{intern.description}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Featured Projects */}
        {projects && projects.length > 0 && (
          <section className="resume-section" aria-labelledby="resume-sec-projects">
            <h2 id="resume-sec-projects" className="resume-section-title">
              <Code size={16} /> Engineering &amp; Software Projects
            </h2>
            <div className="resume-projects-list">
              {projects.map((proj, i) => (
                <article key={i} className="resume-project-card">
                  <div className="resume-project-top">
                    <h3 className="resume-project-title">{proj.title}</h3>
                    <span className="resume-project-category">{proj.category}</span>
                  </div>
                  <p className="resume-project-summary">{proj.summary}</p>
                  <div className="resume-project-tech">
                    <strong>Tech: </strong>{proj.techStack.join(' • ')}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Certifications */}
        {certifications && certifications.length > 0 && (
          <section className="resume-section" aria-labelledby="resume-sec-certifications">
            <h2 id="resume-sec-certifications" className="resume-section-title">
              <Award size={16} /> Verified Certifications
            </h2>
            <div className="resume-certs-grid">
              {certifications.map((cert, i) => (
                <div key={i} className="resume-cert-item">
                  <span className="resume-cert-title">{cert.title}</span>
                  <div className="resume-cert-meta">
                    <span>{cert.issuer}</span>
                    <span>{cert.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
