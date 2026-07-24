/**
 * Memecah teks panjang menjadi paragraf per kalimat (setelah . ! ?)
 * agar lebih enak dibaca di layar dan WhatsApp.
 */
export function splitIntoParagraphs(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  if (normalized.includes('\n\n')) {
    return normalized
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\n/g, ' ').trim())
      .filter(Boolean);
  }

  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (sentences.length <= 1) {
    return [normalized];
  }

  return sentences;
}

/** Gabung paragraf dengan jarak ganda (WhatsApp / clipboard) */
export function formatParagraphsForShare(text: string): string {
  return splitIntoParagraphs(text).join('\n\n');
}

/** Gabung paragraf untuk PDF (double newline) */
export function formatParagraphsForPrint(text: string): string {
  return splitIntoParagraphs(text).join('\n\n');
}
