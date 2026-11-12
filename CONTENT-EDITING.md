# Content Editing Guide — Beyond the Circuit

All portfolio content lives in `public/data/`. Edit these JSON files to update the site. Changes take effect immediately in development (`npm run dev`) and after re-deploying in production.

> **Important:** Never put private keys, passwords, or tokens in these files — they are publicly readable.

---

## File Reference

### `site.json` — Site-wide settings

```jsonc
{
  "siteName": "Beyond the Circuit — Sridhar",  // Browser tab title prefix
  "siteTagline": "ECE × Software",             // Short tagline
  "siteUrl": "https://sridharvpr-portfolio.onrender.com", // Your deployed URL (for OG tags)
  "copyrightYear": 2026,                       // Footer copyright year
  "locale": "en-IN"
}
```

---

### `profile.json` — Hero section and bio

```jsonc
{
  "name": "Sridhar",
  "tagline": "ECE Student & Full-Stack Developer",
  "headline": "Bridging the World of Circuits and Code",
  "subHeadline": "One or two sentences for the hero subtitle.",
  "bio": "Multi-paragraph bio. Use \\n\\n to separate paragraphs.",
  "currentFocus": "What you're focused on right now.",
  "location": "India",
  "resumeUrl": "",       // Set to "/assets/resume/resume.pdf" after adding your PDF
  "profileImage": "/assets/profile/profile.jpg",   // Add your photo here
  "ctaPrimary": { "label": "Explore Projects", "href": "#projects" },
  "ctaSecondary": { "label": "View Resume", "href": "" },  // Set href when you add PDF
  "availability": {
    "show": true,
    "status": "Open to Internships & Collaborations",
    "indicator": "active"   // "active" | "busy" | "unavailable"
  }
}
```

**To add your profile photo:**
1. Place your photo at `public/assets/profile/profile.jpg` (or `.png`).
2. Update `profileImage` to match the filename.

**To add your resume:**
1. Place your PDF at `public/assets/resume/resume.pdf`.
2. Set `resumeUrl` to `"/assets/resume/resume.pdf"`.
3. Set `ctaSecondary.href` to `"/assets/resume/resume.pdf"`.

---

### `navigation.json` — Navbar links

```jsonc
{
  "items": [
    { "id": "about", "label": "About", "href": "#about", "visible": true },
    { "id": "skills", "label": "Skills", "href": "#skills", "visible": true }
    // ...
  ]
}
```

Set `"visible": false` to hide a nav item without deleting it.

---

### `education.json` — Education section

```jsonc
{
  "education": [
    {
      "id": "college",
      "institution": "Your College Name",
      "degree": "B.E. Electronics and Communication Engineering",
      "duration": "2022 – 2026",
      "grade": "8.5 CGPA",          // or "" to hide
      "description": "Brief description of your studies.",
      "highlights": ["VLSI Design", "Embedded Systems"],
      "visible": true
    }
  ]
}
```

---

### `skills.json` — Skills section

```jsonc
{
  "categories": [
    {
      "id": "hardware",
      "label": "Hardware & Electronics",
      "icon": "cpu",
      "skills": [
        { "name": "Verilog / SystemVerilog", "level": 80, "visible": true }
        // level: 0–100, used for the progress bar
      ]
    }
  ]
}
```

---

### `projects.json` — Projects section

```jsonc
{
  "projects": [
    {
      "id": "my-project",
      "title": "Project Title",
      "shortDescription": "One-line description.",
      "longDescription": "Full description shown in the modal.",
      "category": "hardware",         // "hardware" | "software" | "fullstack"
      "tags": ["React", "Verilog"],
      "featured": true,               // Shows in featured row
      "status": "completed",          // "completed" | "in-progress" | "archived"
      "year": 2025,
      "thumbnail": "/assets/projects/my-project/thumbnail.jpg",
      "gallery": [
        "/assets/projects/my-project/img1.jpg"
      ],
      "links": {
        "github": "https://github.com/you/repo",
        "demo": "",                   // Leave "" if no live demo
        "report": ""                  // Leave "" if no report PDF
      },
      "highlights": ["Key achievement 1", "Key achievement 2"],
      "visible": true
    }
  ]
}
```

**To add project images:**
1. Create folder: `public/assets/projects/<project-id>/`
2. Add `thumbnail.jpg` and any gallery images.
3. Update the JSON paths.

---

### `experience.json` — Experience / internships

