import * as admin from 'firebase-admin';

// ─── Firestore init ────────────────────────────────────────────────────────────

let initialized = false;

export function initFirebase(): void {
  if (initialized || admin.apps.length > 0) {
    initialized = true;
    return;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON env var is required. ' +
      'Set it as a GitHub Secret (value = full content of the JSON key file).'
    );
  }

  const serviceAccount = JSON.parse(raw) as admin.ServiceAccount;

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  initialized = true;
  console.log('✅ Firebase Admin initialized (project: theta-indigo)');
}

function db() {
  initFirebase();
  return admin.firestore();
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PodcastEpisode {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  mp3Key: string;        // R2 object key e.g. "podcast/ep-xxx-1721634000000.mp3"
  mp3Url: string;        // Public URL e.g. "https://pub-xxx.r2.dev/podcast/ep-xxx.mp3"
  durationSec: number;   // Estimated duration in seconds
  fileSizeBytes: number; // MP3 file size in bytes
  publishedAt: string;   // ISO-8601 timestamp
  expiresAt: string;     // ISO-8601 timestamp (publishedAt + 24h)
  articleId: string;     // Original Theta Indigo blog article ID
}

// ─── Firestore Operations ──────────────────────────────────────────────────────

const COLLECTION = 'podcast_episodes';

/**
 * Save a new podcast episode record to Firestore.
 * Even after the R2 MP3 expires, this record remains for historical RSS.
 */
export async function saveEpisodeToFirestore(episode: PodcastEpisode): Promise<void> {
  await db().collection(COLLECTION).doc(episode.id).set(episode);
  console.log(`💾 Episode saved to Firestore: ${episode.id}`);
}

/**
 * Get recent episodes (last 30 days) ordered by newest first.
 * Used to build the RSS feed.
 */
export async function getRecentEpisodesFromFirestore(limit = 20): Promise<PodcastEpisode[]> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const snap = await db()
    .collection(COLLECTION)
    .where('publishedAt', '>=', since)
    .orderBy('publishedAt', 'desc')
    .limit(limit)
    .get();

  return snap.docs.map((d) => d.data() as PodcastEpisode);
}

/**
 * Mark an episode as having its R2 MP3 deleted (for tracking purposes).
 */
export async function markEpisodeMp3Deleted(episodeId: string): Promise<void> {
  await db()
    .collection(COLLECTION)
    .doc(episodeId)
    .update({
      mp3Deleted: true,
      deletedAt: new Date().toISOString(),
    });
}
