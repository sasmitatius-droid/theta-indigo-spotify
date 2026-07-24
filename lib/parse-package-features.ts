/** Parse deskripsi paket multiline / bullet menjadi array baris. */
export function parseFeaturesText(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function featuresToEditorText(features: string[] | string | undefined): string {
  if (typeof features === 'string') return features;
  if (!Array.isArray(features)) return '';
  return features.join('\n');
}

export function isFeatureHeading(line: string): boolean {
  const t = line.trim();
  return t.endsWith(':') && !/^[\*\-•]/.test(t);
}

export function featureBulletText(line: string): string {
  return line.replace(/^[\*\-•]\s*/, '').trim();
}
