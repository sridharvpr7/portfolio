import React, { useState, useEffect } from 'react';
import { Star, GitFork, ExternalLink, Code2, BookOpen, Users, Activity } from 'lucide-react';
import { GithubIcon } from '../components/BrandIcons';
import { useReveal } from '../hooks/useReveal';
import './GitHubSection.css';

interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
}

interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
  bio: string | null;
}

interface ActivityData {
  user: GitHubUser;
  repos: GitHubRepo[];
  languages: Record<string, number>;
  cached?: boolean;
  fallback?: boolean;
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178C6',
  JavaScript: '#F7DF1E',
  Verilog: '#8874FF',
  'C++': '#F34B7D',
  HTML: '#E34F26',
  CSS: '#563D7C',
  Python: '#3572A5',
};

export const GitHubSection: React.FC = () => {
  const { ref: sectionRef, isVisible } = useReveal<HTMLElement>({ threshold: 0.05 });
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/github/activity', { signal: AbortSignal.timeout(4000) })
      .then((res) => {
        if (!res.ok) throw new Error('Network response error');
        return res.json();
      })
      .then((json: ActivityData) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        // Fallback default
        setData({
          user: {
            login: 'sridharvpr7',
            name: 'Sridhar VPR',
            avatar_url: 'https://avatars.githubusercontent.com/u/102000000?v=4',
            html_url: 'https://github.com/sridharvpr7',
            public_repos: 8,
            followers: 6,
            following: 8,
            bio: 'ECE Student | VLSI Enthusiast | Full-Stack Web Developer. Where Hardware Meets Software.',
          },
          repos: [
            {
              id: 1,
              name: 'portfolio',
              description: 'Beyond the Circuit — Personal technology portfolio bridging digital electronics and full-stack web engineering.',
              html_url: 'https://github.com/sridharvpr7/portfolio',
              stargazers_count: 5,
              forks_count: 1,
              language: 'TypeScript',
              updated_at: new Date().toISOString(),
            },
            {
              id: 2,
              name: 'verilog-digital-systems',
              description: 'Synthesizable RTL designs in Verilog HDL: 32-bit ALU, state machines, synchronous FIFOs, and pipelined registers.',
              html_url: 'https://github.com/sridharvpr7',
              stargazers_count: 3,
              forks_count: 0,
              language: 'Verilog',
              updated_at: new Date().toISOString(),
            },
            {
              id: 3,
              name: 'iot-hardware-telemetry',
              description: 'Embedded microcontroller sensor telemetry system with real-time web socket dashboard integration.',
              html_url: 'https://github.com/sridharvpr7',
              stargazers_count: 2,
              forks_count: 0,
              language: 'C++',
              updated_at: new Date().toISOString(),
            },
            {
              id: 4,
              name: 'react-fullstack-starter',
              description: 'Production-ready React 19 and Node.js REST API template with PostgreSQL database integration.',
              html_url: 'https://github.com/sridharvpr7',
              stargazers_count: 2,
              forks_count: 0,
              language: 'JavaScript',
              updated_at: new Date().toISOString(),
            },
          ],
          languages: {
            TypeScript: 42,
            Verilog: 26,
            'C++': 18,
            JavaScript: 14,
          },
          fallback: true,
        });
        setLoading(false);
      });
  }, []);

  return (
    <section id="github" className="github-section" ref={sectionRef} aria-label="GitHub Activity">
      <div className="container">
        {/* Section Header */}
        <div className={`section-header ${isVisible ? 'revealed' : ''}`}>
          <div className="section-eyebrow">
            <span className="eyebrow-dot" />
            <span className="font-mono">Open Source & Repositories</span>
          </div>
          <h2 className="section-title">
            GitHub Live <span className="text-gradient">Activity</span>
          </h2>
          <p className="section-subtitle">
            Exploring hardware RTL descriptions, digital electronics simulators, and full-stack web applications.
          </p>
        </div>

        {/* Profile Stats Overview */}
        {data && (
          <div className={`github-profile-card ${isVisible ? 'revealed' : ''}`}>
            <div className="github-profile-left">
              <div className="github-avatar-wrap">
                <img
                  src={data.user.avatar_url}
                  alt={data.user.name}
                  className="github-avatar-img"
                  onError={(e) => {
                    // Fallback to github icon if avatar fails
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <GithubIcon className="github-avatar-fallback" size={32} />
              </div>
              <div className="github-meta">
                <div className="github-name-row">
                  <h3 className="github-name">{data.user.name}</h3>
                  <a
                    href={data.user.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="github-handle"
                  >
                    @{data.user.login}
                    <ExternalLink size={12} />
                  </a>
                </div>
                <p className="github-bio">{data.user.bio}</p>
              </div>
            </div>

            <div className="github-stats-bar">
              <div className="github-stat-pill">
                <BookOpen size={16} className="stat-icon-blue" />
                <span className="stat-num">{data.user.public_repos}</span>
                <span className="stat-label">Repositories</span>
              </div>
              <div className="github-stat-pill">
                <Users size={16} className="stat-icon-violet" />
                <span className="stat-num">{data.user.followers}</span>
                <span className="stat-label">Followers</span>
              </div>
              <div className="github-stat-pill">
                <Activity size={16} className="stat-icon-green" />
                <span className="stat-num">Active</span>
                <span className="stat-label">Status</span>
              </div>
            </div>
          </div>
        )}

        {/* Primary Language Breakdown Bar */}
        {data?.languages && (
          <div className={`github-languages-wrap ${isVisible ? 'revealed' : ''}`}>
            <div className="languages-header">
              <Code2 size={16} className="lang-icon" />
              <span className="languages-title">Primary Code & Hardware Languages</span>
            </div>
            <div className="languages-bar-track">
              {Object.entries(data.languages).map(([lang, pct]) => (
                <div
                  key={lang}
                  className="lang-segment"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: LANGUAGE_COLORS[lang] || '#438EFF',
                  }}
                  title={`${lang}: ${pct}%`}
                />
              ))}
            </div>
            <div className="languages-legend">
              {Object.entries(data.languages).map(([lang, pct]) => (
                <div key={lang} className="lang-legend-item">
                  <span
                    className="lang-dot"
                    style={{ backgroundColor: LANGUAGE_COLORS[lang] || '#438EFF' }}
                  />
                  <span className="lang-name">{lang}</span>
                  <span className="lang-pct">{pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Repository Cards Grid */}
        <div className={`github-repos-grid ${isVisible ? 'revealed' : ''}`}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="github-repo-card skeleton">
                <div className="skeleton-title" />
                <div className="skeleton-desc" />
                <div className="skeleton-meta" />
              </div>
            ))
          ) : (
            data?.repos.slice(0, 6).map((repo) => (
              <a
                key={repo.id}
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="github-repo-card"
              >
                <div className="repo-card-top">
                  <div className="repo-name-wrap">
                    <BookOpen size={16} className="repo-book-icon" />
                    <h4 className="repo-title">{repo.name}</h4>
                  </div>
                  <ExternalLink size={14} className="repo-external-icon" />
                </div>

                <p className="repo-desc">
                  {repo.description || 'Hardware and software development repository.'}
                </p>

                <div className="repo-footer">
                  {repo.language && (
                    <div className="repo-lang">
                      <span
                        className="repo-lang-dot"
                        style={{ backgroundColor: LANGUAGE_COLORS[repo.language] || '#438EFF' }}
                      />
                      <span>{repo.language}</span>
                    </div>
                  )}

                  <div className="repo-counts">
                    {repo.stargazers_count > 0 && (
                      <span className="repo-count">
                        <Star size={13} />
                        {repo.stargazers_count}
                      </span>
                    )}
                    {repo.forks_count > 0 && (
                      <span className="repo-count">
                        <GitFork size={13} />
                        {repo.forks_count}
                      </span>
                    )}
                  </div>
                </div>
              </a>
            ))
          )}
        </div>

        {/* GitHub Explore CTA */}
        <div className={`github-cta-wrap ${isVisible ? 'revealed' : ''}`}>
          <a
            href="https://github.com/sridharvpr7"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary github-explore-btn"
          >
            <GithubIcon size={16} />
            <span>Explore all repositories on GitHub (@sridharvpr7)</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </section>
  );
};

