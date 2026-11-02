import React, { useState, useRef } from 'react';
import emailjs from '@emailjs/browser';
import { Mail, Send, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '../components/BrandIcons';
import { useReveal } from '../hooks/useReveal';
import type { ContactData, SocialLink } from '../services/contentLoader';
import './ContactSection.css';

interface ContactSectionProps {
  contact: ContactData;
  socialLinks: SocialLink[];
}

// Read EmailJS public credentials from Vite build-time env vars.
// These are NOT secrets — they are safe to embed in the frontend bundle.
const EMAILJS_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  as string | undefined;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  as string | undefined;

// EmailJS is available when all three vars are set
const emailjsConfigured = Boolean(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);

interface FormFields {
  name: string;
  email: string;
  subject: string;
  message: string;
  // Honeypot — must remain empty for a real submission
  _hp: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

type SendStatus = 'idle' | 'sending' | 'success' | 'error';

function validateFields(fields: FormFields): FieldErrors {
  const errors: FieldErrors = {};
  if (!fields.name.trim()) errors.name = 'Name is required';
  if (!fields.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
    errors.email = 'Enter a valid email address';
  }
  if (!fields.subject.trim()) errors.subject = 'Subject is required';
  if (!fields.message.trim()) {
    errors.message = 'Message is required';
  } else if (fields.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters';
  }
  return errors;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ contact, socialLinks }) => {
  const { ref, isVisible } = useReveal<HTMLDivElement>({ threshold: 0.1 });
  const contactLinks = socialLinks.filter(l => l.visible && l.showInContact);

  const [fields, setFields] = useState<FormFields>({
    name: '',
    email: '',
    subject: '',
    message: '',
    _hp: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  // Prevent duplicate submissions
  const submittingRef = useRef(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFields(prev => ({ ...prev, [name]: value }));
    // Clear the error for this field when user starts typing
    if (name in errors) {
      setErrors(prev => { const next = { ...prev }; delete next[name as keyof FieldErrors]; return next; });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check — bots fill this in
    if (fields._hp) return;

    // Prevent double-submit
    if (submittingRef.current) return;

    const fieldErrors = validateFields(fields);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    // If EmailJS is not configured, show a graceful message
    if (!emailjsConfigured) {
      setErrorMsg('The contact form is not configured yet. Please use the email link below.');
      setSendStatus('error');
      return;
    }

    submittingRef.current = true;
    setSendStatus('sending');
    setErrorMsg('');

    try {
      // Send the primary contact email to the portfolio owner.
      // The EmailJS template should define: {{from_name}}, {{from_email}}, {{subject}}, {{message}}.
      // The auto-reply to the visitor is configured inside the EmailJS dashboard on the same template
      // by enabling "Auto-Reply" and setting the recipient to {{from_email}}.
      await emailjs.send(
        EMAILJS_SERVICE_ID!,
        EMAILJS_TEMPLATE_ID!,
        {
          from_name:    fields.name.trim(),
          from_email:   fields.email.trim(),
          subject:      fields.subject.trim(),
          message:      fields.message.trim(),
          reply_to:     fields.email.trim(),
        },
        { publicKey: EMAILJS_PUBLIC_KEY! }
      );

      setSendStatus('success');
      setFields({ name: '', email: '', subject: '', message: '', _hp: '' });
    } catch (err) {
      console.error('[contact] EmailJS error:', err);
      setSendStatus('error');
      setErrorMsg('Failed to send. Please try the email link below or try again later.');
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <section id="contact" className="section contact-section" aria-labelledby="contact-title">
      <div className="container contact-container" ref={ref}>

        <div className={`contact-left ${isVisible ? 'revealed' : ''}`}>
          <div className="section-label">Get in Touch</div>
          <h2 className="section-title" id="contact-title">
            Let's Build<br/><span className="text-gradient">Something</span>
          </h2>

          <p className="contact-note">{contact.contactNote}</p>

          <div className="contact-links">
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                id="contact-email-link"
                className="contact-link-item"
                aria-label={`Email: ${contact.displayEmail}`}
              >
                <div className="contact-link-icon">
                  <Mail size={18} />
                </div>
                <div>
                  <div className="contact-link-label">Email</div>
                  <div className="contact-link-value">{contact.displayEmail}</div>
                </div>
              </a>
            )}

            {contactLinks.map(link => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link-item"
                aria-label={`${link.label} profile`}
              >
                <div className="contact-link-icon">
                  {link.id === 'github' ? <GithubIcon size={18} /> : <LinkedinIcon size={18} />}
                </div>
                <div>
                  <div className="contact-link-label">{link.platform}</div>
                  <div className="contact-link-value">{link.label}</div>
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className={`contact-right ${isVisible ? 'revealed' : ''}`}>
          <div className="contact-card card">
            <div className="contact-card-header">
              <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                &gt; Send a message
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                {emailjsConfigured
                  ? 'Fill out the form below — I\'ll reply within 24 hours.'
                  : 'The best way to reach me is email. I reply to all genuine messages, usually within 24 hours.'}
              </p>
            </div>

            {/* EmailJS contact form — shown when configured */}
            {emailjsConfigured ? (
              <>
                {sendStatus === 'success' ? (
                  <div className="contact-status success" role="alert">
                    <CheckCircle size={16} />
                    Message sent! I'll get back to you soon. Check your inbox for a confirmation email.
                  </div>
                ) : (
                  <form
                    ref={formRef}
                    id="contact-form"
                    className="contact-form"
                    onSubmit={handleSubmit}
                    noValidate
                  >
                    {/* Honeypot field — hidden from real users, visible to bots */}
                    <div className="contact-honeypot" aria-hidden="true">
                      <input
                        type="text"
                        name="_hp"
                        value={fields._hp}
                        onChange={handleChange}
                        tabIndex={-1}
                        autoComplete="off"
                      />
                    </div>

                    <div className="contact-form-row">
                      <div className="contact-field">
                        <label htmlFor="contact-name">Name</label>
                        <input
                          id="contact-name"
                          name="name"
                          type="text"
                          value={fields.name}
                          onChange={handleChange}
                          className={errors.name ? 'field-error' : ''}
                          placeholder="Your name"
                          autoComplete="name"
                          disabled={sendStatus === 'sending'}
                        />
                        {errors.name && <span className="field-error-msg" role="alert">{errors.name}</span>}
                      </div>
                      <div className="contact-field">
                        <label htmlFor="contact-email">Email</label>
                        <input
                          id="contact-email"
                          name="email"
                          type="email"
                          value={fields.email}
                          onChange={handleChange}
                          className={errors.email ? 'field-error' : ''}
                          placeholder="you@example.com"
                          autoComplete="email"
                          disabled={sendStatus === 'sending'}
                        />
                        {errors.email && <span className="field-error-msg" role="alert">{errors.email}</span>}
                      </div>
                    </div>

                    <div className="contact-field">
                      <label htmlFor="contact-subject">Subject</label>
                      <input
                        id="contact-subject"
                        name="subject"
                        type="text"
                        value={fields.subject}
                        onChange={handleChange}
                        className={errors.subject ? 'field-error' : ''}
                        placeholder="What's this about?"
                        disabled={sendStatus === 'sending'}
                      />
                      {errors.subject && <span className="field-error-msg" role="alert">{errors.subject}</span>}
                    </div>

                    <div className="contact-field">
                      <label htmlFor="contact-message">Message</label>
                      <textarea
                        id="contact-message"
                        name="message"
                        value={fields.message}
                        onChange={handleChange}
                        className={errors.message ? 'field-error' : ''}
                        placeholder="Tell me what you're working on..."
                        rows={5}
                        disabled={sendStatus === 'sending'}
                      />
                      {errors.message && <span className="field-error-msg" role="alert">{errors.message}</span>}
                    </div>

                    {sendStatus === 'error' && (
                      <div className="contact-status error" role="alert">
                        <AlertCircle size={16} />
                        {errorMsg || 'Something went wrong. Please try again.'}
                      </div>
                    )}

                    <button
                      type="submit"
                      id="contact-submit-btn"
                      className="btn btn-primary contact-submit-btn"
                      disabled={sendStatus === 'sending'}
                      aria-label="Send message"
                    >
                      {sendStatus === 'sending' ? (
                        <>
                          <Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Send Message
                        </>
                      )}
                    </button>

                    <p className="contact-fallback">
                      Prefer direct email?{' '}
                      <a href={`mailto:${contact.email}?subject=Hello from your portfolio`} id="contact-fallback-mailto">
                        {contact.displayEmail}
                      </a>
                    </p>
                  </form>
                )}
              </>
            ) : (
              /* Fallback: EmailJS not configured — show direct mailto button */
              <>
                <a
                  href={`mailto:${contact.email}?subject=Hello from your portfolio`}
                  id="contact-email-cta"
                  className="btn btn-primary contact-email-btn"
                  aria-label="Open email composer"
                >
                  <Mail size={17} />
                  Compose Email
                  <Send size={14} />
                </a>

                <div className="contact-card-divider" aria-hidden="true">
                  <span>or connect on</span>
                </div>

                <div className="contact-social-row">
                  {contactLinks.map(link => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-social-btn"
                      aria-label={`${link.platform} profile`}
                    >
                      {link.id === 'github' ? <GithubIcon size={17} /> : <LinkedinIcon size={17} />}
                      {link.platform}
                    </a>
                  ))}
                </div>
              </>
            )}

            <div className="contact-availability-note">
              <div className="status-badge" style={{ alignSelf: 'flex-start' }}>
                <span className="status-dot" />
                Open to Internships &amp; Collaborations
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
