// scripts/firebase/upload-family-data.ts

import type { Firestore } from "firebase-admin/firestore";
import { FirebaseService } from "../services/firebase";
import type { FamilyData } from "../types";
import { getDocumentId, readFamilyTreeFile } from "../utils/file-utils";

/**
 * Configuration for the upload process
 */
interface UploadConfig {
	inputFilePath: string;
	collectionName: string;
	serviceAccountPath: string;
}

/**
 * Handles the upload of family tree data to Firestore
 */
class FamilyTreeUploader {
	private readonly firebaseService: FirebaseService;

	constructor() {
		this.firebaseService = new FirebaseService();
	}

	/**
	 * Uploads family tree data to Firestore
	 * @param db - Firestore instance
	 * @param data - Family tree data to upload
	 * @param config - Upload configuration
	 */
	private async uploadToFirestore(
		db: Firestore,
		data: FamilyData,
		config: UploadConfig,
	): Promise<void> {
		const documentId = getDocumentId(config.inputFilePath);
		console.log(`Uploading to ${config.collectionName}/${documentId}...`);

		const docRef = db.collection(config.collectionName).doc(documentId);
		await docRef.set(data);

		console.log("Upload successful!");
	}

	/**
	 * Executes the upload process
	 * @param config - Upload configuration
	 */
	async execute(config: UploadConfig): Promise<void> {
		try {
			// Initialize Firebase
			const db = await this.firebaseService.initialize({
				serviceAccountPath: config.serviceAccountPath,
			});

			// Read and parse family tree data
			console.log(`Reading data from ${config.inputFilePath}...`);
			const familyData = readFamilyTreeFile(config.inputFilePath);

			// Upload to Firestore
			await this.uploadToFirestore(db, familyData, config);
		} catch (error) {
			throw new Error(
				`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
	const inputFile = process.argv[2];

	if (!inputFile) {
		console.error("Please provide a file path as an argument");
		console.log("Example: pnpm upload-tree ./data/beltrami-family.json");
		process.exit(1);
	}

	const config: UploadConfig = {
		inputFilePath: inputFile,
		collectionName: "familyTrees",
		serviceAccountPath: "config/firebase/service-account.json",
	};

	try {
		const uploader = new FamilyTreeUploader();
		await uploader.execute(config);
		process.exit(0);
	} catch (error) {
		console.error(error instanceof Error ? error.message : "Unknown error");
		process.exit(1);
	}
}

// Run the script with error handling
main().catch((error) => {
	console.error("Unhandled error:", error);
	process.exit(1);
});
