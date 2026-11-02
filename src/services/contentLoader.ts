// Central content loader — reads JSON from public/data/
// Validates required fields and returns typed data

export async function loadJSON<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      console.warn(`[content] Failed to load ${path}: ${response.status}`);
      return fallback;
    }
    const data = await response.json();
    return data as T;
  } catch (err) {
    console.warn(`[content] Error loading ${path}:`, err);
    return fallback;
  }
}

// ── Type definitions ──────────────────────────────────────

export interface SiteConfig {
  siteName: string;
  siteTagline: string;
  siteDescription: string;
  siteUrl: string;
  locale: string;
  copyrightYear: number;
  sections: Record<string, { visible: boolean }>;
}

export interface ProfileData {
  name: string;
  firstName: string;
  lastName: string;
  tagline: string;
  headline: string;
  subHeadline: string;
  bio: string;
  currentFocus: string;
  location: string;
  resumeUrl: string;
  profileImage: string;
  ctaPrimary: { label: string; href: string };
  ctaSecondary: { label: string; href: string };
  availability?: { show: boolean; status: string; indicator: string };
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  order: number;
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startYear: number;
  endYear: number;
  status: string;
  location: string;
  description: string;
  highlights: string[];
  type: string;
  order: number;
}

export interface Skill {
  id: string;
  name: string;
  level: 'learning' | 'beginner' | 'comfortable';
  icon?: string;
  description?: string;
  relatedProjectIds?: string[];
}

export interface SkillGroup {
  id: string;
  label: string;
  domain: 'hardware' | 'software' | 'both';
  icon: string;
  skills: Skill[];
}

export interface Project {
  id: string;
  title: string;
  shortSummary: string;
  problem?: string;
  solution?: string;
  features?: string[];
  technologies: string[];
  category: string;
  status: string;
  featured: boolean;
  visible: boolean;
  order: number;
  coverImage?: string;
  gallery?: string[];
  githubUrl?: string;
  liveDemoUrl?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
}

export interface ProjectCategory {
  id: string;
  label: string;
}

export interface ExperienceEntry {
  id: string;
  type: 'milestone' | 'job' | 'education';
  title: string;
  organization: string;
  date: string;
  description: string;
  tags: string[];
  order: number;
}

export interface Certification {
  id: string;
  title: string;
  issuer: string;
  date: string;
  credentialUrl?: string;
  certificateFile?: string;
  visible: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  issuerOrEvent: string;
  date: string;
  description?: string;
  url?: string;
  visible?: boolean;
}

export interface ContactData {
  email: string;
  displayEmail: string;
  contactNote: string;
  formEnabled: boolean;
  formProvider?: string | null;
  formEndpoint?: string | null;
}

export interface SocialLink {
  id: string;
  platform: string;
  label: string;
  url: string;
  icon: string;
  visible: boolean;
  showInHero?: boolean;
  showInContact?: boolean;
  showInFooter?: boolean;
}

export interface ThemeConfig {
  defaultTheme: 'dark' | 'light';
  allowSystemTheme: boolean;
  transitions: { duration: number; easing: string };
}

export interface AnimationsConfig {
  intro: { enabled: boolean; duration: number; skipOnReturn: boolean };
  reveals: { enabled: boolean; threshold: number; stagger: number };
  parallax: { enabled: boolean; intensity: number };
  cursor: { enabled: boolean; desktopOnly: boolean };
  reducedMotion: { disableIntro: boolean; disableParallax: boolean; simplifyTransitions: boolean };
  intensity: 'subtle' | 'normal' | 'expressive';
}

// ── Loader functions ──────────────────────────────────────

const BASE = '/data';

export const loadSiteConfig = () =>
  loadJSON<SiteConfig>(`${BASE}/site.json`, {
    siteName: 'Portfolio',
    siteTagline: 'Developer',
    siteDescription: '',
    siteUrl: '',
    locale: 'en',
    copyrightYear: 2025,
    sections: {},
  });

export const loadProfile = () =>
  loadJSON<ProfileData>(`${BASE}/profile.json`, {
    name: 'Developer',
    firstName: 'Developer',
    lastName: '',
    tagline: 'ECE & Full-Stack Developer',
    headline: 'Bridging the World of Circuits and Code',
    subHeadline: 'ECE student building real products from signal to software.',
    bio: '',
    currentFocus: '',
    location: '',
    resumeUrl: '',
    profileImage: '',
    ctaPrimary: { label: 'Explore Projects', href: '#projects' },
    ctaSecondary: { label: 'View Resume', href: '#' },
  });

export const loadNavigation = () =>
  loadJSON<{ items: NavItem[] }>(`${BASE}/navigation.json`, { items: [] });

export const loadEducation = () =>
  loadJSON<{ entries: EducationEntry[] }>(`${BASE}/education.json`, { entries: [] });

export const loadSkills = () =>
  loadJSON<{ groups: SkillGroup[]; levels: Record<string, { label: string; description: string }> }>(
    `${BASE}/skills.json`,
    { groups: [], levels: {} }
  );

export const loadProjects = () =>
  loadJSON<{ projects: Project[]; categories: ProjectCategory[] }>(
    `${BASE}/projects.json`,
    { projects: [], categories: [] }
  );

export const loadExperience = () =>
  loadJSON<{ entries: ExperienceEntry[] }>(`${BASE}/experience.json`, { entries: [] });

export const loadCertifications = () =>
  loadJSON<{ certifications: Certification[] }>(`${BASE}/certifications.json`, { certifications: [] });

export const loadAchievements = () =>
  loadJSON<{ achievements: Achievement[] }>(`${BASE}/achievements.json`, { achievements: [] });

export const loadContact = () =>
  loadJSON<ContactData>(`${BASE}/contact.json`, {
    email: '',
    displayEmail: '',
    contactNote: '',
    formEnabled: false,
  });

export const loadSocialLinks = () =>
  loadJSON<{ links: SocialLink[] }>(`${BASE}/social-links.json`, { links: [] });

export const loadTheme = () =>
  loadJSON<ThemeConfig>(`${BASE}/theme.json`, {
    defaultTheme: 'dark',
    allowSystemTheme: false,
    transitions: { duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  });

export const loadAnimations = () =>
  loadJSON<AnimationsConfig>(`${BASE}/animations.json`, {
    intro: { enabled: true, duration: 3500, skipOnReturn: true },
    reveals: { enabled: true, threshold: 0.15, stagger: 0.08 },
    parallax: { enabled: true, intensity: 0.3 },
    cursor: { enabled: true, desktopOnly: true },
    reducedMotion: { disableIntro: true, disableParallax: true, simplifyTransitions: true },
    intensity: 'normal',
  });
