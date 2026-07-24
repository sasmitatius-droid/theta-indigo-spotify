import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

function normalizePrivateKey(raw: string): string {
  let key = raw.trim();

  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }

  return key.replace(/\\n/g, '\n');
}

function parseServiceAccountJson() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };

    if (!parsed.private_key || !parsed.client_email || !parsed.project_id) {
      return null;
    }

    return {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: normalizePrivateKey(parsed.private_key),
    };
  } catch {
    return null;
  }
}

function buildCredential() {
  const serviceAccount = parseServiceAccountJson();
  if (serviceAccount) {
    return cert(serviceAccount);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    return null;
  }

  const privateKey = normalizePrivateKey(privateKeyRaw);
  return cert({ projectId, clientEmail, privateKey });
}

export function getFirebaseAdminDb(): Firestore | null {
  if (typeof window !== 'undefined') return null;

  try {
  const credential = buildCredential();
  if (!credential) return null;

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    parseServiceAccountJson()?.projectId;

  if (getApps().length === 0) {
    initializeApp({
      credential,
      projectId: projectId || undefined,
    });
  }

  return getFirestore();
  } catch (error) {
    console.error('Firebase Admin init failed:', error instanceof Error ? error.message : error);
    return null;
  }
}
