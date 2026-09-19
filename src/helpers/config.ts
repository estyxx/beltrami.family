export const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY,
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

/**
 * Path to a Rootsy JSON export, relative to the project root. When set, the
 * tree is read from that file instead of Firestore, which is how you work on
 * the app against a fresh export without uploading it first.
 *
 * It is a `NEXT_PUBLIC_` variable because the browser has to know which source
 * to ask; the file itself is only ever read on the server, through
 * `/api/family-tree`, and never bundled.
 */
export const localFamilyDataPath =
	process.env.NEXT_PUBLIC_LOCAL_FAMILY_DATA_PATH || undefined;

/** Whether the tree comes from a local JSON export rather than Firestore. */
export const usesLocalFamilyData = Boolean(localFamilyDataPath);
