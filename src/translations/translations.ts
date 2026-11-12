export type Language = 'en' | 'ta';

export const translations = {
  en: {
    // Navigation
    nav_home: 'Home',
    nav_hero: 'Hero',
    nav_about: 'About',
    nav_skills: 'Skills',
    nav_projects: 'Projects',
    nav_experience: 'Experience',
    nav_certifications: 'Certifications',
    nav_contact: 'Contact',

    // Hero
    hero_explore: 'Explore Projects',
    hero_contact: 'Contact Me',
    hero_resume: 'Resume',

    // About
    about_label: 'About Me',
    about_title: 'The Mind Behind the Work',
    about_focus: 'Current Focus',

    // Skills
    skills_label: 'Technical Stack',
    skills_title: 'Skills & Technologies',
    skills_subtitle: 'A growing toolkit across two engineering disciplines — hardware and software.',

    // Projects
    projects_label: 'Featured Work',
    projects_title: 'Projects',
    projects_subtitle: "Real things I've built — from RTL hardware descriptions to full-stack web applications.",

    // Journey
    journey_label: 'Learning Journey',
    journey_title: 'How I Got Here',
    journey_subtitle: 'A timeline of key milestones — academic, personal, and technical.',
    creds_label: 'Verified Credentials',
    creds_title: 'Certifications & Internships',

    // Contact
    contact_label: 'Get in Touch',
    contact_title: "Let's Build Something",
    contact_send: 'Send Message',
    contact_sending: 'Sending…',
    contact_sent: "Message sent! I'll get back to you soon.",
    contact_name: 'Name',
    contact_email: 'Email',
    contact_subject: 'Subject',
    contact_message: 'Message',
  },
  ta: {
    // Navigation
    nav_home: 'முகப்பு',
    nav_hero: 'முகப்பு',
    nav_about: 'சுயவிவரம்',
    nav_skills: 'திறன்கள்',
    nav_projects: 'திட்டங்கள்',
    nav_experience: 'அனுபவம்',
    nav_certifications: 'சான்றிதழ்கள்',
    nav_contact: 'தொடர்பு',

    // Hero
    hero_explore: 'திட்டங்களை காண்க',
    hero_contact: 'தொடர்பு கொள்க',
    hero_resume: 'சுயவிவரம்',

    // About
    about_label: 'என்னைப் பற்றி',
    about_title: 'பின்னணி மற்றும் பயணம்',
    about_focus: 'தற்போதைய கவனம்',

    // Skills
    skills_label: 'தொழில்நுட்ப தொகுப்பு',
    skills_title: 'திறன்கள் & கருவிகள்',
    skills_subtitle: 'வன்பொருள் மற்றும் மென்பொருள் ஆகிய இரு பொறியியல் துறைகளிலும் உள்ள திறன்கள்.',

    // Projects
    projects_label: 'முக்கிய திட்டங்கள்',
    projects_title: 'திட்டங்கள்',
    projects_subtitle: 'நான் உருவாக்கிய வன்பொருள் மற்றும் இணையப் பயன்பாட்டுத் திட்டங்கள்.',

    // Journey
    journey_label: 'கல்வி & அனுபவம்',
    journey_title: 'எனது பயணம்',
    journey_subtitle: 'முக்கிய மைல்கற்கள் — கல்வி, தனிப்பட்ட மற்றும் தொழில்நுட்ப அனுபவங்கள்.',
    creds_label: 'சரிபார்க்கப்பட்ட சான்றுகள்',
    creds_title: 'சான்றிதழ்கள் & இன்டர்ன்ஷிப்',

    // Contact
    contact_label: 'தொடர்பு கொள்ள',
    contact_title: 'இணைந்து உருவாக்குவோம்',
    contact_send: 'செய்தி அனுப்புக',
    contact_sending: 'அனுப்பப்படுகிறது…',
    contact_sent: 'செய்தி அனுப்பப்பட்டது! விரைவில் பதிலளிக்கிறேன்.',
    contact_name: 'பெயர்',
    contact_email: 'மின்னஞ்சல்',
    contact_subject: 'தலைப்பு',
    contact_message: 'செய்தி',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
