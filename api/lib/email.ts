// api/lib/email.ts
// Resend transactional email helper — server-side only

export interface WelcomeEmailData {
  to: string;
  name: string;
  subject: string;
}

export interface ContactAutoReplyData {
  to: string;
  name: string;
  subject: string;
  replyTo?: string;
  submissionId?: string;
}

export async function sendContactAutoReply(data: ContactAutoReplyData): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM_ADDRESS;
  const replyTo = data.replyTo || 'sridharvpr7@gmail.com';

  if (!apiKey || !from) {
    if (!apiKey) console.warn('[email] RESEND_API_KEY not set; auto-reply email disabled');
    if (!from) console.warn('[email] EMAIL_FROM_ADDRESS not configured; auto-reply email disabled until verified sender domain is set');
    return false;
  }

  const safeName = escapeHtml(data.name || 'there');
  const safeSubject = escapeHtml(data.subject || 'Portfolio Inquiry');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Thank you for reaching out – Sridhar</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; margin: 0; padding: 2rem; color: #f3f4f6;">
  <div style="max-width: 560px; margin: 0 auto; background: #111827; border-radius: 14px; padding: 2rem 2.25rem; border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
    <div style="margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 1rem;">
      <span style="font-size: 1.1rem; font-weight: 700; letter-spacing: 0.05em; color: #00f2fe;">BEYOND THE CIRCUIT</span>
    </div>
    <p style="font-size: 1.05rem; color: #f3f4f6; margin-top: 0; line-height: 1.6;">Hi ${safeName},</p>
    <p style="color: #d1d5db; line-height: 1.65; font-size: 0.98rem;">
      Thank you for reaching out through my portfolio website.
    </p>
    <p style="color: #d1d5db; line-height: 1.65; font-size: 0.98rem;">
      I have received your message regarding:
    </p>
    <div style="background: rgba(255, 255, 255, 0.04); border-left: 3px solid #00f2fe; padding: 0.85rem 1.15rem; margin: 1.25rem 0; border-radius: 4px; font-weight: 500; color: #f3f4f6; font-size: 0.95rem;">
      "${safeSubject}"
    </div>
    <p style="color: #d1d5db; line-height: 1.65; font-size: 0.98rem;">
      I will review your message and get back to you as soon as possible.
    </p>
    <div style="margin-top: 2rem; padding-top: 1.25rem; border-top: 1px solid rgba(255, 255, 255, 0.08);">
      <p style="margin: 0; color: #e5e7eb; font-weight: 600;">Best regards,</p>
      <p style="margin: 0.25rem 0 0 0; font-weight: 700; color: #00f2fe; font-size: 1.05rem;">Sridhar</p>
      <p style="margin: 0.2rem 0 0 0; color: #9ca3af; font-size: 0.88rem;">ECE Student &amp; Web Developer</p>
      <p style="margin: 0.5rem 0 0 0; font-size: 0.88rem;">
        <a href="https://sridhar-portfolio-gyoy.onrender.com" style="color: #4facfe; text-decoration: none;">Portfolio: https://sridhar-portfolio-gyoy.onrender.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `Hi ${data.name || 'there'},

Thank you for reaching out through my portfolio website.

I have received your message regarding:
"${data.subject || 'Portfolio Inquiry'}"

I will review your message and get back to you as soon as possible.

Best regards,
Sridhar
ECE Student & Web Developer
Portfolio: https://sridhar-portfolio-gyoy.onrender.com`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [data.to],
        reply_to: replyTo,
        subject: 'Thank you for reaching out – Sridhar',
        html,
        text,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error('[email] Resend contact auto-reply error:', body);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] Resend network error:', err);
    return false;
  }
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM_ADDRESS;
  if (!apiKey || !from) {
    if (!apiKey) console.warn('[email] RESEND_API_KEY not set; email disabled');
    if (!from) console.warn('[email] EMAIL_FROM_ADDRESS not configured; email disabled until verified sender domain is set');
    return false;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${data.subject}</title>
</head>
<body style="font-family:system-ui,sans-serif;background:#f5f7fb;margin:0;padding:2rem">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:2rem;border:1px solid #e5e7eb">
    <p style="font-size:1.1rem;color:#111827">Hi ${escapeHtml(data.name)},</p>
    <p style="color:#374151;line-height:1.7">
      Thanks for visiting my portfolio!
    </p>
    <p style="color:#374151;line-height:1.7">
      Feel free to explore my Electronics and Communication Engineering work,
      web development projects, and technical experiments.
    </p>
    <p style="color:#374151;line-height:1.7">Hope you find something interesting.</p>
    <p style="color:#374151">Regards,<br><strong>Sridhar</strong></p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:1.5rem 0">
    <p style="font-size:0.75rem;color:#9ca3af">
      This greeting was sent automatically after you opted in on my portfolio.
      You won't receive further emails unless you sign up for something else.
      To opt out or request data deletion, email the address in the portfolio's Contact section.
    </p>
  </div>
</body>
</html>`;

  const text = `Hi ${data.name},

Thanks for visiting my portfolio!

Feel free to explore my Electronics and Communication Engineering work, web development projects, and technical experiments.

Hope you find something interesting.

Regards,
Sridhar

---
This greeting was sent automatically after you opted in on my portfolio.
You won't receive further emails unless you sign up for something else.
To opt out or request data deletion, email the address in the portfolio's Contact section.`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [data.to],
        subject: data.subject,
        html,
        text,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error('[email] Resend error:', body);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] Network error:', err);
    return false;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
