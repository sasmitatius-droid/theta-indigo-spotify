import { NextResponse } from 'next/server';

export async function GET() {
  const robotsText = `
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Sitemap: https://www.indigoblueprint.my.id/sitemap.xml
`.trim();

  return new Response(robotsText, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
