import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface NewsletterPayload {
  to: string;
  articleTitle: string;
  articleExcerpt: string;
  articleId: string;
  category: string;
  bannerUrl: string;
  icon: string;
}

export async function sendNewsletterEmail(payload: NewsletterPayload): Promise<boolean> {
  try {
    const articleUrl = `https://www.indigoblueprint.my.id/blog/${payload.articleId}`;
    const unsubscribeUrl = `https://www.indigoblueprint.my.id/api/user/unsubscribe?email=${encodeURIComponent(payload.to)}`;

    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${payload.articleTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1e1b4b;border-radius:16px;overflow:hidden;border:1px solid rgba(167,139,250,0.2);">
          
          <!-- Header -->
          <tr>
            <td style="padding:24px 32px;background:linear-gradient(135deg,#312e81 0%,#1e1b4b 100%);text-align:center;border-bottom:1px solid rgba(167,139,250,0.2);">
              <p style="margin:0;font-size:11px;letter-spacing:3px;color:#a78bfa;text-transform:uppercase;font-weight:700;">✨ THETA INDIGO BLUEPRINT</p>
              <p style="margin:8px 0 0;font-size:13px;color:#c7d2fe;">Lentera Spiritual Harian</p>
            </td>
          </tr>

          <!-- Banner Image -->
          <tr>
            <td style="padding:0;">
              <img src="${payload.bannerUrl}" alt="${payload.articleTitle}" width="600" style="width:100%;display:block;border:none;" />
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px 32px 24px;">
              <!-- Category Badge -->
              <p style="margin:0 0 16px;display:inline-block;">
                <span style="background:rgba(167,139,250,0.15);color:#a78bfa;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;border:1px solid rgba(167,139,250,0.3);">
                  ${payload.icon} ${payload.category}
                </span>
              </p>
              
              <!-- Title -->
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#e0e7ff;line-height:1.3;">
                ${payload.articleTitle}
              </h1>
              
              <!-- Excerpt -->
              <p style="margin:0 0 28px;font-size:15px;color:#c7d2fe;line-height:1.7;">
                ${payload.articleExcerpt}
              </p>
              
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:10px;background:linear-gradient(135deg,#7c3aed,#4f46e5);">
                    <a href="${articleUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">
                      Baca Artikel Selengkapnya →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 32px;"><div style="height:1px;background:rgba(167,139,250,0.15);"></div></td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#6366f1;font-weight:600;">Theta Indigo Blueprint</p>
              <p style="margin:0;font-size:11px;color:#4c4f6b;">
                Anda menerima email ini karena terdaftar di platform kami.<br/>
                <a href="${unsubscribeUrl}" style="color:#a78bfa;text-decoration:underline;">Berhenti berlangganan</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const { error } = await resend.emails.send({
      from: 'Theta Indigo Blueprint <noreply@resend.dev>',
      to: payload.to,
      subject: `✨ Artikel Baru: ${payload.articleTitle}`,
      html,
    });

    if (error) {
      console.error(`Resend error for ${payload.to}:`, error);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`Failed to send email to ${payload.to}:`, err);
    return false;
  }
}

export async function sendBulkNewsletter(
  emails: string[],
  articlePayload: Omit<NewsletterPayload, 'to'>
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  // Send in batches of 10 to respect rate limits
  const batchSize = 10;
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((email) => sendNewsletterEmail({ ...articlePayload, to: email }))
    );
    results.forEach((r) => {
      if (r.status === 'fulfilled' && r.value) sent++;
      else failed++;
    });
    // Small delay between batches
    if (i + batchSize < emails.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return { sent, failed };
}
