import { downloadJson, uploadJson } from './r2-client';

// ─── Category Pool ─────────────────────────────────────────────────────────────
// Mirrors BLOG_CATEGORY_PRESETS from the main theta-indigo Next.js app.

export const PODCAST_CATEGORIES = [
  'Umum',
  'Numerologi',
  'Human Design',
  'Chakra & Aura',
  'Tips Spiritual',
  'Kearifan Lokal',
  'Bazi',
  'Astrologi & Zodiak',
  'Wuku & Pranata Mangsa',
  'Weton Jawa',
  'Spiritual Jawa',
  'Fengshui',
] as const;

// ─── State ─────────────────────────────────────────────────────────────────────

const STATE_KEY = 'podcast/rotation-state.json';

interface RotationState {
  lastCategory: string;
  lastRunAt: string;
  runCount: number;
}

/**
 * Determine the next category in rotation.
 * State is persisted as JSON in R2 so it survives across GitHub Actions runs.
 */
export async function getNextCategory(): Promise<string> {
  const state = await downloadJson<RotationState>(STATE_KEY);

  if (!state?.lastCategory) {
    // First run ever — start at index 0
    return PODCAST_CATEGORIES[0];
  }

  const lastIdx = PODCAST_CATEGORIES.indexOf(
    state.lastCategory as typeof PODCAST_CATEGORIES[number]
  );
  const nextIdx =
    lastIdx === -1
      ? 0
      : (lastIdx + 1) % PODCAST_CATEGORIES.length;

  return PODCAST_CATEGORIES[nextIdx];
}

/**
 * Persist the category used in this run so the next run continues rotation.
 */
export async function saveLastCategory(category: string): Promise<void> {
  const current = (await downloadJson<RotationState>(STATE_KEY)) ?? { runCount: 0 };

  await uploadJson(STATE_KEY, {
    lastCategory: category,
    lastRunAt: new Date().toISOString(),
    runCount: (current.runCount ?? 0) + 1,
  } satisfies RotationState);

  console.log(
    `🔄 Category rotation saved: "${category}" ` +
    `(run #${(current.runCount ?? 0) + 1})`
  );
}
