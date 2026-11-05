// api/__tests__/contact.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatContactTelegramHtml, escapeTgHtml } from '../lib/telegram';
import { sendContactAutoReply } from '../lib/email';
import contactHandler from '../contact';

describe('Contact & Telegram Automation Tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Telegram Contact Notification Template', () => {
    it('escapes HTML special characters properly', () => {
      expect(escapeTgHtml('Hello <world> & "friends"')).toBe('Hello &lt;world&gt; &amp; "friends"');
    });

    it('formats Telegram contact message with exact required sections and dividers', () => {
      const formatted = formatContactTelegramHtml({
        visitorName: 'Alex Mercer',
        visitorEmail: 'alex@example.com',
        subject: 'Project Collaboration',
        visitorMessage: 'Excited to discuss web development & VLSI!',
        submissionId: 'sub_test_12345',
        date: '05 Nov 2026',
        time: '9:45 PM IST',
      });

      expect(formatted).toContain('🚀 <b>NEW PORTFOLIO CONTACT</b>');
      expect(formatted).toContain('━━━━━━━━━━━━━━━━━━');
      expect(formatted).toContain('👤 <b>VISITOR DETAILS</b>');
      expect(formatted).toContain('<b>Name:</b> Alex Mercer');
      expect(formatted).toContain('<b>Email:</b> alex@example.com');
      expect(formatted).toContain('<b>Subject:</b> Project Collaboration');
      expect(formatted).toContain('💬 <b>MESSAGE</b>');
      expect(formatted).toContain('Excited to discuss web development &amp; VLSI!');
      expect(formatted).toContain('📊 <b>SUBMISSION DETAILS</b>');
      expect(formatted).toContain('📅 <b>Date:</b> 05 Nov 2026');
      expect(formatted).toContain('⏰ <b>Time:</b> 9:45 PM IST');
      expect(formatted).toContain('🌐 <b>Source:</b> Portfolio Contact Form');
      expect(formatted).toContain('🔖 <b>Submission ID:</b> <code>sub_test_12345</code>');
      expect(formatted).toContain('⚡ <b>BEYOND THE CIRCUIT</b>');
      expect(formatted).toContain('Sridhar | ECE Student &amp; Web Developer');
    });
  });

  describe('Automatic Email Reply (Resend Integration)', () => {
    it('sends contact auto-reply with reply-to set to sridharvpr7@gmail.com and correct subject', async () => {
      process.env.RESEND_API_KEY = 're_test_key_123';
      process.env.EMAIL_FROM_ADDRESS = 'Sridhar <onboarding@resend.dev>';

      let capturedPayload: Record<string, unknown> | null = null;
      global.fetch = vi.fn().mockImplementation(async (_url, options) => {
        capturedPayload = JSON.parse(options.body as string);
        return {
          ok: true,
          json: async () => ({ id: 'email_123' }),
        };
      });

      const res = await sendContactAutoReply({
        to: 'alex@example.com',
        name: 'Alex Mercer',
        subject: 'Frontend Inquiry',
        replyTo: 'sridharvpr7@gmail.com',
        submissionId: 'sub_test_12345',
      });

      expect(res.ok).toBe(true);
      expect(res.id).toBe('email_123');
      expect(capturedPayload).not.toBeNull();
      expect(capturedPayload?.to).toEqual(['alex@example.com']);
      expect(capturedPayload?.reply_to).toBe('sridharvpr7@gmail.com');
      expect(capturedPayload?.subject).toBe('Thank you for reaching out – Sridhar');
      expect((capturedPayload?.text as string)).toContain('Thank you for reaching out through my portfolio website.');
      expect((capturedPayload?.text as string)).toContain('"Frontend Inquiry"');
      expect((capturedPayload?.text as string)).toContain('https://sridhar-portfolio-gyoy.onrender.com');
    });

    it('gracefully handles missing credentials without throwing and returns error description', async () => {
      delete process.env.RESEND_API_KEY;
      delete process.env.EMAIL_FROM_ADDRESS;

      const result = await sendContactAutoReply({
        to: 'alex@example.com',
        name: 'Alex',
        subject: 'Inquiry',
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('RESEND_API_KEY');
    });

    it('captures Resend HTTP error response cleanly', async () => {
      process.env.RESEND_API_KEY = 're_test_key_123';
      process.env.EMAIL_FROM_ADDRESS = 'Sridhar <onboarding@resend.dev>';

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => 'Domain not verified',
      });

      const result = await sendContactAutoReply({
        to: 'alex@example.com',
        name: 'Alex',
        subject: 'Inquiry',
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('Domain not verified');
    });
  });

  describe('POST /api/contact Route Handler', () => {
    function createMockRes() {
      let statusCode = 200;
      let jsonBody: unknown = null;
      let ended = false;

      const res = {
        status(code: number) {
          statusCode = code;
          return res;
        },
        json(body: unknown) {
          jsonBody = body;
          ended = true;
          return res;
        },
        end() {
          ended = true;
          return res;
        },
        getStatusCode: () => statusCode,
        getJson: () => jsonBody,
        isEnded: () => ended,
      };
      return res;
    }

    it('rejects non-POST methods with 405', async () => {
      const req = { method: 'GET', headers: {}, body: {} };
      const res = createMockRes();

      await contactHandler(req as any, res as any);
      expect(res.getStatusCode()).toBe(405);
    });

    it('silently absorbs honeypot submissions with 200', async () => {
      const req = {
        method: 'POST',
        headers: { 'x-forwarded-for': '127.0.0.1' },
        body: {
          name: 'Spam Bot',
          email: 'bot@spam.com',
          subject: 'Crypto Offer',
          message: 'Buy now!',
          _hp: 'gotcha',
        },
      };
      const res = createMockRes();

      await contactHandler(req as any, res as any);
      expect(res.getStatusCode()).toBe(200);
      expect((res.getJson() as any)?.ok).toBe(true);
      expect((res.getJson() as any)?.submissionId).toBe('ack_bot');
    });

    it('validates required fields', async () => {
      const req = {
        method: 'POST',
        headers: { 'x-forwarded-for': '127.0.0.2' },
        body: {
          name: '',
          email: 'invalid-email',
          subject: '',
          message: 'hi',
        },
      };
      const res = createMockRes();

      await contactHandler(req as any, res as any);
      expect(res.getStatusCode()).toBe(400);
    });

    it('handles failed email delivery without falsely claiming acknowledgement was sent', async () => {
      delete process.env.RESEND_API_KEY;
      delete process.env.EMAIL_FROM_ADDRESS;
      delete process.env.DATABASE_URL;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true }),
      });

      const req = {
        method: 'POST',
        headers: { 'x-forwarded-for': '127.0.0.3' },
        body: {
          name: 'Sarah Connor',
          email: 'sarah@example.com',
          subject: 'Hardware Integration Inquiry',
          message: 'Interested in discussing digital electronics and VLSI projects.',
        },
      };
      const res = createMockRes();

      await contactHandler(req as any, res as any);
      expect(res.getStatusCode()).toBe(200);
      const json = res.getJson() as any;
      expect(json.ok).toBe(true);
      expect(json.emailSent).toBe(false);
      // Explicitly does NOT claim an acknowledgment email was sent
      expect(json.message).not.toContain('acknowledgment email has been sent');
      expect(json.message).toContain('delivered to Sridhar');
    });

    it('confirms acknowledgement email when Resend delivery succeeds', async () => {
      process.env.RESEND_API_KEY = 're_key_valid';
      process.env.EMAIL_FROM_ADDRESS = 'Sridhar <onboarding@resend.dev>';
      delete process.env.DATABASE_URL;

      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('telegram')) {
          return { ok: true, json: async () => ({ ok: true }) };
        }
        if (url.includes('resend')) {
          return { ok: true, json: async () => ({ id: 'email_ok_1' }) };
        }
        return { ok: true, json: async () => ({}) };
      });

      const req = {
        method: 'POST',
        headers: { 'x-forwarded-for': '127.0.0.4' },
        body: {
          name: 'Marcus Wright',
          email: 'marcus@example.com',
          subject: 'Full-Stack Collaboration',
          message: 'Would love to discuss web and embedded systems.',
        },
      };
      const res = createMockRes();

      await contactHandler(req as any, res as any);
      expect(res.getStatusCode()).toBe(200);
      const json = res.getJson() as any;
      expect(json.ok).toBe(true);
      expect(json.emailSent).toBe(true);
      expect(json.message).toContain('acknowledgment email has been sent');
    });

    it('detects duplicate submission and prevents duplicate processing', async () => {
      delete process.env.DATABASE_URL;

      const req = {
        method: 'POST',
        headers: { 'x-forwarded-for': '127.0.0.5' },
        body: {
          name: 'Kyle Reese',
          email: 'kyle@example.com',
          subject: 'Timeline Verification',
          message: 'Can you confirm the internship dates?',
        },
      };

      const res1 = createMockRes();
      await contactHandler(req as any, res1 as any);
      expect(res1.getStatusCode()).toBe(200);

      const res2 = createMockRes();
      await contactHandler(req as any, res2 as any);
      expect(res2.getStatusCode()).toBe(200);
      const json2 = res2.getJson() as any;
      expect(json2.duplicate).toBe(true);
      expect(json2.submissionId).toBe((res1.getJson() as any).submissionId);
    });
  });
});
