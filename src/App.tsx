import { useState, useEffect, useCallback } from 'react';
import { IntroSequence } from './components/IntroSequence';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HeroSection } from './sections/HeroSection';
import { DualIdentitySection } from './sections/DualIdentitySection';
import { AboutSection } from './sections/AboutSection';
import { SkillsSection } from './sections/SkillsSection';
import { ProjectsSection } from './sections/ProjectsSection';
import { ExperienceSection } from './sections/ExperienceSection';
import { ContactSection } from './sections/ContactSection';
import { useTheme } from './hooks/useTheme';
import { useActiveSection } from './hooks/useReveal';
import { useAnalytics } from './hooks/useAnalytics';
import {
  loadProfile,
  loadSiteConfig,
  loadNavigation,
  loadEducation,
  loadSkills,
  loadProjects,
  loadExperience,
  loadCertifications,
  loadAchievements,
  loadContact,
  loadSocialLinks,
  loadAnimations,
  type ProfileData,
  type SiteConfig,
  type NavItem,
  type EducationEntry,
  type SkillGroup,
  type Project,
  type ProjectCategory,
  type ExperienceEntry,
  type Certification,
  type Achievement,
  type ContactData,
  type SocialLink,
  type AnimationsConfig,
} from './services/contentLoader';

// Prevent flash of wrong theme — apply dark before paint
(function() {
  try {
    const saved = localStorage.getItem('portfolio-theme');
    const theme = (saved === 'light' || saved === 'dark') ? saved : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  } catch {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();

const INTRO_SESSION_KEY = 'portfolio-intro-seen';
const SECTION_IDS = ['hero', 'about', 'skills', 'projects', 'experience', 'contact'];

interface AppData {
  site: SiteConfig | null;
  profile: ProfileData | null;
  navItems: NavItem[];
  education: EducationEntry[];
  skillGroups: SkillGroup[];
  skillLevels: Record<string, { label: string; description: string }>;
  projects: Project[];
  projectCategories: ProjectCategory[];
  experience: ExperienceEntry[];
  certifications: Certification[];
  achievements: Achievement[];
  animations: AnimationsConfig | null;
  contact: ContactData | null;
  socialLinks: SocialLink[];
}

function App() {
  const { isDark, toggle } = useTheme();
  const activeSection = useActiveSection(SECTION_IDS);
  const { stats, analyticsReady, configEnabled } = useAnalytics();

  // Load notifications config for Footer (client-visible settings only)
  const [notificationsConfig, setNotificationsConfig] = useState<{
    enabled: boolean;
    googleSignIn?: { enabled: boolean };
    emailGreeting?: { enabled: boolean };
    privacy?: { deletionContactEmail: string; retentionPolicyDays: number };
  }>({ enabled: false });

  useEffect(() => {
    fetch('/data/notifications.json', { signal: AbortSignal.timeout(3000) })
      .then(r => r.json())
      .then(cfg => setNotificationsConfig(cfg))
      .catch(() => {}); // fail silently
  }, []);

  const [data, setData] = useState<AppData>({
    site: null,
    profile: null,
    navItems: [],
    education: [],
    skillGroups: [],
    skillLevels: {},
    projects: [],
    projectCategories: [],
    experience: [],
    certifications: [],
    achievements: [],
    animations: null,
    contact: null,
    socialLinks: [],
  });

  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return !sessionStorage.getItem(INTRO_SESSION_KEY);
    } catch {
      return false;
    }
  });

  // Load all content
  useEffect(() => {
    Promise.all([
      loadSiteConfig(),
      loadProfile(),
      loadNavigation(),
      loadEducation(),
      loadSkills(),
      loadProjects(),
      loadExperience(),
      loadCertifications(),
      loadAchievements(),
      loadContact(),
      loadSocialLinks(),
      loadAnimations(),
    ]).then(([site, profile, nav, edu, skills, projects, exp, certs, achs, contact, social, anim]) => {
      setData({
        site,
        profile,
        navItems: nav.items,
        education: edu.entries,
        skillGroups: skills.groups,
        skillLevels: skills.levels,
        projects: projects.projects,
        projectCategories: projects.categories,
        experience: exp.entries,
        certifications: certs.certifications || [],
        achievements: achs.achievements || [],
        animations: anim,
        contact,
        socialLinks: social.links,
      });
      if (anim?.intro?.enabled === false) {
        setShowIntro(false);
      }
      setLoading(false);
    });
  }, []);

  const handleIntroComplete = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_SESSION_KEY, '1');
    } catch {}
    setShowIntro(false);
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '2px solid var(--border-light)',
          borderTop: '2px solid var(--accent-blue)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem', color: 'var(--text-faint)', letterSpacing: '0.1em' }}>
          Loading portfolio...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const { site, profile, navItems, education, skillGroups, skillLevels, projects, projectCategories, experience, certifications, achievements, animations, contact, socialLinks } = data;

  if (!profile || !site || !contact) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
        <div>
          <h1 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Portfolio configuration not found</h1>
          <p style={{ color: 'var(--text-muted)' }}>Check that <code>public/data/</code> files are present and valid JSON.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showIntro && (
        <IntroSequence
          onComplete={handleIntroComplete}
          duration={animations?.intro?.duration || 3500}
          name={profile.name}
          tagline={profile.tagline}
        />
      )}

      <Navbar
        items={navItems}
        socialLinks={socialLinks}
        activeSection={activeSection}
        resumeUrl={profile.resumeUrl}
        brandName={profile.firstName || profile.name}
        isDark={isDark}
        onThemeToggle={toggle}
      />

      <main id="main-content">
        {site.sections.hero?.visible !== false && (
          <HeroSection profile={profile} socialLinks={socialLinks} />
        )}

        {site.sections.dualIdentity?.visible !== false && (
          <DualIdentitySection skillGroups={skillGroups} />
        )}

        {site.sections.about?.visible !== false && (
          <AboutSection profile={profile} education={education} />
        )}

        {site.sections.skills?.visible !== false && (
          <SkillsSection groups={skillGroups} levels={skillLevels} />
        )}

        {site.sections.projects?.visible !== false && (
          <ProjectsSection projects={projects} categories={projectCategories} />
        )}

        {site.sections.experience?.visible !== false && (
          <ExperienceSection
            entries={experience}
            certifications={certifications}
            achievements={achievements}
          />
        )}

        {site.sections.contact?.visible !== false && (
          <ContactSection contact={contact} socialLinks={socialLinks} />
        )}
      </main>

      <Footer
        site={site}
        socialLinks={socialLinks}
        profileName={profile.name}
        stats={stats}
        analyticsReady={analyticsReady}
        configEnabled={configEnabled}
        notificationsConfig={notificationsConfig}
        contactEmail={contact.email}
      />
    </>
  );
}

export default App;
