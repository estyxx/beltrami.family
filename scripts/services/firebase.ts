// scripts/services/firebase.ts

import * as fs from "node:fs";
import * as path from "node:path";
import { type ServiceAccount, cert, initializeApp } from "firebase-admin/app";
import { type Firestore, getFirestore } from "firebase-admin/firestore";

/**
 * Configuration for Firebase service initialization
 */
interface FirebaseConfig {
	serviceAccountPath: string;
}

/**
 * Service class to handle Firebase operations
 */
export class FirebaseService {
	private db: Firestore | null = null;

	/**
	 * Initializes Firebase Admin SDK with provided configuration
	 * @param config - Firebase configuration object
	 * @throws Error if service account file is not found or invalid
	 */
	async initialize(config: FirebaseConfig): Promise<Firestore> {
		try {
			const absolutePath = path.resolve(
				process.cwd(),
				config.serviceAccountPath,
			);

			if (!fs.existsSync(absolutePath)) {
				throw new Error(`Service account file not found at: ${absolutePath}`);
			}

			const serviceAccount = JSON.parse(
				fs.readFileSync(absolutePath, "utf8"),
			) as ServiceAccount;

			initializeApp({
				credential: cert(serviceAccount),
			});

			this.db = getFirestore();
			return this.db;
		} catch (error) {
			throw new Error(
				`Failed to initialize Firebase: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * Gets the Firestore instance
	 * @throws Error if Firebase is not initialized
	 */
	getDb(): Firestore {
		if (!this.db) {
			throw new Error("Firebase not initialized. Call initialize() first.");
		}
		return this.db;
	}
}