```jsonc
{
  "experience": [
    {
      "id": "internship-1",
      "company": "Company Name",
      "role": "Software Intern",
      "duration": "May 2025 – July 2025",
      "location": "Remote",
      "description": "What you did.",
      "highlights": ["Built X", "Improved Y by Z%"],
      "technologies": ["React", "Node.js"],
      "visible": true
    }
  ]
}
```

Leave `"experience": []` if you have no experience yet — the section will be hidden.

---

### `certifications.json` — Certifications

```jsonc
{
  "certifications": [
    {
      "id": "cert-1",
      "title": "Certification Name",
      "issuer": "Issuing Organisation",
      "date": "2025-06",             // YYYY-MM
      "credentialId": "",            // Leave "" if none
      "credentialUrl": "",           // Link to verify online
      "certificateFile": "/assets/certificates/cert-1.jpg",
      "description": "Brief description.",
      "skills": ["VLSI", "Verilog"],
      "visible": true
    }
  ]
}
```

**To add certificate images:**
1. Place the image at `public/assets/certificates/<filename>.jpg`.
2. Update `certificateFile` to match.

---

### `achievements.json` — Awards and achievements

```jsonc
{
  "achievements": [
    {
      "id": "ach-1",
      "title": "Achievement Title",
      "description": "What you accomplished.",
      "date": "2025-03",
      "category": "academic",       // "academic" | "competition" | "other"
      "visible": true
    }
  ]
}
```

---

### `contact.json` — Contact section

```jsonc
{
  "email": "you@example.com",        // Shown in the contact section
  "emailjsServiceId": "",            // From EmailJS dashboard
  "emailjsTemplateId": "",           // From EmailJS dashboard
  "formEnabled": true,               // Show contact form
  "directEmailEnabled": true         // Show mailto link
}
```

**EmailJS setup (contact form):**
1. Sign up at [emailjs.com](https://www.emailjs.com) (free tier: 200 emails/month).
2. Create a service (Gmail, Outlook, etc.) → copy the **Service ID**.
3. Create a template → copy the **Template ID**.
4. Copy your **Public Key** from Account → API Keys.
5. Add to `.env`:
   ```
   VITE_EMAILJS_PUBLIC_KEY=your_public_key
   ```
6. Update `emailjsServiceId` and `emailjsTemplateId` in `contact.json`.

---

### `social-links.json` — Social links

```jsonc
{
  "links": [
    {
      "id": "github",
      "platform": "GitHub",
      "url": "https://github.com/your-username",
      "showInNav": true,
      "showInFooter": true,
      "showInContact": true,
      "visible": true
    },
    {
      "id": "linkedin",
      "platform": "LinkedIn",
      "url": "https://linkedin.com/in/your-profile",
      "showInNav": false,
      "showInFooter": true,
      "showInContact": true,
      "visible": true
    }
  ]
}
```

---

### `seo.json` — SEO / Open Graph meta

```jsonc
{
  "title": "Beyond the Circuit — Sridhar | ECE & Full-Stack",
  "description": "Portfolio of an ECE student building at the intersection of hardware and software.",
  "keywords": ["ECE", "VLSI", "React", "portfolio"],
  "ogImage": "/assets/og-image.jpg",   // 1200×630px image for social previews
  "twitterHandle": "@yourhandle"        // Leave "" if none
}
```

---

### `theme.json` — Colour palette overrides

Colours use CSS custom property names. You can override them here:

```jsonc
{
  "defaultTheme": "dark",
  "colors": {
    "accentBlue": "#38bdf8",
    "accentGreen": "#4ade80",
    "accentViolet": "#a78bfa"
  }
}
```

Leave as-is to use the default dark-circuit theme.

---

### `animations.json` — Animation toggles

```jsonc
{
  "intro": { "enabled": true, "durationMs": 3200 },
  "circuitBackground": { "enabled": true },
  "scrollAnimations": { "enabled": true },
  "reducedMotionRespect": true    // Always true — honours prefers-reduced-motion
}
```

---

## Quick Checklist — Before Going Live

- [ ] Add profile photo to `public/assets/profile/`
- [ ] Update `profile.json` name, tagline, bio
- [ ] Update `education.json` with your real institution
- [ ] Update `skills.json` with your actual skill levels
- [ ] Add at least one real project to `projects.json`
- [ ] Update `contact.json` with your real email
- [ ] Update `social-links.json` with your GitHub / LinkedIn
- [ ] Set up EmailJS and add keys to `.env`
- [ ] (Optional) Add resume PDF, update `profile.json` `resumeUrl`
- [ ] (Optional) Set up Firebase for Google Sign-in and live viewer count
- [ ] Deploy and verify all sections render correctly
