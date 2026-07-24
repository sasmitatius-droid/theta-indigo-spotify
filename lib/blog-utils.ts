export const DEFAULT_BLOG_CATEGORY = 'Umum';

export const BLOG_CATEGORY_PRESETS = [
  'Umum',
  'Numerologi',
  'Human Design',
  'Chakra & Aura',
  'Tips Spiritual',
  'Kearifan Lokal',
  'Berita',
  'Bazi',
  'Astrologi & Zodiak',
  'Wuku & Pranata Mangsa',
  'Weton Jawa',
  'Spiritual Jawa',
  'Fengshui',
] as const;

export function slugifyCategory(category: string): string {
  return category
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/gi, '');
}

export function formatBlogDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function nowIso(): string {
  return new Date().toISOString();
}
