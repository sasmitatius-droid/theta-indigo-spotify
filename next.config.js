/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://*.firebaseapp.com https://identitytoolkit.googleapis.com https://app.midtrans.com https://app.sandbox.midtrans.com https://snap-assets.midtrans.com https://api.midtrans.com https://pay.google.com https://gwk.gopayapi.com https://www.googletagmanager.com https://o.alicdn.com https://g.alicdn.com https://cdn.tiny.cloud https://*.tiny.cloud;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://snap-assets.midtrans.com https://cdn.tiny.cloud https://*.tiny.cloud;
  font-src 'self' data: https://fonts.gstatic.com https://cdn.tiny.cloud;
  img-src 'self' data: blob: https:;
  frame-src 'self' https://apis.google.com https://*.firebaseapp.com https://theta-indigo.firebaseapp.com https://app.midtrans.com https://app.sandbox.midtrans.com https://pay.google.com;
  connect-src 'self' https: wss: https://*.tiny.cloud;
`.replace(/\s{2,}/g, ' ').trim();


module.exports = withPWA({
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Content-Security-Policy',
            value: ContentSecurityPolicy,
          },
        ],
      },
    ];
  },
});