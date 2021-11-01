export const NOTION_DATABASE_ID_FAMILY_TREE: string =
	process.env.NOTION_DATABASE_ID_FAMILY_TREE || "";
export const NOTION_TOKEN: string = process.env.NOTION_TOKEN || "";

export const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY,
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
