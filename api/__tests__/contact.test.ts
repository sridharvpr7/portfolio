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

      const success = await sendContactAutoReply({
        to: 'alex@example.com',
        name: 'Alex Mercer',
        subject: 'Frontend Inquiry',
        replyTo: 'sridharvpr7@gmail.com',
        submissionId: 'sub_test_12345',
      });

      expect(success).toBe(true);
      expect(capturedPayload).not.toBeNull();
      expect(capturedPayload?.to).toEqual(['alex@example.com']);
      expect(capturedPayload?.reply_to).toBe('sridharvpr7@gmail.com');
      expect(capturedPayload?.subject).toBe('Thank you for reaching out – Sridhar');
      expect((capturedPayload?.text as string)).toContain('Thank you for reaching out through my portfolio website.');
      expect((capturedPayload?.text as string)).toContain('"Frontend Inquiry"');
      expect((capturedPayload?.text as string)).toContain('https://sridhar-portfolio-gyoy.onrender.com');
    });

    it('gracefully handles missing credentials without throwing', async () => {
      delete process.env.RESEND_API_KEY;
      delete process.env.EMAIL_FROM_ADDRESS;

      const result = await sendContactAutoReply({
        to: 'alex@example.com',
        name: 'Alex',
        subject: 'Inquiry',
      });

      expect(result).toBe(false);
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

    it('successfully processes valid submission', async () => {
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
      expect(json.submissionId).toMatch(/^sub_/);
    });
  });
});

