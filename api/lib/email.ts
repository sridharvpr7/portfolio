// api/lib/email.ts
// Resend transactional email helper — server-side only

export interface WelcomeEmailData {
  to: string;
  name: string;
  subject: string;
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
