import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  memoryLocalCache
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfigJson from '../../firebase-applet-config.json';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId
};

const envDbId = import.meta.env.VITE_FIREBASE_DATABASE_ID;
export const databaseId =
  envDbId && !String(envDbId).endsWith('-default-rtdb')
    ? envDbId
    : firebaseConfigJson.firestoreDatabaseId;

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with robust settings
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    localCache: memoryLocalCache()
  }, databaseId);
} catch (err) {
  try {
    firestoreDb = initializeFirestore(app, {
      experimentalForceLongPolling: true
    }, databaseId);
  } catch (finalErr) {
    firestoreDb = initializeFirestore(app, {}, databaseId);
  }
}

export const db = firestoreDb;

export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

function fromFirestoreRestValue(val: any): any {
  if (!val || typeof val !== 'object') return undefined;
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('nullValue' in val) return null;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) {
    const values = val.arrayValue?.values;
    return Array.isArray(values) ? values.map(fromFirestoreRestValue) : [];
  }
  if ('mapValue' in val) {
    return fromFirestoreRestFields(val.mapValue?.fields);
  }
  return undefined;
}

export function fromFirestoreRestFields(fields: Record<string, any> | undefined): Record<string, any> {
  if (!fields || typeof fields !== 'object') return {};
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    result[k] = fromFirestoreRestValue(v);
  }
  return result;
}

function toFirestoreRestValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreRestValue) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        fields[k] = toFirestoreRestValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

/**
 * Stateless HTTP lookup for resolving phone number candidates to user email addresses.
 * Immune to Firestore WebChannel / LongPolling stream stalls.
 */
export async function queryEmailsByPhonesRest(phoneCandidates: string[], timeoutMs = 4500): Promise<string[]> {
  if (!phoneCandidates.length || !firebaseConfig.projectId) return [];
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(firebaseConfig.projectId)}/databases/${encodeURIComponent(databaseId)}/documents:runQuery${firebaseConfig.apiKey ? `?key=${encodeURIComponent(firebaseConfig.apiKey)}` : ''}`;

  const chunks: string[][] = [];
  for (let i = 0; i < phoneCandidates.length; i += 10) {
    chunks.push(phoneCandidates.slice(i, i + 10));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const responses = await Promise.all(
      chunks.map(async (chunk) => {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              structuredQuery: {
                from: [{ collectionId: 'users' }],
                where: {
                  fieldFilter: {
                    field: { fieldPath: 'phone' },
                    op: 'IN',
                    value: {
                      arrayValue: {
                        values: chunk.map((p) => ({ stringValue: p }))
                      }
                    }
                  }
                }
              }
            })
          });
          if (!res.ok) return [];
          const data = await res.json();
          return Array.isArray(data) ? data : [];
        } catch {
          return [];
        }
      })
    );

    const matchedDocs: Array<{ email: string; email_verified: boolean; created_at: string }> = [];
    for (const rows of responses) {
      for (const row of rows) {
        const fields = row?.document?.fields;
        if (fields) {
          const parsed = fromFirestoreRestFields(fields);
          const email = String(parsed.email || '').trim().toLowerCase();
          if (email) {
            matchedDocs.push({
              email,
              email_verified: parsed.email_verified === true,
              created_at: String(parsed.created_at || '')
            });
          }
        }
      }
    }

    matchedDocs.sort((a, b) => {
      const aVer = a.email_verified ? 1 : 0;
      const bVer = b.email_verified ? 1 : 0;
      if (aVer !== bVer) return bVer - aVer;
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });

    return Array.from(new Set(matchedDocs.map((d) => d.email)));
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Stateless HTTP read of a user profile document from Firestore REST API.
 */
export async function fetchUserDocRest(uid: string, idToken?: string, timeoutMs = 3500): Promise<Record<string, any> | null> {
  if (!uid || !firebaseConfig.projectId) return null;
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(firebaseConfig.projectId)}/databases/${encodeURIComponent(databaseId)}/documents/users/${encodeURIComponent(uid)}${firebaseConfig.apiKey ? `?key=${encodeURIComponent(firebaseConfig.apiKey)}` : ''}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers: Record<string, string> = {};
    if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
    const res = await fetch(url, { headers, signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.fields) return null;
    return fromFirestoreRestFields(data.fields);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Stateless HTTP write of a user profile document to Firestore REST API (fallback if SDK stream is slow).
 */
export async function upsertUserDocRest(uid: string, profileData: Record<string, any>, idToken?: string, timeoutMs = 5000): Promise<boolean> {
  if (!uid || !firebaseConfig.projectId) return false;
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(firebaseConfig.projectId)}/databases/${encodeURIComponent(databaseId)}/documents/users?documentId=${encodeURIComponent(uid)}${firebaseConfig.apiKey ? `&key=${encodeURIComponent(firebaseConfig.apiKey)}` : ''}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(profileData)) {
      if (v !== undefined) {
        fields[k] = toFirestoreRestValue(v);
      }
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
    const res = await fetch(url, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({ fields })
    });
    return res.ok || res.status === 409;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export default app;
